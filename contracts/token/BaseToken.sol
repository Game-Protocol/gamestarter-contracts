pragma solidity ^0.4.24;

import "bancor-contracts/solidity/contracts/token/interfaces/IERC20Token.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-solidity/contracts/token/ERC20/StandardToken.sol";
import "openzeppelin-solidity/contracts/token/ERC20/DetailedERC20.sol";
import "openzeppelin-solidity/contracts/token/ERC20/MintableToken.sol";
import "openzeppelin-solidity/contracts/token/ERC20/PausableToken.sol";
import "openzeppelin-solidity/contracts/token/ERC20/BurnableToken.sol";
import "openzeppelin-solidity/contracts/ownership/NoOwner.sol";


/**
 * @title BaseToken
 * @dev Base Token
 * Inherited from PausableToken, BurnableToken, IERC20Token, MintableToken, NoOwner
 * When deployed will start with a paused state until crowdsale is finished.
 */
contract BaseToken is ERC20, IERC20Token, StandardToken, DetailedERC20, MintableToken, PausableToken, BurnableToken, NoOwner {
    /**
    * @dev Constructor
    */
    constructor(string _name, string _symbol, uint8 _decimals) public DetailedERC20(_name, _symbol, _decimals) {
    }
}