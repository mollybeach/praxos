# Compliant RWA Vault Implementation Guide

## Quick Start

This guide explains how to use the compliant RWA Index Vault architecture.

## Architecture Overview

The system bridges **ERC-4626** (permissionless yield vaults) and **ERC-3643** (permissioned securities) by:

1. **Vault acts as Fund Manager**: Takes USDC, splits it, and buys ERC-3643 tokens
2. **Compliance Layer**: Vault has its own ONCHAINID and is whitelisted by RWA issuers
3. **Price Oracle**: Gets RWA token prices for NAV calculation
4. **Dividend Handling**: Supports both push (airdrop) and pull (claimable) scenarios
5. **Rewards Module**: Optional module for distributing raw dividends

## Deployment Steps

### 1. Deploy Infrastructure

```solidity
// Deploy price oracle
SimplePriceOracle oracle = new SimplePriceOracle();

// Deploy compliant strategy adapter
CompliantStrategyAdapter adapter = new CompliantStrategyAdapter();

// Deploy dividend distributors (one per RWA token, if needed)
SimpleDividendDistributor distributor1 = new SimpleDividendDistributor(usdcAddress);
SimpleDividendDistributor distributor2 = new SimpleDividendDistributor(usdcAddress);
```

### 2. Deploy Factory

```solidity
PraxosFactoryCompliant factory = new PraxosFactoryCompliant(
    address(adapter),
    address(oracle)
);
```

### 3. Set Up Compliance

**Critical:** Before creating vaults, you must:

1. **Deploy ONCHAINID for your vault** (or use existing identity)
2. **Contact RWA token issuers** to whitelist your vault address
3. **Register vault identity** with the adapter

```solidity
// Whitelist vault for RWA tokens (must be done before vault creation)
adapter.whitelistVault(rwaToken1, vaultAddress);
adapter.whitelistVault(rwaToken2, vaultAddress);

// Register vault identity
adapter.registerVaultIdentity(rwaToken1, vaultAddress, vaultIdentityAddress);
```

### 4. Set Up Price Oracle

```solidity
// Set prices for RWA tokens (in USDC, 18 decimals)
oracle.updatePrice(rwaToken1, 1e18); // 1 USDC = 1 RWA token
oracle.updatePrice(rwaToken2, 1e18);
```

### 5. Create Compliant Vault

```solidity
VaultConfig memory config = VaultConfig({
    baseAsset: usdcAddress,
    name: "Global Sovereign Yield Alpha",
    symbol: "GSYA",
    strategy: "balanced-diversified",
    riskTier: 1,
    targetDuration: 365 days,
    assets: [rwaToken1, rwaToken2],
    weights: [5000, 5000], // 50% each
    dividendDistributors: [address(distributor1), address(distributor2)]
});

address vault = factory.createVault(config);
```

### 6. Configure Vault

```solidity
PraxosVaultCompliant vaultContract = PraxosVaultCompliant(vault);

// Set vault identity (ONCHAINID)
vaultContract.setVaultIdentity(vaultIdentityAddress);

// Optional: Set rewards module (if distributing raw dividends)
vaultContract.setRewardsModule(rewardsModuleAddress);
vaultContract.setAutoCompound(false); // Set to false to use rewards module
```

## Usage

### User Deposits

```solidity
// User deposits USDC
vaultContract.deposit(1000e6, userAddress);
// This automatically:
// 1. Mints vault shares
// 2. Splits USDC according to portfolio weights
// 3. Swaps USDC for RWA tokens via compliant adapter
```

### Harvest Dividends (Pull Scenario)

```solidity
// When dividends are available, harvest them
address[] memory tokens = [rwaToken1, rwaToken2];
vaultContract.harvest(tokens);

// If autoCompound = true: Dividends are reinvested
// If autoCompound = false: Dividends go to rewards module
```

### Claim Rewards (If Using Rewards Module)

```solidity
// Users claim their share of dividends
RewardsModule(rewardsModuleAddress).claimReward();
```

## Key Differences from Standard ERC-4626

1. **Multi-Asset**: Holds multiple ERC-3643 tokens, not just one asset
2. **Compliance Required**: Vault must be whitelisted by RWA issuers
3. **ONCHAINID**: Vault needs its own identity contract
4. **Price Oracle**: Uses oracle for NAV calculation (RWAs don't have spot prices)
5. **Dividend Handling**: Supports both push and pull dividend scenarios
6. **Optional Rewards**: Can distribute raw dividends instead of auto-compounding

## Compliance Levels

### Strict Compliance
- Vault shares are also ERC-3643 tokens
- Users must be whitelisted to hold vault shares
- Full KYC required

### Loose Compliance
- Vault shares are standard ERC-20
- Users only need Vault's KYC (not underlying RWA KYC)
- Vault acts as legal custodian

## Important Notes

1. **You must contact RWA issuers** - They must explicitly approve your vault
2. **ONCHAINID is required** - Vault cannot hold ERC-3643 tokens without identity
3. **Price updates needed** - Oracle prices must be kept up to date
4. **Dividend distributors** - Set up one per RWA token if using pull scenario
5. **Gas costs** - Compliance checks add gas overhead

## Files Reference

- **Main Vault**: `contracts/PraxosVaultCompliant.sol`
- **Factory**: `contracts/PraxosFactoryCompliant.sol`
- **Interfaces**: `contracts/interfaces/`
- **Mocks/Examples**: `contracts/mocks/`
- **Rewards Module**: `contracts/RewardsModule.sol`

## Next Steps

1. Deploy ONCHAINID for your vault
2. Contact RWA token issuers for whitelisting
3. Set up price oracle (Chainlink, custom, or manual)
4. Configure dividend distributors
5. Deploy and test vault creation
6. Set up frontend integration

