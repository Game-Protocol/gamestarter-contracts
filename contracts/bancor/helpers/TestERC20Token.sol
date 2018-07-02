pragma solidity ^0.4.11;
import "openzeppelin-solidity/contracts/token/ERC20/DetailedERC20.sol";
import "openzeppelin-solidity/contracts/token/ERC20/BasicToken.sol";

/*
    Test token with predefined supply
*/
contract TestERC20Token is BasicToken, DetailedERC20 {
    constructor(string _name, string _symbol, uint256 _supply)
        public
        DetailedERC20(_name, _symbol, 0)
    {
        totalSupply_ = _supply;
        balances[msg.sender] = _supply;
    }
}
