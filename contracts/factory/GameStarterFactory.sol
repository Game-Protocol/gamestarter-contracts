pragma solidity ^0.4.24;

import "../token/GameToken.sol";
import "../token/GPToken.sol";
import "../crowdsale/GameTokenCrowdsale.sol";


contract GameStarterFactory {

    address public feeWallet;

    event NewGame(address indexed _owner, address indexed _token, address indexed _converter, address _crowdsale);
    
    constructor (GPToken _token, address _feeWallet) public {
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
        address crowdsaleAddress = address(crowdsale);
        address converterAddress = crowdsaleAddress;
        emit NewGame(_owner, tokenAddress, converterAddress, crowdsaleAddress);

        return tokenAddress;
    }

}