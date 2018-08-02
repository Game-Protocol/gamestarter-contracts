pragma solidity ^0.4.24;

import "./GameToken.sol";


/**
 * @title BackgammonToken
 */
contract BackgammonToken is GameToken {

    constructor() public GameToken("Backgammon Token", "BGT") {
    }
}