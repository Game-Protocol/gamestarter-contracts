pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/token/ERC20/SafeERC20.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

/**
 * @title GPTTeamTokenTimelock
 * @dev TokenTimelock is a token holder contract that will allow a
 * beneficiary to extract the tokens after a given release time
 */
contract GPTTeamTokenTimelock {
    using SafeERC20 for ERC20Basic;
    using SafeMath for uint256;

    // ERC20 basic token contract being held
    ERC20Basic public token;

    // beneficiary of tokens after they are released
    address public beneficiary;

    // timestamp when token release is enabled
    uint256 public releaseTime;

    // tokens released already
    uint256 public releasedTokens;

    uint256 constant public PART_1 = 7500000 * 10 ** 18;
    uint256 constant public PART_2 = 15000000 * 10 ** 18;
    uint256 constant public PART_3 = 22500000 * 10 ** 18;
    uint256 constant public PART_4 = 30000000 * 10 ** 18;

    event Released(uint256 amount);


    constructor(ERC20Basic _token, address _beneficiary, uint256 _releaseTime) public {
        require(_beneficiary != address(0));
        token = _token;
        beneficiary = _beneficiary;
        releaseTime = _releaseTime;
    }

    /**
    * @notice Transfers tokens held by timelock to beneficiary.
    */
    function release() public {
        // solium-disable-next-line security/no-block-members
        require(block.timestamp >= releaseTime);

        // uint256 amount = token.balanceOf(this); 
        uint256 amount = _getReleasedAmount();
        require(amount > 0);

        token.safeTransfer(beneficiary, amount);

        _postRelease(amount);
    }

    /**
    * @dev Post release function. called after tokens are released.
    */
    function _postRelease(uint256 tokenAmount) internal {
        emit Released(tokenAmount);
        releasedTokens = releasedTokens.add(tokenAmount);
    }

    /**
    * @dev Get release amount. Override this method to modify the amount released when release is called.
    */
    function _getReleasedAmount() internal view returns(uint256) {
        // before the releaseTime, so the amount is 0
        // solium-disable-next-line security/no-block-members
        if (now < releaseTime) { 
            return 0; 
        }
        // part 1/4 is released after releaseTime
        // solium-disable-next-line security/no-block-members
        if (now < (releaseTime.add(24 weeks))) { 
            return PART_1.sub(releasedTokens);
        }
        // part 2/4 is released 6 months after releaseTime
        // solium-disable-next-line security/no-block-members
        if (now < (releaseTime.add(48 weeks))) { 
            return PART_2.sub(releasedTokens); 
        }
        // part 3/4 is released 12 months after releaseTime
        // solium-disable-next-line security/no-block-members
        if (now < (releaseTime.add(72 weeks))) { 
            return PART_3.sub(releasedTokens); 
        }
        // part 4/4 is released 18 months after releaseTime
        return PART_4.sub(releasedTokens);
    }
}