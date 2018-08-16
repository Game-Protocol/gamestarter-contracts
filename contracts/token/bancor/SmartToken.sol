pragma solidity ^0.4.24;

import "bancor-contracts/solidity/contracts/token/interfaces/ISmartToken.sol";
import "openzeppelin-solidity/contracts/ownership/NoOwner.sol";
import "openzeppelin-solidity/contracts/ownership/Claimable.sol";
import "openzeppelin-solidity/contracts/token/ERC20/BurnableToken.sol";
import "openzeppelin-solidity/contracts/token/ERC20/DetailedERC20.sol";
import "openzeppelin-solidity/contracts/token/ERC20/PausableToken.sol";
import "openzeppelin-solidity/contracts/token/ERC20/MintableToken.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "../IMintable.sol";

/**
    BancorSmartToken
*/
contract SmartToken is ERC20, IMintable, ISmartToken, DetailedERC20, BurnableToken, MintableToken, PausableToken, Claimable, NoOwner {

    event NewSmartToken(address _token);
    event Issuance(uint256 _amount);
    event Destruction(uint256 _amount);


    constructor(string _name, string _symbol, uint8 _decimals) public DetailedERC20(_name, _symbol, _decimals) {
        require(bytes(_name).length > 0, "Name is too short");
        require(bytes(_symbol).length > 0, "Symbol is too short");
        emit NewSmartToken(address(this));
    }

    function acceptOwnership() public {
        super.claimOwnership();
    }

    function disableTransfers(bool _disable) public {
        if(_disable) {
            super.pause();
        }
        else {
            super.unpause();
        }
    }

    function issue(address _to, uint256 _amount) public {
        require(_to != address(0), "_to is '0x0'");
        require(_to != address(this), "_to is this contract's address");
        require(super.mint(_to, _amount), "failed to mint token");
        emit Issuance(_amount);
    }

    function destroy(address _from, uint256 _amount) public onlyOwner {
        require(_from != address(0), "_from is '0x0'");
        super._burn(_from, _amount);
        emit Destruction(_amount);
    }
}
