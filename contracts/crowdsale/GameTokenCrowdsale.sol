pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/crowdsale/emission/MintedCrowdsale.sol";
import "openzeppelin-solidity/contracts/crowdsale/Crowdsale.sol";
import "../token/GameToken.sol";
import "../payment/RefundEscrowWithFee.sol";
import "../crowdsale/distribution/RefundableCrowdsale.sol";
import "../crowdsale/validation/TwoWayWhitelistedCrowdsale.sol";
import "openzeppelin-solidity/contracts/access/Whitelist.sol";
import "openzeppelin-solidity/contracts/access/SignatureBouncer.sol";

/**
 * @title GameTokenCrowdsale
 * @dev GameToken Crowdsale contract.
 * The way to add new features to a base crowdsale is by multiple inheritance.
 * After adding multiple features it's good practice to run integration tests
 * to ensure that subcontracts works together as intended.
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
        uint amount_left;
        uint256 total_wei;
        uint256 wei_left;
    }

    address public feeWallet;
    uint8 public feePercent;

    mapping(uint256 => Package) public packages;

    event PackageIssued(address indexed _beneficiary, uint256 indexed _packageId);

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

    // =================================================================================================================
    //                                      Package Management
    // ================================================================================================================= 

    modifier validatePackage(uint256 _weiAmount, uint256 _packageId) {
        Package storage p = packages[_packageId];
        // solium-disable-next-line security/no-block-members
        require(block.timestamp >= p.start_time && block.timestamp <= p.end_time);
        require(p.amount_left > 0);
        require(p.min_wei <= _weiAmount && _weiAmount <= p.wei_left);
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
     * @dev Extend parent behavior requiring purchase to validate package
     * @param _beneficiary Token purchaser
     * @param _weiAmount Amount of wei contributed
     */
    function _preValidatePurchase(address _beneficiary, uint256 _weiAmount, uint256 _packageId, bytes _sig) internal 
        onlyValidSignature(_sig) 
        validatePackage(_weiAmount, _packageId) 
    {
        super._preValidatePurchase(_beneficiary, _weiAmount);
        Package storage p = packages[_packageId];
        require(p.amount_left > 0);
        require(p.min_wei <= _weiAmount);
    }

    /** 
     * @dev Executed when a purchase has been validated and is ready to be executed. Not necessarily emits/sends tokens.
     * @param _beneficiary Address receiving the tokens
     * @param _tokenAmount Number of tokens to be purchased
     */
    function _processPurchase(address _beneficiary, uint256 _tokens, uint256 _packageId) internal {
        super._processPurchase(_beneficiary, _tokens);
        Package storage p = packages[_packageId];
        p.amount_left = p.amount_left - 1;
        emit PackageIssued(_beneficiary, _packageId);
    }

    /**
     * @return The token amount according to the rate of the package
     */
    function _getTokenAmount(uint256 _weiAmount, uint256 _packageId) internal returns(uint256 tokens) {
        Package storage p = packages[_packageId];
        return _weiAmount.mul(p.rate); 
    }

    function buyPackage(address _beneficiary, uint256 _packageId, bytes _sig)  public payable {
        uint256 weiAmount = msg.value;
        _preValidatePurchase(_beneficiary, weiAmount, _packageId, _sig);

        // calculate token amount to be created
        uint256 tokens = _getTokenAmount(weiAmount, _packageId);

        // update state
        weiRaised = weiRaised.add(weiAmount);

        _processPurchase(_beneficiary, tokens, _packageId);
        emit TokenPurchase(
            msg.sender,
            _beneficiary,
            weiAmount,
            tokens
        );

        _updatePurchasingState(_beneficiary, weiAmount);

        _forwardFunds();
        _postValidatePurchase(_beneficiary, weiAmount);
    }

    /**
     * @dev fallback function ***DO NOT OVERRIDE***
     */
    function () external payable {
        buyTokens(msg.sender);
    }
}