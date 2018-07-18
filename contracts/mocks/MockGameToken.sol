pragma solidity ^0.4.24;

import "../token/GameToken.sol";

/**
 * @title MockToken
 */
contract MockGameToken is GameToken
{
    constructor(string _name) public GameToken(_name, "MGT") {
    }
}