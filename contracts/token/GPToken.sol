pragma solidity ^0.4.24;

import "./BaseToken.sol";
import "../bancor/interfaces/ISmartToken.sol";

/**
 * @title GPToken
 * @dev Game Protocol Token
 * Inherited from BaseToken
 * ISmartToken inheritence for bancor integration.
 * When deployed will start with a paused state until crowdsale is finished.
 */
contract GPToken is BaseToken, ISmartToken
{
    /**
    * @dev Constructor that pauses the token at the start until the end of the crowdsale
    */
    constructor() public BaseToken("Game Protocol Token", "GXT", 18) {
        paused = true;
    }

    // =================================================================================================================
    //                                      Impl ISmartToken
    // =================================================================================================================

    function disableTransfers(bool _disable) public {
        if(_disable) {
            super.pause();
        }
        else {
            super.unpause();
        }
    }

    function issue(address _to, uint256 _amount) public {
        require(super.mint(_to, _amount));
    }

    function destroy(address _from, uint256 _amount) public {
        super._burn(_from, _amount);
    }
}