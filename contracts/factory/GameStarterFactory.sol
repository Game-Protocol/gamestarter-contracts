pragma solidity ^0.4.24;

import "../token/GameToken.sol";
import "../token/GPToken.sol";
import "../crowdsale/GameTokenCrowdsale.sol";
import "../bancor/BancorConverter.sol";


contract GameStarterFactory {

    BancorConverter converter;
    address public feeWallet;

    event NewGame(address indexed _owner, address indexed _token, address _crowdsale);
    
    constructor (BancorConverter _converter, address _feeWallet) public {
        converter = _converter;
        feeWallet = _feeWallet;
    }

    function createGame(
        address _owner, 
        string _tokenName, 
        string _tokenSymbol,
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
            _saleOpeningTime, 
            _saleClosingTime, 
            _rate,
            _owner, 
            feeWallet, 
            token
        );
        // Add a connector between the Game Protocol Token 
        // and the created GameToken using the converter
        converter.addConnector(token, 10000, false);

        address crowdsaleAddress = address(crowdsale);
        emit NewGame(_owner, tokenAddress, crowdsaleAddress);

        return tokenAddress;
    }
}