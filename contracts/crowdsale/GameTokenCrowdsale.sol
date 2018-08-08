pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/crowdsale/emission/MintedCrowdsale.sol";
import "openzeppelin-solidity/contracts/access/SignatureBouncer.sol";
import "../token/GameToken.sol";
import "../payment/RefundEscrowWithFee.sol";
import "../crowdsale/distribution/RefundableCrowdsaleWithFee.sol";

/**
 * @title GameTokenCrowdsale
 * @dev GameToken Crowdsale contract.
 */
contract GameTokenCrowdsale is RefundableCrowdsaleWithFee, MintedCrowdsale, SignatureBouncer {

    struct Package {
        uint package_id;
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

    uint public packageCount;
    Package[] public packages;

    event PackageAdded(uint id, string name);
    event PackageIssued(address indexed beneficiary, uint indexed packageId);

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
        TimedCrowdsale(_openingTime, _closingTime)
        RefundableCrowdsaleWithFee(_goal, _feeWallet, _feePercent)
    {
        packageCount = 0;
    }

    // =================================================================================================================
    //                                      Package Management
    // ================================================================================================================= 

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
    onlyOwner
    {
        // solium-disable-next-line security/no-block-members
        require(now < _endTime);
        require(_totalAmount > 0);
        require(_totalWei > 0);
        Package memory p = Package(packageCount, _startTime, _endTime, _packageName, _minWei, _rate, _totalAmount, 0, _totalWei, 0);
        packages.push(p);
        emit PackageAdded(packageCount, _packageName);
        packageCount = packageCount + 1;
    }

    modifier _validatePackage(uint256 _weiAmount, uint _packageIdx) {
        Package storage p = packages[_packageIdx];
        // solium-disable-next-line security/no-block-members
        require(now >= p.start_time && now <= p.end_time);
        require(p.amount_sold < p.total_amount);
        require(p.min_wei <= _weiAmount && p.wei_sold.add(_weiAmount) <= p.total_wei);
        _;
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
     * @dev Disable standard validation - use only buyPackage(address _beneficiary, uint256 _packageIdx, bytes _sig)
     */
    function _preValidatePurchase(address, uint256) internal {
        revert();
    }

    /**
     * @dev Extend parent behavior requiring purchase to validate package
     * @param _beneficiary Token purchaser
     * @param _weiAmount Amount of wei contributed
     * @param _packageIdx Package idx of the package being purchased
     * @param _sig Signature for whitelisting
     */
    function _preValidatePurchase(address _beneficiary, uint256 _weiAmount, uint _packageIdx, bytes _sig) internal 
        onlyValidSignature(_sig) 
        _validatePackage(_weiAmount, _packageIdx) 
    {
        super._preValidatePurchase(_beneficiary, _weiAmount);
    }

    /**
     * @dev Update package amount sold and wei sold
     * @param _beneficiary Address receiving the tokens
     * @param _weiAmount Value in wei involved in the purchase
     * @param _packageIdx Package id of the package being purchased
     */
    function _updatePurchasingState(address _beneficiary, uint256 _weiAmount, uint _packageIdx) internal {
        super._updatePurchasingState(_beneficiary, _weiAmount);
        Package storage p = packages[_packageIdx];
        p.amount_sold = p.amount_sold + 1;
        p.wei_sold = p.wei_sold + _weiAmount;
        emit PackageIssued(_beneficiary, _packageIdx);
    }

    /**
     * @return The token amount according to the rate of the package
     */
    function _getTokenAmount(uint256 _weiAmount, uint _packageIdx) internal view returns(uint256) {
        return _weiAmount.mul(packages[_packageIdx].rate); 
    }

    /**
   * @dev low level token purchase - Overriden to add parameters
   * @param _beneficiary Address performing the token purchase
   * @param _packageIdx Package id of the package being purchased
   * @param _sig Signature for whitelisting
   */
    function buyPackage(address _beneficiary, uint _packageIdx, bytes _sig)  public payable {
        uint256 weiAmount = msg.value;
        _preValidatePurchase(_beneficiary, weiAmount, _packageIdx, _sig);

        // calculate token amount to be created
        uint256 tokens = _getTokenAmount(weiAmount, _packageIdx);

        // update state
        weiRaised = weiRaised.add(weiAmount);

        _processPurchase(_beneficiary, tokens);
        emit TokenPurchase(
            msg.sender,
            _beneficiary,
            weiAmount,
            tokens
        );

        _updatePurchasingState(_beneficiary, weiAmount, _packageIdx);

        _forwardFunds();
        _postValidatePurchase(_beneficiary, weiAmount);
    }
}