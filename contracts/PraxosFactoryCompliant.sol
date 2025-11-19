// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {PraxosVaultCompliant} from "./PraxosVaultCompliant.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title PraxosFactoryCompliant
 * @notice Factory for creating compliant RWA Index Vaults
 * @dev Deploys PraxosVaultCompliant with compliance infrastructure
 */
contract PraxosFactoryCompliant is Ownable {
    struct VaultConfig {
        address baseAsset;
        string name;
        string symbol;
        string strategy;
        uint8 riskTier;
        uint256 targetDuration;
        address[] assets;
        uint256[] weights;
        address[] dividendDistributors; // Optional: one per asset (can be address(0))
    }

    mapping(address => bool) public isVault;
    address[] public allVaults;
    
    // Infrastructure addresses
    address public strategyAdapter;
    address public priceOracle;
    
    event VaultCreated(
        address indexed vault,
        address indexed creator,
        string strategy,
        uint8 riskTier
    );
    event InfrastructureUpdated(address indexed adapter, address indexed oracle);

    constructor(address _strategyAdapter, address _priceOracle) Ownable(msg.sender) {
        strategyAdapter = _strategyAdapter;
        priceOracle = _priceOracle;
    }

    /**
     * @notice Update infrastructure addresses
     */
    function setInfrastructure(address _strategyAdapter, address _priceOracle) external onlyOwner {
        strategyAdapter = _strategyAdapter;
        priceOracle = _priceOracle;
        emit InfrastructureUpdated(_strategyAdapter, _priceOracle);
    }

    /**
     * @notice Create a new compliant vault
     */
    function createVault(VaultConfig memory config) external returns (address vault) {
        require(config.baseAsset != address(0), "Invalid base asset");
        require(config.assets.length == config.weights.length, "Mismatched arrays");
        require(config.assets.length > 0, "No assets provided");
        require(
            config.dividendDistributors.length == 0 || 
            config.dividendDistributors.length == config.assets.length,
            "Invalid dividend distributors length"
        );
        
        // Validate weights sum to 10000 (100%)
        uint256 totalWeight = 0;
        for (uint256 i = 0; i < config.weights.length; i++) {
            totalWeight += config.weights[i];
        }
        require(totalWeight == 10000, "Weights must sum to 10000");
        
        // Deploy new compliant vault
        PraxosVaultCompliant newVault = new PraxosVaultCompliant(
            ERC20(config.baseAsset),
            config.name,
            config.symbol,
            config.strategy,
            config.riskTier,
            config.targetDuration,
            strategyAdapter,
            priceOracle
        );
        
        vault = address(newVault);
        isVault[vault] = true;
        allVaults.push(vault);
        
        // Add assets to vault (factory is still owner at this point)
        for (uint256 i = 0; i < config.assets.length; i++) {
            address distributor = config.dividendDistributors.length > 0 
                ? config.dividendDistributors[i] 
                : address(0);
            newVault.addAsset(config.assets[i], config.weights[i], distributor);
        }
        
        // Transfer ownership to creator (if different from factory owner)
        if (msg.sender != owner()) {
            newVault.transferOwnership(msg.sender);
        }
        
        emit VaultCreated(vault, msg.sender, config.strategy, config.riskTier);
        
        return vault;
    }

    /**
     * @notice Get total number of vaults
     */
    function getVaultCount() external view returns (uint256) {
        return allVaults.length;
    }

    /**
     * @notice Get all vault addresses
     */
    function getAllVaults() external view returns (address[] memory) {
        return allVaults;
    }
}

