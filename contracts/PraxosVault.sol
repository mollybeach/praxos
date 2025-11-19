// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC4626} from "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC3643} from "./interfaces/IERC3643.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title Praxos
 * @notice ERC-4626 vault that holds multiple ERC-3643 RWA tokens
 * @dev Each vault represents a "honey cell" with diversified RWA exposure
 */
contract PraxosVault is ERC4626, ReentrancyGuard, Ownable {
    struct AssetAllocation {
        address asset; // ERC-3643 token address
        uint256 weight; // Allocation weight in basis points (10000 = 100%)
    }

    AssetAllocation[] public allocations;
    mapping(address => bool) public isSupportedAsset;
    string public vaultStrategy; // e.g., "conservative-short-term", "real-estate-heavy"
    uint8 public riskTier; // Aggregated risk tier (1-5)
    uint256 public targetDuration; // Target duration in seconds

    event AssetAdded(address indexed asset, uint256 weight);
    event AssetRemoved(address indexed asset);
    event AllocationUpdated(address indexed asset, uint256 oldWeight, uint256 newWeight);

    /**
     * @notice Initialize the vault with a base asset and strategy
     * @param asset The base asset (typically a stablecoin or wrapped token)
     * @param name The vault name
     * @param symbol The vault symbol
     * @param strategy_ The strategy identifier
     * @param riskTier_ The risk tier (1-5)
     * @param targetDuration_ The target duration in seconds
     */
    constructor(
        ERC20 asset,
        string memory name,
        string memory symbol,
        string memory strategy_,
        uint8 riskTier_,
        uint256 targetDuration_
    ) ERC4626(asset) ERC20(name, symbol) Ownable(msg.sender) {
        vaultStrategy = strategy_;
        riskTier = riskTier_;
        targetDuration = targetDuration_;
    }

    /**
     * @notice Add an ERC-3643 RWA asset to the vault
     * @param asset The ERC-3643 token address
     * @param weight Allocation weight in basis points (10000 = 100%)
     */
    function addAsset(address asset, uint256 weight) external onlyOwner {
        require(!isSupportedAsset[asset], "Asset already added");
        require(asset != address(0), "Invalid asset");
        require(weight > 0, "Weight must be > 0");
        
        IERC3643 rwa = IERC3643(asset);
        require(rwa.totalSupply() > 0, "Invalid RWA token");
        
        allocations.push(AssetAllocation({asset: asset, weight: weight}));
        isSupportedAsset[asset] = true;
        
        emit AssetAdded(asset, weight);
    }

    /**
     * @notice Update allocation weight for an asset
     * @param asset The ERC-3643 token address
     * @param newWeight New allocation weight in basis points
     */
    function updateAllocation(address asset, uint256 newWeight) external onlyOwner {
        require(isSupportedAsset[asset], "Asset not found");
        require(newWeight > 0, "Weight must be > 0");
        
        for (uint256 i = 0; i < allocations.length; i++) {
            if (allocations[i].asset == asset) {
                uint256 oldWeight = allocations[i].weight;
                allocations[i].weight = newWeight;
                emit AllocationUpdated(asset, oldWeight, newWeight);
                return;
            }
        }
        revert("Asset not found");
    }

    /**
     * @notice Remove an asset from the vault
     * @param asset The ERC-3643 token address to remove
     */
    function removeAsset(address asset) external onlyOwner {
        require(isSupportedAsset[asset], "Asset not found");
        
        for (uint256 i = 0; i < allocations.length; i++) {
            if (allocations[i].asset == asset) {
                allocations[i] = allocations[allocations.length - 1];
                allocations.pop();
                isSupportedAsset[asset] = false;
                emit AssetRemoved(asset);
                return;
            }
        }
    }

    /**
     * @notice Get total number of assets in the vault
     * @return The number of assets
     */
    function getAssetCount() external view returns (uint256) {
        return allocations.length;
    }

    /**
     * @notice Get all asset allocations
     * @return assets Array of asset addresses
     * @return weights Array of allocation weights
     */
    function getAllocations() external view returns (address[] memory assets, uint256[] memory weights) {
        assets = new address[](allocations.length);
        weights = new uint256[](allocations.length);
        
        for (uint256 i = 0; i < allocations.length; i++) {
            assets[i] = allocations[i].asset;
            weights[i] = allocations[i].weight;
        }
    }

    /**
     * @notice Calculate total assets under management
     * @dev Includes base asset and all RWA tokens at their current value
     * @return Total AUM
     */
    function totalAssets() public view override returns (uint256) {
        uint256 baseAssets = ERC4626.totalAssets();
        uint256 rwaValue = 0;
        
        for (uint256 i = 0; i < allocations.length; i++) {
            IERC3643 rwa = IERC3643(allocations[i].asset);
            rwaValue += rwa.balanceOf(address(this));
        }
        
        return baseAssets + rwaValue;
    }

    /**
     * @notice Deposit assets and allocate to RWAs according to strategy
     * @param assets Amount of assets to deposit
     * @param receiver Address to receive vault shares
     * @return shares Amount of shares minted
     */
    function deposit(uint256 assets, address receiver) public override nonReentrant returns (uint256 shares) {
        shares = super.deposit(assets, receiver);
        _allocateAssets();
        return shares;
    }

    /**
     * @notice Mint shares and allocate to RWAs
     * @param shares Amount of shares to mint
     * @param receiver Address to receive vault shares
     * @return assets Amount of assets deposited
     */
    function mint(uint256 shares, address receiver) public override nonReentrant returns (uint256 assets) {
        assets = super.mint(shares, receiver);
        _allocateAssets();
        return assets;
    }

    /**
     * @notice Internal function to allocate deposited assets to RWA tokens
     * @dev Distributes assets according to allocation weights
     */
    function _allocateAssets() internal {
        if (allocations.length == 0) return;
        
        uint256 availableAssets = IERC20(asset()).balanceOf(address(this));
        if (availableAssets == 0) return;
        
        // Calculate total weight
        uint256 totalWeight = 0;
        for (uint256 i = 0; i < allocations.length; i++) {
            totalWeight += allocations[i].weight;
        }
        
        // Allocate to each asset according to weight
        for (uint256 i = 0; i < allocations.length; i++) {
            uint256 allocationAmount = (availableAssets * allocations[i].weight) / totalWeight;
            if (allocationAmount > 0) {
                // In a real implementation, this would swap base asset for RWA tokens
                // For hackathon demo, we'll simulate this by tracking allocations
                // The actual swap would happen via a DEX or OTC mechanism
            }
        }
    }

    /**
     * @notice Get vault metadata
     * @return strategy The strategy identifier
     * @return risk The risk tier
     * @return duration The target duration
     * @return assetCount The number of assets
     */
    function getVaultInfo() external view returns (
        string memory strategy,
        uint8 risk,
        uint256 duration,
        uint256 assetCount
    ) {
        return (vaultStrategy, riskTier, targetDuration, allocations.length);
    }
}

