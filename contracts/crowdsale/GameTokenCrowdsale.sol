pragma solidity ^0.4.24;

import "../token/GameToken.sol";
import "../payment/RefundEscrowWithFee.sol";
import "openzeppelin-solidity/contracts/crowdsale/distribution/FinalizableCrowdsale.sol";
import "openzeppelin-solidity/contracts/crowdsale/emission/MintedCrowdsale.sol";
import "openzeppelin-solidity/contracts/crowdsale/Crowdsale.sol";
import "./distribution/RefundableCrowdsale.sol";

/**
 * @title GameTokenCrowdsale
 * @dev GameToken Crowdsale contract.
 * The way to add new features to a base crowdsale is by multiple inheritance.
 * After adding multiple features it's good practice to run integration tests
 * to ensure that subcontracts works together as intended.
 */
contract GameTokenCrowdsale is RefundableCrowdsale, MintedCrowdsale {

    address public feeWallet;
    uint8 public feePercent;

    constructor (
        uint _goal,
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
}