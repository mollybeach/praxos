// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ICompliantStrategyAdapter} from "../interfaces/ICompliantStrategyAdapter.sol";
import {IERC3643} from "../interfaces/IERC3643.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title CompliantStrategyAdapter
 * @notice Example implementation of compliant strategy adapter
 * @dev Handles whitelisting and compliant swaps for ERC-3643 tokens
 * @dev In production, this would integrate with ONCHAINID and IdentityRegistry
 */
contract CompliantStrategyAdapter is ICompliantStrategyAdapter, Ownable {
    // Mapping: RWA token => vault address => whitelisted
    mapping(address => mapping(address => bool)) public vaultWhitelist;
    
    // Mapping: vault address => ONCHAINID address
    mapping(address => address) public vaultIdentities;
    
    // For demo: simple swap mechanism (in production, use DEX or OTC)
    mapping(address => uint256) public rwaTokenPrices; // RWA token => price in USDC (1:1 for demo)

    event VaultWhitelisted(address indexed rwaToken, address indexed vault);
    event VaultIdentityRegistered(address indexed vault, address indexed identity);
    event CompliantSwapExecuted(address indexed vault, address indexed rwaToken, uint256 usdcAmount, uint256 rwaAmount);

    constructor() Ownable(msg.sender) {}

    /**
     * @notice Whitelist a vault to hold a specific RWA token
     * @dev In production, this would check ONCHAINID and IdentityRegistry
     */
    function whitelistVault(address rwaToken, address vaultAddress) external onlyOwner {
        vaultWhitelist[rwaToken][vaultAddress] = true;
        emit VaultWhitelisted(rwaToken, vaultAddress);
    }

    /**
     * @notice Batch whitelist multiple vaults
     */
    function batchWhitelistVaults(
        address rwaToken,
        address[] calldata vaultAddresses
    ) external onlyOwner {
        for (uint256 i = 0; i < vaultAddresses.length; i++) {
            vaultWhitelist[rwaToken][vaultAddresses[i]] = true;
            emit VaultWhitelisted(rwaToken, vaultAddresses[i]);
        }
    }

    /**
     * @notice Check if vault is whitelisted
     */
    function isVaultWhitelisted(address rwaToken, address vaultAddress) external view override returns (bool) {
        return vaultWhitelist[rwaToken][vaultAddress];
    }

    /**
     * @notice Get vault identity
     */
    function getVaultIdentity(address vaultAddress) external view override returns (address) {
        return vaultIdentities[vaultAddress];
    }

    /**
     * @notice Register vault identity
     */
    function registerVaultIdentity(
        address /* rwaToken */,
        address vaultAddress,
        address vaultIdentity
    ) external override {
        require(msg.sender == vaultAddress || msg.sender == owner(), "Unauthorized");
        vaultIdentities[vaultAddress] = vaultIdentity;
        emit VaultIdentityRegistered(vaultAddress, vaultIdentity);
    }

    /**
     * @notice Perform compliant swap from USDC to RWA token
     * @dev In production, this would:
     * 1. Verify vault is whitelisted
     * 2. Check ONCHAINID
     * 3. Execute swap via DEX or mint from RWA issuer
     */
    function compliantSwap(
        uint256 usdcAmount,
        address rwaToken,
        address vaultAddress
    ) external override returns (uint256 rwaAmount) {
        require(vaultWhitelist[rwaToken][vaultAddress], "Vault not whitelisted");
        require(msg.sender == vaultAddress, "Only vault can call");
        
        // For demo: simple 1:1 swap (in production, use actual DEX or minting)
        // In production, you would:
        // 1. Transfer USDC from vault to this adapter
        // 2. Swap USDC for RWA tokens (via DEX or mint from RWA issuer)
        // 3. Transfer RWA tokens to vault
        rwaAmount = usdcAmount; // Assuming 1 USDC = 1 RWA token unit
        
        // In production:
        // 1. Transfer USDC from vault to this adapter
        // 2. Swap USDC for RWA tokens (via DEX or mint)
        // 3. Transfer RWA tokens to vault
        // For now, this is a placeholder - actual implementation depends on RWA token mechanics
        
        emit CompliantSwapExecuted(vaultAddress, rwaToken, usdcAmount, rwaAmount);
        return rwaAmount;
    }

    /**
     * @notice Set price for RWA token (for demo purposes)
     */
    function setRwaTokenPrice(address rwaToken, uint256 price) external onlyOwner {
        rwaTokenPrices[rwaToken] = price;
    }
}

