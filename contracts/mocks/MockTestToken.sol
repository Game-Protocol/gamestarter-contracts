pragma solidity ^0.4.24;

import "../token/GameToken.sol";

/**
 * @title MockToken
 */
contract MockTestToken is GameToken
{
    /**
    * @dev Constructor that gives msg.sender all of existing tokens
    */
    constructor() public GameToken("MockTestToken", "MTT") {
        paused = false;
    }
}