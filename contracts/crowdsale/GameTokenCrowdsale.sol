pragma solidity ^0.4.24;

import "../token/GameToken.sol";
import "openzeppelin-solidity/contracts/crowdsale/distribution/FinalizableCrowdsale.sol";
import "openzeppelin-solidity/contracts/crowdsale/emission/MintedCrowdsale.sol";
import "openzeppelin-solidity/contracts/crowdsale/Crowdsale.sol";

/**
 * @title GameTokenCrowdsale
 * @dev GameToken Crowdsale contract.
 * The way to add new features to a base crowdsale is by multiple inheritance.
 * After adding multiple features it's good practice to run integration tests
 * to ensure that subcontracts works together as intended.
 */
contract GameTokenCrowdsale is FinalizableCrowdsale, MintedCrowdsale {

    address public feeWallet;

    constructor (
        uint256 _openingTime,
        uint256 _closingTime,
        uint256 _rate,
        address _wallet,
        address _feeWallet, 
        GameToken _token
    ) 
        public
        Crowdsale(_rate, _wallet, _token)
        TimedCrowdsale(_openingTime, _closingTime)
    {
        feeWallet = _feeWallet;
    }



    // =================================================================================================================
    //                                      Impl Crowdsale
    // =================================================================================================================

    /**
    * @dev Determines how ETH is stored/forwarded on purchases.
    * Transfer 5% to the fee wallet and the rest to the wallet
    */
    function _forwardFunds() internal {
        uint256 fee = msg.value.mul(5).div(100);
        feeWallet.transfer(fee);
        wallet.transfer(msg.value.sub(fee));
    }

    // =================================================================================================================
    //                                      Impl FinalizableCrowdsale
    // =================================================================================================================

    function finalization() internal onlyOwner {
        super.finalization();

        // // Disable token minting from this point
        // GameToken(token).finishMinting();

        // Re-enable transfers and burn after the token sale.
        GameToken(token).unpause();

        // Transfer ownership of the token to the owner of the crowdsale
        GameToken(token).transferOwnership(owner);
    }
}