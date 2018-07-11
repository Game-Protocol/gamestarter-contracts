pragma solidity ^0.4.24;

import "../token/GameToken.sol";
import "../payment/RefundEscrowWithFee.sol";
import "openzeppelin-solidity/contracts/crowdsale/distribution/FinalizableCrowdsale.sol";
import "openzeppelin-solidity/contracts/crowdsale/emission/MintedCrowdsale.sol";
import "openzeppelin-solidity/contracts/crowdsale/Crowdsale.sol";
// import "openzeppelin-solidity/contracts/math/SafeMath.sol";

/**
 * @title GameTokenCrowdsale
 * @dev GameToken Crowdsale contract.
 * The way to add new features to a base crowdsale is by multiple inheritance.
 * After adding multiple features it's good practice to run integration tests
 * to ensure that subcontracts works together as intended.
 */
contract GameTokenCrowdsale is FinalizableCrowdsale, MintedCrowdsale {
    using SafeMath for uint256;

    // minimum amount of funds to be raised in weis
    uint256 public goal;

    // refund escrow used to hold funds while crowdsale is running
    RefundEscrowWithFee private escrow;

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
        TimedCrowdsale(_openingTime, _closingTime)
    {
        require(_goal > 0);
        escrow = new RefundEscrowWithFee(wallet, _feeWallet, _feePercent);
        goal = _goal;
    }

    /**
    * @dev Checks whether funding goal was reached.
    * @return Whether funding goal was reached
    */
    function goalReached() public view returns (bool) {
        return weiRaised >= goal;
    }

    /**
    * @dev Investors can claim refunds here if crowdsale is unsuccessful
    */
    function claimRefund() public {
        require(isFinalized);
        require(!goalReached());

        escrow.withdraw(msg.sender);
    }

    /**
    * @dev Overrides Crowdsale fund forwarding, sending funds to escrow.
    */
    function _forwardFunds() internal {
        escrow.deposit.value(msg.value)(msg.sender);
    }

    // =================================================================================================================
    //                                      Impl FinalizableCrowdsale
    // =================================================================================================================

    function finalization() internal onlyOwner {
        if (goalReached()) {
            escrow.close();
            escrow.beneficiaryWithdraw();
        } else {
            escrow.enableRefunds();
        }

        super.finalization();

        // Disable token minting from this point
        GameToken(token).finishMinting();

        // Re-enable transfers and burn after the token sale.
        GameToken(token).unpause();

        // Transfer ownership of the token to the owner of the crowdsale
        GameToken(token).transferOwnership(owner);
    }
}