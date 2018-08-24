pragma solidity ^0.4.24;

import "../token/GameToken.sol";
import "../token/GXToken.sol";
import "../crowdsale/GameTokenCrowdsale.sol";

// import "bancor-contracts/solidity/contracts/converter/BancorConverter.sol";
import "bancor-contracts/solidity/contracts/converter/BancorConverterFactory.sol";

// Workaround for - Dependency contracts are not available in tests
import "bancor-contracts/solidity/contracts/BancorNetwork.sol";
import "bancor-contracts/solidity/contracts/utility/ContractRegistry.sol";
import "bancor-contracts/solidity/contracts/utility/ContractFeatures.sol";
import "bancor-contracts/solidity/contracts/helpers/TestERC20Token.sol";


contract GameStarterFactory {

    address public feeWallet;
    uint8 public feePercent;
    // GXToken public gxToken;
    // BancorConverterFactory factory;
    // IContractRegistry public registery;

    event NewGame(address indexed _owner, address indexed _token, address _crowdsale);

    // constructor (GXToken _gxToken, IContractRegistry _registery, BancorConverterFactory _factory, address _feeWallet, uint8 _feePercent) public {
    constructor (address _feeWallet, uint8 _feePercent) public {
        // gxToken = _gxToken;
        // registery = _registery;
        // factory = _factory;
        feeWallet = _feeWallet;
        feePercent = _feePercent;
    }

    function createGame(
        address _owner, 
        string _tokenName, 
        string _tokenSymbol,
        uint _goal,
        uint256 _saleOpeningTime,
        uint256 _saleClosingTime,
        uint256 _rate
    ) 
        public 
        returns(address _tokenAddress) 
    {
        GameToken token = new GameToken(_tokenName, _tokenSymbol);
        address tokenAddress = address(token);

        GameTokenCrowdsale crowdsale = new GameTokenCrowdsale(
            _goal,
            _saleOpeningTime, 
            _saleClosingTime, 
            _rate,
            _owner, 
            feeWallet,
            feePercent,
            token
        );
        address crowdsaleAddress = address(crowdsale);
        token.transferOwnership(crowdsaleAddress);

        // Add a connector between the Game Protocol Token 
        // and the created GameToken using the converter
        // factory.createConverter(gxToken, registery, 0, token, 200000);

        emit NewGame(_owner, tokenAddress, crowdsaleAddress);

        return tokenAddress;
    }
}