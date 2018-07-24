pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/access/Whitelist.sol";
import "openzeppelin-solidity/contracts/access/SignatureBouncer.sol";
import "openzeppelin-solidity/contracts/crowdsale/Crowdsale.sol";

contract TwoWayWhitelistedCrowdsale is Crowdsale, Whitelist, SignatureBouncer {

    /**
    * @dev buyTokensSigned, buy tokens with an off chain whitelisting method using signature.
    */
    function buyTokensSigned(address _beneficiary, bytes _sig) onlyValidSignature(_sig) public payable {
        super.buyTokens(_beneficiary);
    }

    /**
    * @dev Override buyToken for the on chain whitelisting method
    */
    function buyTokens(address _beneficiary) onlyIfWhitelisted(_beneficiary) public payable {
        super.buyTokens(_beneficiary);
    }
}