pragma solidity ^0.4.18;

import "openzeppelin-solidity/contracts/token/ERC20/DetailedERC20.sol";

/*
    Smart Token interface
*/
contract ISmartToken is DetailedERC20 {
    function disableTransfers(bool _disable) public;
    function issue(address _to, uint256 _amount) public;
    function destroy(address _from, uint256 _amount) public;
}
