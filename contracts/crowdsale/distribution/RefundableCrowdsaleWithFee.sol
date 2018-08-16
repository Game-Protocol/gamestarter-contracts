pragma solidity ^0.4.24;


import "openzeppelin-solidity/contracts/crowdsale/distribution/FinalizableCrowdsale.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "../../payment/RefundEscrowWithFee.sol";

/**
 * @title RefundableCrowdsale
 * @dev Extension of Crowdsale contract that adds a funding goal, and
 * the possibility of users getting a refund if goal is not met.
 */
contract RefundableCrowdsaleWithFee is FinalizableCrowdsale {
    using SafeMath for uint256;

    // minimum amount of funds to be raised in weis
    uint256 public goal;

    // refund escrow used to hold funds while crowdsale is running
    RefundEscrow internal escrow;

    /**
    * @dev Constructor, creates RefundEscrow.
    * @param _goal Funding goal
    */
    constructor(uint256 _goal, address _feeWallet, uint8 _feePercent) public {
        require(_goal > 0, "Goal is negative or zero");
        escrow = new RefundEscrowWithFee(wallet, _feeWallet, _feePercent);
        goal = _goal;
    }

    /**
    * @dev Investors can claim refunds here if crowdsale is unsuccessful
    */
    function claimRefund() public {
        require(isFinalized, "Crowdsale is not finalized yet");
        require(!goalReached(), "Goal of the crowdsale is reached");

        escrow.withdraw(msg.sender);
    }

    /**
    * @dev Checks whether funding goal was reached.
    * @return Whether funding goal was reached
    */
    function goalReached() public view returns (bool) {
        return weiRaised >= goal;
    }

    /**
    * @dev escrow finalization task, called when owner calls finalize()
    */
    function finalization() internal {
        _finilizeEscrow();
        super.finalization();
    }

    /**
    * @dev escrow finalization
    * Override for other escrow types
    */
    function _finilizeEscrow() internal {
        if (goalReached()) {
            escrow.close();
            escrow.beneficiaryWithdraw();
        } else {
            escrow.enableRefunds();
        }
    }

    /**
    * @dev Overrides Crowdsale fund forwarding, sending funds to escrow.
    */
    function _forwardFunds() internal {
        escrow.deposit.value(msg.value)(msg.sender);
    }
}