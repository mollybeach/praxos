// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC4626} from "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC3643} from "./interfaces/IERC3643.sol";
import {ICompliantStrategyAdapter} from "./interfaces/ICompliantStrategyAdapter.sol";
import {IPriceOracle} from "./interfaces/IPriceOracle.sol";
import {IDividendDistributor} from "./interfaces/IDividendDistributor.sol";
import {IIdentity} from "./interfaces/IIdentity.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title PraxosVaultCompliant
 * @notice Compliant ERC-4626 vault that holds multiple ERC-3643 RWA tokens
 * @dev Implements the full architecture for bridging ERC-4626 and ERC-3643
 * @dev This vault acts as a "Fund Manager" that takes USDC and buys/holds ERC-3643 tokens
 */
contract PraxosVaultCompliant is ERC4626, ReentrancyGuard, Ownable {
    struct AssetAllocation {
        address asset; // ERC-3643 token address
        uint256 weight; // Allocation weight in basis points (10000 = 100%)
    }

    AssetAllocation[] public allocations;
    mapping(address => bool) public isSupportedAsset;
    mapping(address => address) public dividendDistributors; // RWA token => DividendDistributor
    
    string public vaultStrategy;
    uint8 public riskTier;
    uint256 public targetDuration;
    
    // Compliance & Identity
    address public vaultIdentity; // ONCHAINID address
    ICompliantStrategyAdapter public strategyAdapter;
    
    // Price Oracle
    IPriceOracle public priceOracle;
    
    // Rewards Module (optional - for distributing raw dividends)
    address public rewardsModule;
    bool public autoCompound; // If true, dividends auto-compound; if false, go to rewards module
    
    // Events
    event AssetAdded(address indexed asset, uint256 weight);
    event AssetRemoved(address indexed asset);
    event AllocationUpdated(address indexed asset, uint256 oldWeight, uint256 newWeight);
    event IdentitySet(address indexed identity);
    event DividendHarvested(address indexed rwaToken, uint256 amount);
    event AssetsInvested(uint256 usdcAmount);
    event RewardsModuleSet(address indexed module);
    event AutoCompoundToggled(bool enabled);

    constructor(
        ERC20 asset,
        string memory name,
        string memory symbol,
        string memory strategy_,
        uint8 riskTier_,
        uint256 targetDuration_,
        address _strategyAdapter,
        address _priceOracle
    ) ERC4626(asset) ERC20(name, symbol) Ownable(msg.sender) {
        vaultStrategy = strategy_;
        riskTier = riskTier_;
        targetDuration = targetDuration_;
        strategyAdapter = ICompliantStrategyAdapter(_strategyAdapter);
        priceOracle = IPriceOracle(_priceOracle);
        autoCompound = true; // Default to auto-compounding
    }

    /**
     * @notice Set the vault's ONCHAINID
     * @param identity The ONCHAINID contract address
     */
    function setVaultIdentity(address identity) external onlyOwner {
        require(identity != address(0), "Invalid identity");
        vaultIdentity = identity;
        emit IdentitySet(identity);
    }

    /**
     * @notice Set the strategy adapter
     * @param adapter The compliant strategy adapter address
     */
    function setStrategyAdapter(address adapter) external onlyOwner {
        require(adapter != address(0), "Invalid adapter");
        strategyAdapter = ICompliantStrategyAdapter(adapter);
    }

    /**
     * @notice Set the price oracle
     * @param oracle The price oracle address
     */
    function setPriceOracle(address oracle) external onlyOwner {
        require(oracle != address(0), "Invalid oracle");
        priceOracle = IPriceOracle(oracle);
    }

    /**
     * @notice Set the rewards module (for distributing raw dividends)
     * @param module The rewards module address
     */
    function setRewardsModule(address module) external onlyOwner {
        rewardsModule = module;
        emit RewardsModuleSet(module);
    }

    /**
     * @notice Toggle auto-compounding mode
     * @param enabled If true, dividends auto-compound; if false, go to rewards module
     */
    function setAutoCompound(bool enabled) external onlyOwner {
        autoCompound = enabled;
        emit AutoCompoundToggled(enabled);
    }

    /**
     * @notice Add an ERC-3643 RWA asset to the vault
     * @param asset The ERC-3643 token address
     * @param weight Allocation weight in basis points (10000 = 100%)
     * @param distributor Optional dividend distributor address for this asset
     */
    function addAsset(
        address asset,
        uint256 weight,
        address distributor
    ) external onlyOwner {
        require(!isSupportedAsset[asset], "Asset already added");
        require(asset != address(0), "Invalid asset");
        require(weight > 0, "Weight must be > 0");
        
        // Verify vault is whitelisted to hold this token
        require(
            strategyAdapter.isVaultWhitelisted(asset, address(this)),
            "Vault not whitelisted for this RWA token"
        );
        
        IERC3643 rwa = IERC3643(asset);
        require(rwa.totalSupply() > 0, "Invalid RWA token");
        
        allocations.push(AssetAllocation({asset: asset, weight: weight}));
        isSupportedAsset[asset] = true;
        if (distributor != address(0)) {
            dividendDistributors[asset] = distributor;
        }
        
        emit AssetAdded(asset, weight);
    }

    /**
     * @notice Update allocation weight for an asset
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
     */
    function removeAsset(address asset) external onlyOwner {
        require(isSupportedAsset[asset], "Asset not found");
        
        for (uint256 i = 0; i < allocations.length; i++) {
            if (allocations[i].asset == asset) {
                allocations[i] = allocations[allocations.length - 1];
                allocations.pop();
                isSupportedAsset[asset] = false;
                delete dividendDistributors[asset];
                emit AssetRemoved(asset);
                return;
            }
        }
    }

    /**
     * @notice Get all asset allocations
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
     * @notice Calculate total assets under management using price oracle
     * @dev The price of vault shares depends on the value of underlying RWAs
     * @dev Uses oracle prices because RWA tokens often don't have real-time public spot prices
     */
    function totalAssets() public view override returns (uint256) {
        uint256 totalVal = IERC20(asset()).balanceOf(address(this)); // Uninvested USDC
        
        // Add value of all RWA tokens using price oracle
        for (uint256 i = 0; i < allocations.length; i++) {
            address rwaToken = allocations[i].asset;
            uint256 rwaBalance = IERC20(rwaToken).balanceOf(address(this));
            if (rwaBalance > 0) {
                uint256 price = priceOracle.getPrice(rwaToken);
                // Normalize to USDC decimals (assuming 18 decimals for price, 6 for USDC)
                totalVal += (rwaBalance * price) / 1e18;
            }
        }
        
        return totalVal;
    }

    /**
     * @notice Deposit assets and allocate to RWAs according to strategy
     * @param assets Amount of assets to deposit
     * @param receiver Address to receive vault shares
     * @return shares Amount of shares minted
     */
    function deposit(uint256 assets, address receiver) public override nonReentrant returns (uint256 shares) {
        shares = super.deposit(assets, receiver);
        _investAssets();
        return shares;
    }

    /**
     * @notice Mint shares and allocate to RWAs
     */
    function mint(uint256 shares, address receiver) public override nonReentrant returns (uint256 assets) {
        assets = super.mint(shares, receiver);
        _investAssets();
        return assets;
    }

    /**
     * @notice Internal function to invest USDC into RWA tokens
     * @dev Splits USDC based on portfolio weights and swaps via compliant adapter
     */
    function _investAssets() internal {
        if (allocations.length == 0) return;
        
        uint256 availableAssets = IERC20(asset()).balanceOf(address(this));
        if (availableAssets == 0) return;
        
        // Calculate total weight
        uint256 totalWeight = 0;
        for (uint256 i = 0; i < allocations.length; i++) {
            totalWeight += allocations[i].weight;
        }
        require(totalWeight > 0, "Invalid weights");
        
        // Allocate to each asset according to weight
        for (uint256 i = 0; i < allocations.length; i++) {
            uint256 allocationAmount = (availableAssets * allocations[i].weight) / totalWeight;
            if (allocationAmount > 0) {
                address rwaToken = allocations[i].asset;
                
                // Approve adapter to spend USDC
                IERC20(asset()).approve(address(strategyAdapter), allocationAmount);
                
                // Perform compliant swap via adapter
                // The adapter handles whitelisting and compliance checks
                strategyAdapter.compliantSwap(allocationAmount, rwaToken, address(this));
            }
        }
        
        emit AssetsInvested(availableAssets);
    }

    /**
     * @notice Harvest dividends from RWA tokens (Pull scenario)
     * @dev Calls claimDividends on dividend distributors
     * @param rwaTokens Array of RWA token addresses to harvest from
     */
    function harvest(address[] calldata rwaTokens) external nonReentrant {
        uint256 totalHarvested = 0;
        
        for (uint256 i = 0; i < rwaTokens.length; i++) {
            address rwaToken = rwaTokens[i];
            require(isSupportedAsset[rwaToken], "Asset not supported");
            
            address distributor = dividendDistributors[rwaToken];
            if (distributor != address(0)) {
                uint256 amount = IDividendDistributor(distributor).claimDividends(rwaToken, address(this));
                if (amount > 0) {
                    totalHarvested += amount;
                    emit DividendHarvested(rwaToken, amount);
                }
            }
        }
        
        if (totalHarvested > 0) {
            if (autoCompound) {
                // Auto-compound: reinvest dividends into RWA tokens
                _investAssets();
            } else if (rewardsModule != address(0)) {
                // Distribute to rewards module for users to claim
                IERC20(asset()).approve(rewardsModule, totalHarvested);
                // RewardsModule will handle distribution
                // Note: RewardsModule needs a distributeRewards function call
            }
            // If neither, dividends sit as cash (increasing totalAssets)
        }
    }

    /**
     * @notice Get vault metadata
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

