pragma solidity ^0.4.24;

contract IMintable {

    event Mint(address indexed to, uint256 amount);
    event MintFinished();

    bool public mintingFinished = false;

    modifier canMint() {
        require(!mintingFinished);
        _;
    }

    function mint(address _to, uint256 _amount) public returns (bool);

    function finishMinting() public returns (bool);
}