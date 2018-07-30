pragma solidity ^0.4.24;

import "../token/GameToken.sol";

/*
    

 */
contract Wagering is Ownable {

    struct Match {
        uint256 matchId;
        address player1;
        address player2;
        uint256 bet;
        bool finished;
        address winner;
    }

    GameToken public token;

    mapping(uint256 => Match) internal matches;

    event MatchFinished(address indexed player1, address indexed player2, address indexed winner, uint256 matchId, uint256 bet);

    constructor(GameToken _token) public {
        token = _token;
    }

    modifier _validatePreGame(uint256 matchId, address player1, address player2, uint256 bet) {
        require(!matches[matchId].finished);
        require(token.balanceOf(player1) >= bet && token.allowance(player1, this) >= bet);
        require(token.balanceOf(player1) >= bet && token.allowance(player2, this) >= bet);
        _;
    }

    function GameStarted(uint256 matchId, address player1, address player2, uint256 bet) 
        public 
        onlyOwner() 
        _validatePreGame(matchId, player1, player2, bet)
    {
        Match memory m = Match(matchId, player1, player2, bet, false, 0);
        matches[matchId] = m;
        require(token.transferFrom(player1, this, bet));
        require(token.transferFrom(player2, this, bet));
    }

    function GameFinished(uint256 matchId, address winner)    
        public 
        onlyOwner() 
    {
        
    }
}