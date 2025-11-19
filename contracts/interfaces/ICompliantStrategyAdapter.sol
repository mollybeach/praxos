// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title ICompliantStrategyAdapter
 * @notice Interface for connecting Vault to ERC-3643 IdentityRegistry
 * @dev This adapter handles compliance checks and whitelisting
 */
interface ICompliantStrategyAdapter {
    /**
     * @notice Check if the vault is whitelisted to hold a specific RWA token
     * @param rwaToken The ERC-3643 token address
     * @param vaultAddress The vault contract address
     * @return True if vault is whitelisted
     */
    function isVaultWhitelisted(address rwaToken, address vaultAddress) external view returns (bool);

    /**
     * @notice Get the ONCHAINID for a vault
     * @param vaultAddress The vault contract address
     * @return The ONCHAINID address (0x0 if not set)
     */
    function getVaultIdentity(address vaultAddress) external view returns (address);

    /**
     * @notice Register vault identity with RWA token issuer
     * @param rwaToken The ERC-3643 token address
     * @param vaultAddress The vault contract address
     * @param vaultIdentity The vault's ONCHAINID address
     */
    function registerVaultIdentity(
        address rwaToken,
        address vaultAddress,
        address vaultIdentity
    ) external;

    /**
     * @notice Perform a compliant swap from USDC to RWA token
     * @param usdcAmount Amount of USDC to swap
     * @param rwaToken The target ERC-3643 token address
     * @param vaultAddress The vault performing the swap
     * @return rwaAmount Amount of RWA tokens received
     */
    function compliantSwap(
        uint256 usdcAmount,
        address rwaToken,
        address vaultAddress
    ) external returns (uint256 rwaAmount);
}

