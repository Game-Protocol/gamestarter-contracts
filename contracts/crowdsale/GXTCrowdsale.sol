pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/crowdsale/distribution/FinalizableCrowdsale.sol";
import "openzeppelin-solidity/contracts/crowdsale/emission/MintedCrowdsale.sol";
import "../crowdsale/validation/TwoWayWhitelistedCrowdsale.sol";
import "./validation/TokenCappedCrowdsale.sol";
import "../token/GXToken.sol";
import "../token/GXTTeamTokenTimelock.sol";

/**
 * @title GXTCrowdsale
 * @dev Game Protocol Crowdsale contract.
 * The way to add new features to a base crowdsale is by multiple inheritance.
 * After adding multiple features it's good practice to run integration tests
 * to ensure that subcontracts works together as intended.
 */
contract GXTCrowdsale is FinalizableCrowdsale, MintedCrowdsale, TokenCappedCrowdsale, TwoWayWhitelistedCrowdsale {

    uint256 constant public GXT_UNIT = 10 ** 18;
    uint256 constant public TOTAL_SUPPLY = 150 * 10**6 * GXT_UNIT;                          // Total supply of 150 milion tokens

    uint256 constant public CROWDSALE_ALLOCATION = 87 * 10**6 * GXT_UNIT;                   // Crowdsale Allocation 58%
    uint256 constant public GAME_SUPPORT_FUND_ALLOCATION = 15 * 10**6 * GXT_UNIT;           // Game support fund Allocation 10%
    uint256 constant public BOUNTY_PROGRAM_ALLOCATION = 3 * 10**6 * GXT_UNIT;               // Bounty program Allocation 2%
    uint256 constant public ADVISORS_AND_PARTNERSHIP_ALLOCATION = 15 * 10**6 * GXT_UNIT;    // Advisors and partnership Allocation 10%
    uint256 constant public TEAM_ALLOCATION = 30 * 10**6 * GXT_UNIT;                        // Team allocation 20%

    address public walletGameSupportFund;                                                   // Address that holds the advisors tokens
    address public walletBountyProgram;                                                     // Address that holds the marketing tokens
    address public walletAdvisorsAndPartnership;                                            // Address that holds the advisors tokens
    address public walletTeam;                                                              // Address that holds the team tokens

    event TeamTimelock(address indexed _teamTimelock); 

    constructor (
        uint256 _openingTime,
        uint256 _closingTime,
        uint256 _rate,
        address _wallet,
        address _walletGameSupportFund, 
        address _walletBountyProgram,
        address _walletAdvisorsAndPartnership, 
        address _walletTeam, 
        GXToken _token
    ) 
        public
        Crowdsale(_rate, _wallet, _token)
        TimedCrowdsale(_openingTime, _closingTime)
        TokenCappedCrowdsale(CROWDSALE_ALLOCATION)
    {
        require(_walletGameSupportFund != address(0));
        require(_walletBountyProgram != address(0));
        require(_walletAdvisorsAndPartnership != address(0));
        require(_walletTeam != address(0));

        walletGameSupportFund = _walletGameSupportFund;
        walletBountyProgram = _walletBountyProgram;
        walletAdvisorsAndPartnership = _walletAdvisorsAndPartnership;
        walletTeam = _walletTeam;
    }

    // Helper function to add a percent of the value to a value
    function addPercent(uint8 percent, uint256 value) internal pure returns(uint256) {
        return value.add(value.mul(percent).div(100));
    }

    function claimTokenOwnership() public onlyOwner {
        GXToken(token).claimOwnership();
    }

    // =================================================================================================================
    //                                      Impl Crowdsale
    // =================================================================================================================

    /**
     * @return the token amount according to the time of the tx and the GXT pricing program.
     */
    function _getTokenAmount(uint256 _weiAmount) internal view returns (uint256) {
        // solium-disable-next-line security/no-block-members
        if (now < (closingTime.sub(4 weeks))) {
            return _weiAmount.mul(addPercent(20, rate)); 
        }
        // solium-disable-next-line security/no-block-members
        if (now < (closingTime.sub(3 weeks))) {
            return _weiAmount.mul(addPercent(15, rate)); 
        }
        // solium-disable-next-line security/no-block-members
        if (now < (closingTime.sub(2 weeks))) {
            return _weiAmount.mul(addPercent(10, rate)); 
        }
        // solium-disable-next-line security/no-block-members
        if (now < (closingTime.sub(1 weeks))) {
            return _weiAmount.mul(addPercent(5, rate)); 
        }
        return _weiAmount.mul(rate);
    }

    // =================================================================================================================
    //                                      Impl FinalizableCrowdsale
    // =================================================================================================================

    function finalization() internal onlyOwner {
        super.finalization();

        // 20% of the total number of GXT tokens will be allocated to the team
        // create a timed wallet that will release tokens every 6 months
        GXTTeamTokenTimelock timelock = new GXTTeamTokenTimelock(token, walletTeam, closingTime);
        address teamTimelock = address(timelock);
        _deliverTokens(teamTimelock, TEAM_ALLOCATION);
        emit TeamTimelock(teamTimelock);

        // 10% of the total number of GXT tokens will be allocated to the game support fund
        _deliverTokens(walletGameSupportFund, GAME_SUPPORT_FUND_ALLOCATION);

        // 2% of the total number of GXT tokens will be allocated to the bounty program
        _deliverTokens(walletBountyProgram, BOUNTY_PROGRAM_ALLOCATION);

        // 10% of the total number of GXT tokens will be allocated to the advisors and partnership
        _deliverTokens(walletAdvisorsAndPartnership, ADVISORS_AND_PARTNERSHIP_ALLOCATION);

        // The ramaining tokens that were not sold in the crowdsale will be allocated to a game support fund
        uint256 tokensLeft = CROWDSALE_ALLOCATION - tokensAllocated;
        _deliverTokens(walletGameSupportFund, tokensLeft);

        // // Disable token minting from this point
        // GXToken(token).finishMinting();

        // Re-enable transfers and burn after the token sale.
        GXToken(token).unpause();

        // Transfer ownership of the token to the owner of the crowdsale
        GXToken(token).transferOwnership(owner);
    }
}