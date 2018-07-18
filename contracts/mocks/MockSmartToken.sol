pragma solidity ^0.4.24;

import "../token/bancor/SmartToken.sol";

/**
 * @title MockToken
 */
contract MockSmartToken is SmartToken
{
    constructor(string _name, string _symbol) public SmartToken(_name, _symbol, 18) {
    }
}