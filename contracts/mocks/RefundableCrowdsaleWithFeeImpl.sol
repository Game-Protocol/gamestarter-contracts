pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/crowdsale/emission/MintedCrowdsale.sol";
import "openzeppelin-solidity/contracts/token/ERC20/MintableToken.sol";
import "../crowdsale/distribution/RefundableCrowdsaleWithFee.sol";

/**
 * @title RefundableCrowdsaleWithFeeImpl
 * @dev Refundable crowdsale with fee contract.
 */
contract RefundableCrowdsaleWithFeeImpl is RefundableCrowdsaleWithFee, MintedCrowdsale {

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