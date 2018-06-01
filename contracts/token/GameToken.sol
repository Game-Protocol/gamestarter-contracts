pragma solidity ^0.4.24;

import "./BaseToken.sol";

/**
 * @title GameToken
 * @dev Game Token - base token for all game starter games
 * Inherited from BaseToken
 * When deployed will start with a paused state until crowdsale is finished.
 */
contract GameToken is BaseToken
{
    /**
    * @dev Constructor that pauses the token at the start until the end of the crowdsale
    */
    constructor(string _name, string _symbol) public BaseToken(_name, _symbol, 18) {
        paused = true;
    }
}