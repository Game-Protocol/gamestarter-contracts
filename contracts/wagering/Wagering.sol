pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
// import "../token/GameToken.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

/*
 * Wagering contract for holding tokens as a trusted party
 * TODO:
 * 1. Add double
 */
contract Wagering is Ownable {
    using SafeMath for uint256;

    struct Match {
        uint256 matchId;
        address player1;
        address player2;
        uint256 bet;
        bool finished;
        address winner;
        uint timeStarted;
    }

    uint public timeout = 3600;
    ERC20 public token;
    mapping(uint256 => Match) internal matches;

    event MatchEnded(address indexed player1, address indexed player2, address indexed winner, uint256 matchId, uint256 bet);


    constructor(ERC20 _token) public {
        token = _token;
    }

    modifier _validatePreMatch(uint256 matchId, address player1, address player2, uint256 bet) {
        require(!matches[matchId].finished, "Match is already finished.");
        require(bet > 0, "Bet cant be zero");
        require(token.balanceOf(player1) >= bet, "Player1 insufficient funds");
        require(token.allowance(player1, this) >= bet, "Player1 allowance too low");
        require(token.balanceOf(player2) >= bet, "Player2 insufficient funds");
        require(token.allowance(player2, this) >= bet, "Player2 allowance too low");
        _;
    }

    modifier _validatePostMatch(uint256 matchId, address winner) {
        require(matches[matchId].bet > 0, "Match doesn't exist");
        require(!matches[matchId].finished, "Match is already finished");
        require(winner == matches[matchId].player1 || winner == matches[matchId].player2 || winner == address(0), "Invalid winner address");
        _;
    }

    modifier _validateRefund(uint matchId) {
        require(!matches[matchId].finished, "Match is already finished");
        // solium-disable-next-line security/no-block-members
        require(matches[matchId].timeStarted + timeout < now, "Match is not timedout yet"); // expired game
        _;
    }

    function matchStarted(uint256 matchId, address player1, address player2, uint256 bet) 
        public 
        onlyOwner()
        _validatePreMatch(matchId, player1, player2, bet)
    {
        // solium-disable-next-line security/no-block-members
        Match memory m = Match(matchId, player1, player2, bet, false, 0, now);
        matches[matchId] = m;
        require(token.transferFrom(player1, this, bet), "Player1 transfer failed");
        require(token.transferFrom(player2, this, bet), "Player2 transfer failed");
    }

    function matchEnded(uint256 matchId, address winner)    
        public 
        onlyOwner()
        _validatePostMatch(matchId, winner)
    {
        Match storage m = matches[matchId];
        uint256 bet = matches[matchId].bet;
        // If there is no winner then the bet will be returned to the players
        if(winner == address(0)) {
            require(token.transfer(m.player1, bet), "Return bet to Player1 failed");
            require(token.transfer(m.player2, bet), "Return bet to Player2 failed");
        }
        else {
            require(token.transfer(winner, bet.mul(2)), "Transfer to winner failed");
        }
        m.finished = true;
        m.winner = winner;
        emit MatchEnded(m.player1, m.player2, winner, m.matchId, bet);
    }

    function refundMatch(uint256 matchId) 
        public
        onlyOwner()
        _validateRefund(matchId)
    {
        matchEnded(matchId, address(0));
    }
}