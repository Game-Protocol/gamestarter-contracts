pragma solidity ^0.4.24;

import "./interfaces/ISmartToken.sol";
import "openzeppelin-solidity/contracts/ownership/NoOwner.sol";
import "openzeppelin-solidity/contracts/token/ERC20/DetailedERC20.sol";
import "openzeppelin-solidity/contracts/token/ERC20/PausableToken.sol";
import "openzeppelin-solidity/contracts/token/ERC20/BurnableToken.sol";
import "openzeppelin-solidity/contracts/token/ERC20/MintableToken.sol";

contract SmartToken is PausableToken, BurnableToken, DetailedERC20, MintableToken, NoOwner, ISmartToken {
    string public version = "0.3";

    bool public transfersEnabled = true;    // true if transfer/transferFrom are enabled, false if not

    // triggered when a smart token is deployed - the _token address is defined for forward compatibility, in case we want to trigger the event from a factory
    event NewSmartToken(address _token);


    /**
        @dev constructor

        @param _name       token name
        @param _symbol     token short symbol, minimum 1 character
        @param _decimals   for display purposes only
    */
    constructor(string _name, string _symbol, uint8 _decimals)
        public
        DetailedERC20(_name, _symbol, _decimals)
    {
        emit NewSmartToken(address(this));
    }
}
