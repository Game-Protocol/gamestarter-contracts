pragma solidity ^0.4.24;

import "../crowdsale/validation/TwoWayWhitelistedCrowdsale.sol";
import "../token/GPToken.sol";

/**
 * @title MockTwoWayWhitelistedCrowdsale
 */
contract MockTwoWayWhitelistedCrowdsale is TwoWayWhitelistedCrowdsale {

    constructor (
        uint256 _rate,
        address _wallet,
        GPToken _token
    ) 
        public
        Crowdsale(_rate, _wallet, _token)
    {
    }
}