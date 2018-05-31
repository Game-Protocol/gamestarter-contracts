pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/ownership/NoOwner.sol";
import "openzeppelin-solidity/contracts/token/ERC20/PausableToken.sol";
import "openzeppelin-solidity/contracts/token/ERC20/DetailedERC20.sol";
import "openzeppelin-solidity/contracts/token/ERC20/BurnableToken.sol";
import "openzeppelin-solidity/contracts/token/ERC20/MintableToken.sol";
// import "../bancor/interfaces/ISmartToken.sol";

/**
 * @title SubToken
 * @dev Sub Token
 * Inherited from PausableToken, BurnableToken, DetailedERC20, MintableToken, NoOwner
 * When deployed will start with a paused state until crowdsale is finished.
 */
contract SubToken is PausableToken, BurnableToken, DetailedERC20, MintableToken, NoOwner//, ISmartToken
{
    /**
    * @dev Constructor that gives msg.sender all of existing tokens
    */
    constructor(string _name, string _symbol) public DetailedERC20(_name, _symbol, 18) {
        paused = true;
    }

    // // =================================================================================================================
    // //                                      Impl ISmartToken
    // // =================================================================================================================

    // function disableTransfers(bool _disable) public {
    //     if(_disable) {
    //         super.pause();
    //     }
    //     else {
    //         super.unpause();
    //     }
    // }

    // function issue(address _to, uint256 _amount) public {
    //     require(super.mint(_to, _amount));
    // }

    // function destroy(address _from, uint256 _amount) public {
    //     super._burn(_from, _amount);
    // }
}