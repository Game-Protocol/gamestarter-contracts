pragma solidity ^0.4.18;
import "./interfaces/IBancorConverterExtensions.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

/**
    @dev the BancorConverterExtensions contract is an owned contract that serves as a single point of access
    to the BancorFormula, BancorGasPriceLimit and BancorQuickConverter contracts from all BancorConverter contract instances.
    it allows upgrading these contracts without the need to update each and every
    BancorConverter contract instance individually.
*/
contract BancorConverterExtensions is IBancorConverterExtensions, Ownable {
    IBancorFormula public formula;  // bancor calculation formula contract
    IBancorGasPriceLimit public gasPriceLimit; // bancor universal gas price limit contract
    IBancorQuickConverter public quickConverter; // bancor quick converter contract

    /**
        @dev constructor

        @param _formula         address of a bancor formula contract
        @param _gasPriceLimit   address of a bancor gas price limit contract
        @param _quickConverter  address of a bancor quick converter contract
    */
    constructor(IBancorFormula _formula, IBancorGasPriceLimit _gasPriceLimit, IBancorQuickConverter _quickConverter)
        public
    {
        require(_formula != address(0));
        require(_gasPriceLimit != address(0));
        require(_quickConverter != address(0));
        formula = _formula;
        gasPriceLimit = _gasPriceLimit;
        quickConverter = _quickConverter;
    }

    /*
        @dev allows the owner to update the formula contract address

        @param _formula    address of a bancor formula contract
    */
    function setFormula(IBancorFormula _formula)
        public
        onlyOwner
    {
        require(_formula != address(0));
        require(_formula != address(this));
        formula = _formula;
    }

    /*
        @dev allows the owner to update the gas price limit contract address

        @param _gasPriceLimit   address of a bancor gas price limit contract
    */
    function setGasPriceLimit(IBancorGasPriceLimit _gasPriceLimit)
        public
        onlyOwner
    {
        require(_gasPriceLimit != address(0));
        require(_gasPriceLimit != address(this));
        gasPriceLimit = _gasPriceLimit;
    }

    /*
        @dev allows the owner to update the quick converter contract address

        @param _quickConverter  address of a bancor quick converter contract
    */
    function setQuickConverter(IBancorQuickConverter _quickConverter)
        public
        onlyOwner
    {
        require(_quickConverter != address(0));
        require(_quickConverter != address(this));
        quickConverter = _quickConverter;
    }
}
