pragma solidity ^0.4.24;

import "./bancor/SmartToken.sol";

/**
 * @title GXToken
 * @dev Game Protocol Token
 * Inherited from BaseToken
 * SmartToken inheritence for bancor integration.
 * When deployed will start with a paused state until crowdsale is finished.
 */
contract GXToken is SmartToken
{
    /**
    * @dev Constructor that pauses the token at the start until the end of the crowdsale
    */
    constructor() public SmartToken("Game Protocol Token", "GXT", 18) {
        paused = true;
    }
}