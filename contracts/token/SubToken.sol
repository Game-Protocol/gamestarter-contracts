pragma solidity ^0.4.23;

import "openzeppelin-solidity/contracts/ownership/NoOwner.sol";
import "openzeppelin-solidity/contracts/token/ERC20/PausableToken.sol";
import "openzeppelin-solidity/contracts/token/ERC20/DetailedERC20.sol";
import "openzeppelin-solidity/contracts/token/ERC20/BurnableToken.sol";
import "openzeppelin-solidity/contracts/token/ERC20/MintableToken.sol";

/**
 * @title SubToken
 * @dev Sub Token
 * Inherited from PausableToken, BurnableToken, DetailedERC20, MintableToken, NoOwner
 * When deployed will start with a paused state until crowdsale is finished.
 */
contract SubToken is PausableToken, BurnableToken, DetailedERC20, MintableToken, NoOwner
{
    /**
    * @dev Constructor that gives msg.sender all of existing tokens
    */
    constructor() public DetailedERC20("Sub Token", "ST", 18) {
        paused = true;
    }
}