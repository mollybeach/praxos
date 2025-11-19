# Vault Storage Architecture Explanation

## Current Structure

### On-Chain (Smart Contracts)

#### 1. **PraxosFactory.sol**
- **Stores:** List of all vault addresses
- **Functions:**
  - `createVault(VaultConfig)` - Creates a new vault
  - `getAllVaults()` - Returns all vault addresses
  - `isVault(address)` - Checks if address is a valid vault

#### 2. **PraxosVault.sol** (ERC-4626)
- **Stores:**
  - Basic metadata: `name`, `symbol`, `vaultStrategy`, `riskTier`, `targetDuration`
  - Asset allocations: Array of `(address asset, uint256 weight)` pairs
  - ERC-4626 data: `totalAssets()`, `balanceOf(address)`
- **Functions:**
  - `getVaultInfo()` - Returns: strategy, riskTier, targetDuration, assetCount
  - `getAllocations()` - Returns: asset addresses and weights
  - `addAsset(address, uint256)` - Adds an asset with weight
  - `deposit(uint256, address)` - Deposits assets

### Off-Chain (Frontend/Backend)

#### Current Frontend Types:
- **VaultInfo** - Basic on-chain data (from contracts)
- **Vault** - Enhanced UI data with:
  - APR (Annual Percentage Rate)
  - Match percentage (calculated from user preferences)
  - Detailed asset info (provider, country, rating, description)
  - Asset types (bond, reit, fund, etc.)

## What's NOT Currently Stored On-Chain

1. **APR** - Annual Percentage Rate (calculated or provided off-chain)
2. **Match Percentage** - User preference matching score (calculated off-chain)
3. **Asset Metadata** - Provider name, country, rating, description
4. **Asset Types** - Whether asset is bond, reit, fund, etc.

## Options for Storing Enhanced Vault Data

### Option 1: Extend Smart Contracts (Most On-Chain)

**Pros:**
- Fully decentralized
- Data is immutable and verifiable
- No external dependencies

**Cons:**
- Gas costs for storing strings
- Contract size limits
- Harder to update metadata

**Implementation:**
```solidity
// In PraxosVault.sol
struct AssetMetadata {
    address asset;
    uint256 weight;
    string assetType;      // "bond", "reit", "fund"
    string provider;      // "BlackRock", "Vanguard"
    string country;       // "US", "UK"
    string rating;        // "AAA", "AA"
    string description;
}

uint256 public apr; // Stored as basis points (542 = 5.42%)
AssetMetadata[] public assetMetadata;
```

### Option 2: IPFS/Arweave + On-Chain Hash (Recommended)

**Pros:**
- Lower gas costs (only store hash)
- Can store rich metadata
- Decentralized storage
- Easy to update

**Cons:**
- Requires IPFS/Arweave infrastructure
- Need to handle pinning

**Implementation:**
```solidity
// In PraxosVault.sol
string public metadataURI; // IPFS hash like "ipfs://Qm..."

// Frontend stores full metadata JSON on IPFS:
{
  "apr": 5.42,
  "description": "Diversified exposure...",
  "assets": [
    {
      "address": "0x...",
      "type": "bond",
      "provider": "BlackRock",
      "country": "US",
      "rating": "AAA"
    }
  ]
}
```

### Option 3: Hybrid Approach (Current + Recommended)

**On-Chain:**
- Store essential data: vault address, basic config, asset addresses
- Store APR as `uint256` (in basis points: 542 = 5.42%)

**Off-Chain (Backend API):**
- Store rich metadata: descriptions, asset details, provider info
- Calculate match percentages based on user preferences
- Link on-chain vaults to off-chain metadata

**Implementation:**

1. **Extend PraxosVault.sol:**
```solidity
uint256 public aprBps; // APR in basis points (542 = 5.42%)

function setAPR(uint256 _aprBps) external onlyOwner {
    aprBps = _aprBps;
}
```

2. **Backend API stores:**
```json
{
  "vaultAddress": "0x...",
  "description": "Diversified exposure...",
  "assets": [
    {
      "address": "0x...",
      "name": "BL",
      "type": "bond",
      "provider": "BlackRock",
      "country": "US",
      "rating": "AAA",
      "description": "US Treasury"
    }
  ]
}
```

3. **Frontend combines:**
- Fetch on-chain data (address, APR, allocations)
- Fetch off-chain metadata (descriptions, asset details)
- Calculate match percentage from user preferences
- Merge into `Vault` interface

## Recommended Implementation

### Step 1: Add APR to Contract

```solidity
// In PraxosVault.sol
uint256 public aprBps; // APR in basis points

function setAPR(uint256 _aprBps) external onlyOwner {
    require(_aprBps <= 10000, "APR cannot exceed 100%");
    aprBps = _aprBps;
    emit APRUpdated(_aprBps);
}
```

### Step 2: Create Metadata Registry Contract (Optional)

```solidity
// VaultMetadataRegistry.sol
contract VaultMetadataRegistry {
    mapping(address => string) public vaultDescriptions;
    mapping(address => string) public vaultMetadataURI; // IPFS hash
    
    function setVaultDescription(address vault, string memory description) external {
        vaultDescriptions[vault] = description;
    }
    
    function setVaultMetadataURI(address vault, string memory uri) external {
        vaultMetadataURI[vault] = uri;
    }
}
```

### Step 3: Backend API Endpoint

```python
# GET /api/vaults/{vaultAddress}/metadata
{
  "vaultAddress": "0x...",
  "description": "Diversified exposure...",
  "assets": [
    {
      "address": "0x...",
      "name": "BL",
      "type": "bond",
      "provider": "BlackRock",
      "country": "US",
      "rating": "AAA"
    }
  ]
}
```

### Step 4: Frontend Integration

```typescript
// Combine on-chain and off-chain data
async function loadEnhancedVault(
  vaultAddress: string,
  userPreferences?: VaultPreferences
): Promise<Vault> {
  // 1. Get on-chain data
  const vaultInfo = await loadVaultInfo(vaultAddress);
  
  // 2. Get off-chain metadata
  const metadata = await api.getVaultMetadata(vaultAddress);
  
  // 3. Calculate match percentage
  const matchPercentage = calculateMatch(vaultInfo, userPreferences);
  
  // 4. Combine into Vault interface
  return {
    id: vaultAddress,
    address: vaultAddress,
    name: vaultInfo.name,
    description: metadata.description,
    apr: vaultInfo.aprBps / 100, // Convert from basis points
    matchPercentage,
    assets: metadata.assets,
    riskTier: vaultInfo.riskTier,
    totalAssets: vaultInfo.totalAssets,
    userBalance: vaultInfo.userBalance,
  };
}
```

## Summary

**Current State:**
- ✅ On-chain: Vault addresses, basic config, asset allocations
- ❌ Off-chain: APR, match percentage, detailed asset metadata

**Recommended Approach:**
1. Store APR on-chain (as uint256 basis points)
2. Store rich metadata off-chain (backend API or IPFS)
3. Calculate match percentage in frontend/backend
4. Combine both sources in frontend

This gives you:
- **Decentralized core** (vault addresses, allocations, APR)
- **Flexible metadata** (easy to update descriptions, asset details)
- **Low gas costs** (minimal on-chain storage)
- **Best UX** (rich data for UI)

