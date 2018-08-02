pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/crowdsale/emission/MintedCrowdsale.sol";
import "openzeppelin-solidity/contracts/crowdsale/Crowdsale.sol";
import "openzeppelin-solidity/contracts/access/Whitelist.sol";
import "openzeppelin-solidity/contracts/access/SignatureBouncer.sol";
import "../token/GameToken.sol";
import "../payment/RefundEscrowWithFee.sol";
import "../crowdsale/distribution/RefundableCrowdsale.sol";
import "../crowdsale/validation/TwoWayWhitelistedCrowdsale.sol";
import "../library/AutoIncrementing.sol";

/**
 * @title GameTokenCrowdsale
 * @dev GameToken Crowdsale contract.
 */
contract GameTokenCrowdsale is RefundableCrowdsale, MintedCrowdsale, SignatureBouncer {

    struct Package {
        uint256 package_id;
        uint256 start_time;
        uint256 end_time;
        string package_name;
        uint256 min_wei;
        uint rate;
        uint total_amount;
        uint amount_sold;
        uint256 total_wei;
        uint256 wei_sold;
    }

    address public feeWallet;
    uint8 public feePercent;

    AutoIncrementing.Counter internal packageIdCounter;

    mapping(uint256 => Package) public packages;

    event PackageIssued(address indexed beneficiary, uint256 indexed packageId);

    constructor (
        uint256 _goal,
        uint256 _openingTime,
        uint256 _closingTime,
        uint256 _rate,
        address _wallet,
        address _feeWallet, 
        uint8 _feePercent,
        GameToken _token
    ) 
        public
        Crowdsale(_rate, _wallet, _token)
        RefundableCrowdsale(_goal)
        TimedCrowdsale(_openingTime, _closingTime)
    {
        feeWallet = _feeWallet;
        feePercent = _feePercent;
    }

    function addPackage(
        uint256 _startTime,
        uint256 _endTime,
        string _packageName,
        uint256 _minWei,
        uint _rate,
        uint _totalAmount,
        uint256 _totalWei
    ) 
    public 
    {
        uint256 id = AutoIncrementing.nextId(packageIdCounter);
        Package memory p = Package(id, _startTime, _endTime, _packageName, _minWei, _rate, _totalAmount, 0, _totalWei, 0);
        packages[id] = p;
    }

    // =================================================================================================================
    //                                      Package Management
    // ================================================================================================================= 

    modifier _validatePackage(uint256 _weiAmount, uint256 _packageId) {
        Package storage p = packages[_packageId];
        // solium-disable-next-line security/no-block-members
        require(now >= p.start_time && now <= p.end_time);
        require(p.amount_sold < p.total_amount);
        require(p.min_wei <= _weiAmount && p.wei_sold.add(_weiAmount) <= p.total_wei);
        _;
    }

    // =================================================================================================================
    //                                      Impl RefundableCrowdsale
    // =================================================================================================================

    function _createEscrow() internal {
        escrow = new RefundEscrowWithFee(wallet, feeWallet, feePercent);
    }

    // =================================================================================================================
    //                                      Impl FinalizableCrowdsale
    // =================================================================================================================

    function finalization() internal onlyOwner {
        super.finalization();

        // Disable token minting from this point
        GameToken(token).finishMinting();

        // Re-enable transfers and burn after the token sale.
        GameToken(token).unpause();

        // Transfer ownership of the token to the owner of the crowdsale
        GameToken(token).transferOwnership(owner);
    } 

    // =================================================================================================================
    //                                      Impl Crowdsale
    // =================================================================================================================

    /**
     * @dev Disable standard validation - use only buyPackage(address _beneficiary, uint256 _packageId, bytes _sig)
     * @param _beneficiary Token purchaser
     * @param _weiAmount Amount of wei contributed
     */
    function _preValidatePurchase(address _beneficiary, uint256 _weiAmount) internal {
        revert();
    }

    /**
     * @dev Extend parent behavior requiring purchase to validate package
     * @param _beneficiary Token purchaser
     * @param _weiAmount Amount of wei contributed
     * @param _packageId Package id of the package being purchased
     * @param _sig Signature for whitelisting
     */
    function _preValidatePurchase(address _beneficiary, uint256 _weiAmount, uint256 _packageId, bytes _sig) internal 
        onlyValidSignature(_sig) 
        _validatePackage(_weiAmount, _packageId) 
    {
        super._preValidatePurchase(_beneficiary, _weiAmount);
    }

    /**
     * @dev Update package amount sold and wei sold
     * @param _beneficiary Address receiving the tokens
     * @param _weiAmount Value in wei involved in the purchase
     * @param _packageId Package id of the package being purchased
     */
    function _updatePurchasingState(address _beneficiary, uint256 _weiAmount, uint256 _packageId) internal {
        super._updatePurchasingState(_beneficiary, _weiAmount);
        Package storage p = packages[_packageId];
        p.amount_sold = p.amount_sold + 1;
        p.wei_sold = p.wei_sold + _weiAmount;
        emit PackageIssued(_beneficiary, _packageId);
    }

    /**
     * @return The token amount according to the rate of the package
     */
    function _getTokenAmount(uint256 _weiAmount, uint256 _packageId) internal view returns(uint256) {
        return _weiAmount.mul(packages[_packageId].rate); 
    }

    /**
   * @dev low level token purchase - Overriden to add parameters
   * @param _beneficiary Address performing the token purchase
   * @param _packageId Package id of the package being purchased
   * @param _sig Signature for whitelisting
   */
    function buyPackage(address _beneficiary, uint256 _packageId, bytes _sig)  public payable {
        uint256 weiAmount = msg.value;
        _preValidatePurchase(_beneficiary, weiAmount, _packageId, _sig);

        // calculate token amount to be created
        uint256 tokens = _getTokenAmount(weiAmount, _packageId);

        // update state
        weiRaised = weiRaised.add(weiAmount);

        _processPurchase(_beneficiary, tokens);
        emit TokenPurchase(
            msg.sender,
            _beneficiary,
            weiAmount,
            tokens
        );

        _updatePurchasingState(_beneficiary, weiAmount, _packageId);

        _forwardFunds();
        _postValidatePurchase(_beneficiary, weiAmount);
    }
}