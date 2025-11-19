// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title RewardsModule
 * @notice Distributes raw dividends (income) to vault share holders
 * @dev Similar to Synthetix StakingRewards - users claim based on their Vault Share balance
 * @dev This is used when you want users to receive raw dividends rather than auto-compounding
 */
contract RewardsModule is ReentrancyGuard, Ownable {
    IERC20 public immutable rewardToken; // Usually USDC
    IERC20 public immutable vaultShares; // The ERC-4626 vault share token

    uint256 public totalRewards;
    uint256 public rewardPerShare;
    uint256 public lastUpdateTime;
    mapping(address => uint256) public userRewardPerSharePaid;
    mapping(address => uint256) public rewards;

    event RewardAdded(uint256 amount);
    event RewardPaid(address indexed user, uint256 amount);
    event RewardsDistributed(uint256 totalAmount);

    constructor(address _rewardToken, address _vaultShares) Ownable(msg.sender) {
        rewardToken = IERC20(_rewardToken);
        vaultShares = IERC20(_vaultShares);
    }

    /**
     * @notice Distribute rewards to the module (called by vault after harvesting dividends)
     * @param amount Amount of reward tokens to distribute
     */
    function distributeRewards(uint256 amount) external onlyOwner {
        require(amount > 0, "Amount must be > 0");
        
        uint256 totalSupply = vaultShares.totalSupply();
        if (totalSupply > 0) {
            rewardPerShare += (amount * 1e18) / totalSupply;
        }
        
        totalRewards += amount;
        emit RewardAdded(amount);
    }

    /**
     * @notice Update reward for a user
     * @param user The user address
     */
    function updateReward(address user) internal {
        if (user != address(0)) {
            rewards[user] = earned(user);
            userRewardPerSharePaid[user] = rewardPerShare;
        }
    }

    /**
     * @notice Calculate earned rewards for a user
     * @param user The user address
     * @return The amount of rewards earned
     */
    function earned(address user) public view returns (uint256) {
        uint256 balance = vaultShares.balanceOf(user);
        return (balance * (rewardPerShare - userRewardPerSharePaid[user])) / 1e18 + rewards[user];
    }

    /**
     * @notice Claim rewards for the caller
     */
    function claimReward() external nonReentrant {
        updateReward(msg.sender);
        uint256 reward = rewards[msg.sender];
        if (reward > 0) {
            rewards[msg.sender] = 0;
            rewardToken.transfer(msg.sender, reward);
            emit RewardPaid(msg.sender, reward);
        }
    }

    /**
     * @notice Get claimable rewards for a user
     * @param user The user address
     * @return The claimable amount
     */
    function getClaimableRewards(address user) external view returns (uint256) {
        return earned(user);
    }
}

