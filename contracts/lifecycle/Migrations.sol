pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

/**
 * @title Migrations
 * @dev This is a truffle contract, needed for truffle integration, not meant for use by openzeppelin users.
 */
contract Migrations is Ownable {
    uint256 public lastCompletedMigration;

    function setCompleted(uint256 completed) public onlyOwner {
        lastCompletedMigration = completed;
    }

    function upgrade(address newAddress) public onlyOwner {
        Migrations upgraded = Migrations(newAddress);
        upgraded.setCompleted(lastCompletedMigration);
    }
}