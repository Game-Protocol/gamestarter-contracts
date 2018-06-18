pragma solidity ^0.4.24;
import "./ISmartToken.sol";
import "./IBancorConverterExtensions.sol";
import "openzeppelin-solidity/contracts/token/ERC20/DetailedERC20.sol";

/*
    Bancor Converter Factory interface
*/
contract IBancorConverterFactory {
    function createConverter(
        ISmartToken _token, 
        IBancorConverterExtensions _extensions, 
        uint32 _maxConversionFee, 
        DetailedERC20 _connectorToken, 
        uint32 _connectorWeight
    ) 
        public 
        returns (address);
}
