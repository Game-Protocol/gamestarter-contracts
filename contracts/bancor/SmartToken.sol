pragma solidity ^0.4.24;

import "./interfaces/ISmartToken.sol";
import "openzeppelin-solidity/contracts/ownership/NoOwner.sol";
import "openzeppelin-solidity/contracts/token/ERC20/DetailedERC20.sol";
import "openzeppelin-solidity/contracts/token/ERC20/PausableToken.sol";
import "openzeppelin-solidity/contracts/token/ERC20/BurnableToken.sol";
import "openzeppelin-solidity/contracts/token/ERC20/MintableToken.sol";

contract SmartToken is PausableToken, BurnableToken, DetailedERC20, MintableToken, NoOwner, ISmartToken {

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

    // =================================================================================================================
    //                                      Impl ISmartToken
    // =================================================================================================================

    function disableTransfers(bool _disable) public {
        if(_disable) {
            super.pause();
        }
        else {
            super.unpause();
        }
    }

    function issue(address _to, uint256 _amount) public {
        require(super.mint(_to, _amount));
    }

    function destroy(address _from, uint256 _amount) public {
        super._burn(_from, _amount);
    }
}
