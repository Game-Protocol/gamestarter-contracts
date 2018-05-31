pragma solidity ^0.4.24;

import "../token/SubToken.sol";

/**
 * @title MockToken
 */
contract MockToken is SubToken
{
    /**
    * @dev Constructor that gives msg.sender all of existing tokens
    */
    constructor() public SubToken("Sub Token", "ST") {
    }
}