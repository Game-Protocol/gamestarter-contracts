pragma solidity ^0.4.24;

import "./RefundEscrow.sol";

/**
 * @title RefundEscrowWithFee
 * @dev Escrow that holds funds for a beneficiary, deposited from multiple parties.
 * The contract owner may close the deposit period, and allow for either withdrawal
 * by the beneficiary, or refunds to the depositors.
 */
contract RefundEscrowWithFee is RefundEscrow {

    address public feeWallet;
    uint8 public feePercent;

    /**
    * @dev Constructor.
    * @param _beneficiary The beneficiary of the deposits.
    */
    constructor(address _beneficiary, address _feeWallet, uint8 _feePercent) public RefundEscrow(_beneficiary) {
        require(_feeWallet != address(0));
        require(_feePercent > 0 && _feePercent < 100);
        feeWallet = _feeWallet;
        feePercent = _feePercent;
        state = State.Active;
    }

    /**
    * @dev Withdraws the beneficiary's funds.
    */
    function beneficiaryWithdraw() public {
        require(state == State.Closed);
        uint256 fee = address(this).balance.mul(feePercent).div(100);
        feeWallet.transfer(fee);
        beneficiary.transfer(address(this).balance);
    }
}