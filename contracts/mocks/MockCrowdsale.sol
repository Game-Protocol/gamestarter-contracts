pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/crowdsale/emission/MintedCrowdsale.sol";
import "openzeppelin-solidity/contracts/access/SignatureBouncer.sol";
import "openzeppelin-solidity/contracts/token/ERC20/MintableToken.sol";
import "../payment/RefundEscrowWithFee.sol";
import "../crowdsale/distribution/RefundableCrowdsaleWithFee.sol";

/**
 * @title MockCrowdsale
 * @dev GameToken Crowdsale contract.
 */
contract MockCrowdsale is RefundableCrowdsaleWithFee, MintedCrowdsale, SignatureBouncer {

    constructor (
        uint256 _openingTime,
        uint256 _closingTime,
        uint256 _rate,
        address _wallet,
        MintableToken _token,
        uint256 _goal,
        address _feeWallet, 
        uint8 _feePercent
    )
        public
        Crowdsale(_rate, _wallet, _token)
        TimedCrowdsale(_openingTime, _closingTime)
        RefundableCrowdsaleWithFee(_goal, _feeWallet, _feePercent)
    {

    }

}