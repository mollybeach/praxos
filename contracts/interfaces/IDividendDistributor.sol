// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IDividendDistributor
 * @notice Interface for claiming dividends from ERC-3643 tokens
 * @dev Handles both push (airdrop) and pull (claimable) dividend scenarios
 */
interface IDividendDistributor {
    /**
     * @notice Claim dividends for a specific RWA token
     * @param rwaToken The ERC-3643 token address
     * @param claimer The address claiming (usually the vault)
     * @return amount The amount of dividends claimed
     */
    function claimDividends(address rwaToken, address claimer) external returns (uint256 amount);

    /**
     * @notice Get claimable dividends for a specific RWA token
     * @param rwaToken The ERC-3643 token address
     * @param claimer The address to check
     * @return amount The claimable amount
     */
    function getClaimableDividends(address rwaToken, address claimer) external view returns (uint256 amount);

    /**
     * @notice Check if dividends are available for claiming
     * @param rwaToken The ERC-3643 token address
     * @param claimer The address to check
     * @return True if dividends are available
     */
    function hasClaimableDividends(address rwaToken, address claimer) external view returns (bool);
}

