pragma solidity ^0.4.24;

import "../token/GameToken.sol";
import "openzeppelin-solidity/contracts/token/ERC20/DetailedERC20.sol";
import "openzeppelin-solidity/contracts/token/ERC20/BasicToken.sol";

/**
 * @title MockToken
 */
contract MockConnector is BasicToken, DetailedERC20
{
    /**
    * @dev Constructor that gives msg.sender all of existing tokens
    */
    constructor(string _name, string _symbol) public DetailedERC20(_name, _symbol, 18) {
    }
}