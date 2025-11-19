# Compliant RWA Index Vault Architecture

## Overview

This document explains the architecture for creating compliant RWA (Real World Asset) Index Vaults that bridge ERC-4626 and ERC-3643 standards.

## The Challenge

You are bridging two fundamentally different standards:
- **ERC-4626**: Permissionless, composable yield vaults
- **ERC-3643**: Permissioned, identity-gated securities

To achieve an "ETF-style" vault where a single ERC-4626 token represents a basket of compliant RWAs, you must solve the **Identity Proxy problem**: the Vault itself must be a verified entity capable of holding the underlying regulated tokens.

## Core Architecture

### 1. Multi-Asset Strategy Logic

Unlike a standard ERC-4626 which maps 1 Asset → 1 Vault, you need a **Multi-Asset Strategy logic**. Since ERC-4626 strictly requires a single `asset()` for accounting (usually USDC), your vault acts as a **"Fund Manager"** that:
- Takes USDC deposits
- Splits USDC based on portfolio weights
- Swaps USDC for ERC-3643 tokens
- Holds multiple RWA tokens

### 2. The Flow

1. User deposits USDC into the Vault
2. Vault verifies User is compliant (optional, but recommended for RWA)
3. Vault splits USDC based on a defined "Portfolio Weight" (e.g., 50% Real Estate Token A, 50% Bond Token B)
4. Vault swaps USDC for the specific ERC-3643 tokens (via compliant swap or direct minting)
5. Institutional Payment (Dividends) arrives at the ERC-3643 token contract → claimed by Vault → distributed to Vault users

## Compliance (Identity) Layer

### Critical Requirement

**ERC-3643 tokens check the ONCHAINID of the recipient on every transfer.** If your Vault contract does not have a valid identity, all buy/sell transactions will revert.

### The "Smart Contract Identity" Pattern

Your Vault must possess its own **ONCHAINID**. You cannot simply whitelist the contract address; the standard requires an identity verification.

#### Step A: Deploy ONCHAINID for the Vault
- Deploy a standard Identity contract (from the ONCHAINID protocol)
- Set the `managementKey` to the Vault's owner/admin multisig

#### Step B: Link Identity to Vault
- Your Vault does not "sign" transactions like a user
- Instead, the RWA issuer whitelists the Vault's Address in their `IdentityRegistry` under the Vault's ONCHAINID

#### Step C: Waiver/Bypass (Alternative)
- Some issuers can add your Vault to a "Marketplace Whitelist" or "Agent" list
- This allows it to hold tokens without a full KYC process, treating it as a "Qualified Custodian"

**Critical Requirement:** You must contact the issuers of the underlying ERC-3643 tokens. They must explicitly approve your Vault contract address to hold their tokens.

## Implementation Details

### A. Deposit & Split Logic

When `deposit(uint256 assets, address receiver)` is called:

```solidity
function _invest(uint256 usdcAmount) internal {
    for (uint i = 0; i < portfolio.length; i++) {
        address rwaToken = portfolio[i].token;
        uint256 allocation = (usdcAmount * portfolio[i].weight) / 10000;

        // Swap USDC for RWA Token (or Mint)
        // The Vault's address must be whitelisted to receive this transfer!
        compliantSwap(usdcAsset, rwaToken, allocation);
    }
}
```

**Note:** If secondary markets (liquidity pools) don't exist for these RWAs, this might involve:
- Calling a `mint()` function on the RWA contract (if the Vault is an authorized agent)
- Swapping via a permissioned DEX

### B. Total Assets Calculation

The price of your Vault Share depends on the value of the underlying RWAs. You need an **Oracle** or a **Net Asset Value (NAV) feed**, because RWA tokens often don't have real-time public spot prices like ETH.

```solidity
function totalAssets() public view override returns (uint256) {
    uint256 totalVal = asset.balanceOf(address(this)); // Uninvested USDC
    
    for (uint i = 0; i < portfolio.length; i++) {
        uint256 rwaBalance = IERC20(portfolio[i].token).balanceOf(address(this));
        uint256 price = getPrice(portfolio[i].token);
        totalVal += (rwaBalance * price) / 1e18; // Normalized to USDC decimals
    }
    
    return totalVal;
}
```

### C. Handling Institutional Payments (Dividends)

You mentioned payments sent to the ERC-3643 are "collected from the vault and distributed."

#### Scenario A: Push (Airdrop)
- The Institution sends USDC (or yield token) directly to the ERC-3643 token holders
- **Result:** Your Vault receives USDC
- **Action:** The Vault sees its `asset()` balance increase. The `totalAssets()` goes up
- **User Benefit:** The share price increases automatically. No extra transaction needed

