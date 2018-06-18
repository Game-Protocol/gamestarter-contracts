pragma solidity ^0.4.24;
import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "./IBancorGasPriceLimit.sol";

/*
    Bancor Quick Converter interface
*/
contract IBancorQuickConverter {
    function convert(ERC20[] _path, uint256 _amount, uint256 _minReturn) public payable returns (uint256);
    function convertFor(ERC20[] _path, uint256 _amount, uint256 _minReturn, address _for) public payable returns (uint256);
    function convertForPrioritized(ERC20[] _path, uint256 _amount, uint256 _minReturn, address _for, uint256 _block, uint256 _nonce, uint8 _v, bytes32 _r, bytes32 _s) public payable returns (uint256);
}
