pragma solidity ^0.4.24;

import "../token/bancor/SmartToken.sol";

/**
 * @title MockToken
 */
contract MockSmartToken is SmartToken
{
    /**
    * @dev Constructor that gives msg.sender all of existing tokens
    */
    constructor(string _name, string _symbol) public SmartToken(_name, _symbol, 18) {
    }
}