#### Scenario B: Pull (Claimable)
- The Institution deposits funds into a `DividendDistributor` contract linked to the ERC-3643
- **Action:** You need a `harvest()` function on your Vault
- **Logic:**
  1. `harvest()` calls `claimDividends()` on the RWA token's distributor
  2. USDC arrives in the Vault
  3. Vault either auto-compounds (buys more RWA tokens) or sits on cash (increasing `totalAssets()`)

### D. Rewards Module (Optional)

If you want users to receive **raw dividends (income)** rather than accumulating value:

- **You cannot use standard ERC-4626 for this** (as it is designed to accumulate)
- **You would need a "Rewards" module** (like Synthetix StakingRewards or a split payment splitter)
- The harvested USDC is sent to a separate contract that users claim from based on their Vault Share balance

## User Experience & Restrictions

### Compliance Considerations

Since the underlying assets are permissioned (ERC-3643), the **Vault Shares themselves might need to be permissioned**.

**If a non-KYC'd user buys your Vault Shares, they technically own a claim on the RWA.**

#### Strict Compliance
- Make your Vault Share token also an **ERC-3643** or compliant ERC-20 that requires whitelisting

#### Loose Compliance
- If the Vault is the legal "Custodian," the users might only need to pass the Vault's specific KYC, not the underlying RWA's KYC (depending on jurisdiction)

## Contract Structure

### Core Contracts

1. **PraxosVaultCompliant.sol** - Main vault contract
   - Extends ERC-4626
   - Holds multiple ERC-3643 tokens
   - Implements compliance checks
   - Handles dividend harvesting

2. **ICompliantStrategyAdapter.sol** - Interface for compliance adapter
   - Handles whitelisting
   - Performs compliant swaps
   - Manages ONCHAINID registration

3. **IPriceOracle.sol** - Interface for price feeds
   - Gets RWA token prices
   - Used in `totalAssets()` calculation

4. **IDividendDistributor.sol** - Interface for dividend claims
   - Handles pull scenario dividends
   - Claimable by vaults

5. **RewardsModule.sol** - Optional rewards distribution
   - Distributes raw dividends to users
   - Users claim based on vault share balance

### Mock/Example Contracts

1. **CompliantStrategyAdapter.sol** - Example adapter implementation
2. **SimplePriceOracle.sol** - Simple price oracle
3. **SimpleDividendDistributor.sol** - Example dividend distributor

## Usage Example

```solidity
// 1. Deploy infrastructure
CompliantStrategyAdapter adapter = new CompliantStrategyAdapter();
SimplePriceOracle oracle = new SimplePriceOracle();

// 2. Deploy factory
PraxosFactoryCompliant factory = new PraxosFactoryCompliant(
    address(adapter),
    address(oracle)
);

// 3. Whitelist vault for RWA tokens (before creating vault)
adapter.whitelistVault(rwaToken1, vaultAddress);
adapter.whitelistVault(rwaToken2, vaultAddress);

// 4. Create vault
VaultConfig memory config = VaultConfig({
    baseAsset: usdcAddress,
    name: "Global Sovereign Yield Alpha",
    symbol: "GSYA",
    strategy: "balanced-diversified",
    riskTier: 1,
    targetDuration: 365 days,
    assets: [rwaToken1, rwaToken2],
    weights: [5000, 5000], // 50% each
    dividendDistributors: [distributor1, distributor2]
});

address vault = factory.createVault(config);

// 5. Set vault identity (ONCHAINID)
PraxosVaultCompliant(vault).setVaultIdentity(vaultIdentityAddress);

// 6. Users deposit USDC
PraxosVaultCompliant(vault).deposit(1000e6, userAddress);

// 7. Harvest dividends (when available)
address[] memory tokens = [rwaToken1, rwaToken2];
PraxosVaultCompliant(vault).harvest(tokens);
```

## Next Steps

1. **Deploy ONCHAINID** for your vault
2. **Contact RWA issuers** to whitelist your vault
3. **Set up price oracle** (Chainlink, custom oracle, or manual updates)
4. **Configure dividend distributors** for each RWA token
5. **Decide on compliance level** (strict vs loose) for vault shares
6. **Choose dividend strategy** (auto-compound vs rewards module)

## Files Created

- `contracts/PraxosVaultCompliant.sol` - Main compliant vault
- `contracts/interfaces/ICompliantStrategyAdapter.sol` - Compliance adapter interface
- `contracts/interfaces/IPriceOracle.sol` - Price oracle interface
- `contracts/interfaces/IDividendDistributor.sol` - Dividend distributor interface
- `contracts/interfaces/IIdentity.sol` - ONCHAINID interface
- `contracts/RewardsModule.sol` - Rewards distribution module
- `contracts/mocks/CompliantStrategyAdapter.sol` - Example adapter
- `contracts/mocks/SimplePriceOracle.sol` - Example oracle
- `contracts/mocks/SimpleDividendDistributor.sol` - Example distributor
- `contracts/PraxosFactoryCompliant.sol` - Factory for compliant vaults

