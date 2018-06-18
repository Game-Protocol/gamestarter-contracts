pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";


/*
    EIP228 Token Converter interface
*/
contract ITokenConverter {
    function convertibleTokenCount() public view returns (uint16);
    function convertibleToken(uint16 _tokenIndex) public view returns (address);
    function getReturn(ERC20 _fromToken, ERC20 _toToken, uint256 _amount) public view returns (uint256);
    function convert(ERC20 _fromToken, ERC20 _toToken, uint256 _amount, uint256 _minReturn) public returns (uint256);
    // deprecated, backward compatibility
    function change(ERC20 _fromToken, ERC20 _toToken, uint256 _amount, uint256 _minReturn) public returns (uint256);
}
