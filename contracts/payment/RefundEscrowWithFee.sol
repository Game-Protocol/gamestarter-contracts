pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/payment/RefundEscrow.sol";

/**
 * @title RefundEscrowWithFee
 * @dev RefundEscrow with fee.
 */
contract RefundEscrowWithFee is RefundEscrow {

    address public feeWallet;
    uint8 public feePercent;

    /**
    * @dev Constructor.
    * @param _beneficiary The beneficiary of the deposits.
    * @param _feeWallet The Wallet to deposit the fee.
    * @param _feePercent The percent of the deposits that will be transfered to the fee wallet.
    */
    constructor(address _beneficiary, address _feeWallet, uint8 _feePercent) public RefundEscrow(_beneficiary) {
        require(_feeWallet != address(0), "Fee wallet is '0x0'");
        require(_feePercent > 0 && _feePercent < 100, "Fee percent is invalid");
        feeWallet = _feeWallet;
        feePercent = _feePercent;
    }

    /**
    * @dev Withdraws the beneficiary's funds after transfering the fee to the fee wallet
    */
    function beneficiaryWithdraw() public {
        require(state == State.Closed, "State is not closed");
        uint256 fee = address(this).balance.mul(feePercent).div(100);
        feeWallet.transfer(fee);
        super.beneficiaryWithdraw();
    }
}