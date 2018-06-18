pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "./interfaces/IBancorGasPriceLimit.sol";

/*
    The BancorGasPriceLimit contract serves as an extra front-running attack mitigation mechanism.
    It sets a maximum gas price on all bancor conversions, which prevents users from "cutting in line"
    in order to front-run other transactions.
    The gas price limit is universal to all converters and it can be updated by the owner to be in line
    with the network's current gas price.
*/
contract BancorGasPriceLimit is IBancorGasPriceLimit, Ownable {
    uint256 public gasPrice = 0 wei;    // maximum gas price for bancor transactions
    
    /**
        @dev constructor

        @param _gasPrice    gas price limit
    */
    constructor(uint256 _gasPrice)
        public
    {
        require(_gasPrice > 0);
        gasPrice = _gasPrice;
    }

    /*
        @dev allows the owner to update the gas price limit

        @param _gasPrice    new gas price limit
    */
    function setGasPrice(uint256 _gasPrice)
        public
        onlyOwner
    {
        require(_gasPrice > 0);
        gasPrice = _gasPrice;
    }

    /*
        @dev validate that the given gas price is equal to the current network gas price

        @param _gasPrice    tested gas price
    */
    function validateGasPrice(uint256 _gasPrice)
        public
        view
    {
        require(_gasPrice > 0);
        require(_gasPrice <= gasPrice);
    }
}
