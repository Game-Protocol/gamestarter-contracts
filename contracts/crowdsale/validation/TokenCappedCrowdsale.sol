pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/crowdsale/Crowdsale.sol";

/**
 * @title TokenCappedCrowdsale
 * @dev Crowdsale with a limit for total tokens allocated.
 */
contract TokenCappedCrowdsale is Crowdsale {
    using SafeMath for uint256;

    // Maximum amount of tokens a crowdsale can allocate
    uint256 public tokenCap;

    // Amount of tokens allocated
    uint256 public tokensAllocated;

    /**
    * @dev Constructor, takes maximum amount of tokens issued in the crowdsale.
    * @param _tokenCap Max amount of wei to be contributed
    */
    constructor(uint256 _tokenCap) public {
        require(_tokenCap > 0, "Token cap is zero");
        tokenCap = _tokenCap;
    }

    /**
    * @dev Revets if the cap has been reached.
    */
    modifier underTokenCap(uint256 _weiAmount) {
        uint256 tokens = _getTokenAmount(_weiAmount);
        require(tokensAllocated.add(tokens) < tokenCap, "Token cap limit reached");
        _;
    }

    /** 
    * @dev Executed when a purchase has been validated and is ready to be executed. Not necessarily emits/sends tokens.
    * @param _beneficiary Address receiving the tokens
    * @param _tokenAmount Number of tokens to be purchased
    */
    function _processPurchase(address _beneficiary, uint256 _tokenAmount) internal {
        super._processPurchase(_beneficiary, _tokenAmount);
        tokensAllocated = tokensAllocated.add(_tokenAmount);
    }

    /**
    * @dev Extend parent behavior requiring purchase to respect the funding cap.
    * @param _beneficiary Token purchaser
    * @param _weiAmount Amount of wei contributed
    */
    function _preValidatePurchase(address _beneficiary, uint256 _weiAmount) internal underTokenCap(_weiAmount) {
        super._preValidatePurchase(_beneficiary, _weiAmount);
    }
}