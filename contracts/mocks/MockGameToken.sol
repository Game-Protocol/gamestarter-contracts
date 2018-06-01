pragma solidity ^0.4.24;

import "../token/GameToken.sol";

/**
 * @title MockToken
 */
contract MockGameToken is GameToken
{
    /**
    * @dev Constructor that gives msg.sender all of existing tokens
    */
    constructor() public GameToken("Sub Token", "ST") {
    }
}