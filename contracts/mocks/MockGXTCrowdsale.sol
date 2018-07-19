pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/crowdsale/emission/MintedCrowdsale.sol";
import "../crowdsale/validation/TwoWayWhitelistedCrowdsale.sol";
import "../token/GXToken.sol";

/**
 * @title MockGXTCrowdsale
 */
contract MockGXTCrowdsale is TwoWayWhitelistedCrowdsale, MintedCrowdsale {

    constructor (
        uint256 _rate,
        address _wallet,
        GXToken _token
    ) 
        public
        Crowdsale(_rate, _wallet, _token)
    {
    }

    function claimTokenOwnership() public onlyOwner {
        GXToken(token).claimOwnership();
    }
}