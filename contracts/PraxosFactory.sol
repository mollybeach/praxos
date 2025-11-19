// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {PraxosVault} from "./PraxosVault.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title PraxosFactory
 * @notice Factory contract for creating ERC-4626 vaults from AI-generated strategies
 * @dev This is the "Vault Generator" that deploys vaults based on allocation strategies
 */
contract PraxosFactory is Ownable {
    struct VaultConfig {
        address baseAsset;
        string name;
        string symbol;
        string strategy;
        uint8 riskTier;
        uint256 targetDuration;
        address[] assets;
        uint256[] weights;
    }

    mapping(address => bool) public isVault;
    address[] public allVaults;
    
    event VaultCreated(
        address indexed vault,
        address indexed creator,
        string strategy,
        uint8 riskTier
    );

    constructor() Ownable(msg.sender) {}

    /**
     * @notice Create a new Praxos with the given configuration
     * @param config The vault configuration
     * @return vault The address of the newly created vault
     */
    function createVault(VaultConfig memory config) external returns (address vault) {
        require(config.baseAsset != address(0), "Invalid base asset");
        require(config.assets.length == config.weights.length, "Mismatched arrays");
        require(config.assets.length > 0, "No assets provided");
        
        // Validate weights sum to 10000 (100%)
        uint256 totalWeight = 0;
        for (uint256 i = 0; i < config.weights.length; i++) {
            totalWeight += config.weights[i];
        }
        require(totalWeight == 10000, "Weights must sum to 10000");
        
        // Deploy new vault
        PraxosVault newVault = new PraxosVault(
            ERC20(config.baseAsset),
            config.name,
            config.symbol,
            config.strategy,
            config.riskTier,
            config.targetDuration
        );
        
        vault = address(newVault);
        isVault[vault] = true;
        allVaults.push(vault);
        
        // Transfer ownership to creator (if different from factory owner)
        if (msg.sender != owner()) {
            newVault.transferOwnership(msg.sender);
        }
        
        // Add assets to vault
        for (uint256 i = 0; i < config.assets.length; i++) {
            newVault.addAsset(config.assets[i], config.weights[i]);
        }
        
        emit VaultCreated(vault, msg.sender, config.strategy, config.riskTier);
        
        return vault;
    }

    /**
     * @notice Get total number of vaults created
     * @return The number of vaults
     */
    function getVaultCount() external view returns (uint256) {
        return allVaults.length;
    }

    /**
     * @notice Get all vault addresses
     * @return Array of vault addresses
     */
    function getAllVaults() external view returns (address[] memory) {
        return allVaults;
    }
}

