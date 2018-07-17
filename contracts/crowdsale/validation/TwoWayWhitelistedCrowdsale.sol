pragma solidity ^0.4.24;

import "../../access/Whitelist.sol";
import "../../access/ControlledAccess.sol";
import "openzeppelin-solidity/contracts/crowdsale/Crowdsale.sol";

contract TwoWayWhitelistedCrowdsale is Crowdsale, Whitelist, ControlledAccess {

    /**
    * @dev buyTokensSecure, buy tokens with an off chain whitelisting method.
    */
    function buyTokensSecure(uint8 _v, bytes32 _r, bytes32 _s) onlyValidAccess(_v,_r,_s) public payable {
        super.buyTokens(msg.sender);
    }

    /**
    * @dev Override buyToken for the on chain whitelisting method
    */
    function buyTokens(address _beneficiary) onlyIfWhitelisted(_beneficiary) public payable {
        super.buyTokens(_beneficiary);
    }
}