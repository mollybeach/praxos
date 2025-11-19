import { type VaultInfo } from "./hooks/use-vaults";
import { type Vault, type Asset } from "./mock-data";
import { formatUnits } from "viem";
import { getContractsData } from "./contracts";

// Convert blockchain vault data to UI format
export function vaultInfoToVault(vaultInfo: VaultInfo, index: number): Vault {
  const contractsData = getContractsData();
  
  // Calculate APR (simplified - in production this would come from oracle or off-chain)
  // For now, use a mock calculation based on risk tier
  const baseAPR = 3 + (vaultInfo.riskTier * 1.5);
  const apr = Number(baseAPR.toFixed(2));

  // Calculate match percentage (mock - would come from AI/backend)
  const matchPercentage = 85 + (index * 3);

  // Get assets from contract allocations (simplified - would need to fetch RWA token metadata)
  const assets: Asset[] = [];
  
  // For now, create mock assets based on strategy
  if (vaultInfo.strategy.includes("bond") || vaultInfo.strategy.includes("Bond")) {
    assets.push({
      name: "Corporate Bond Alpha",
      type: "bond",
      provider: "BlackRock",
      country: "USA",
      rating: "AAA",
      description: "High-grade corporate debt",
    });
  }
  if (vaultInfo.strategy.includes("real") || vaultInfo.strategy.includes("Real")) {
    assets.push({
      name: "Real Estate Fund Beta",
      type: "reit",
      provider: "Vanguard",
      country: "USA",
      rating: "A",
      description: "Commercial real estate investment trust",
    });
  }
  if (vaultInfo.strategy.includes("startup") || vaultInfo.strategy.includes("Startup")) {
    assets.push({
      name: "Startup Fund Gamma",
      type: "fund",
      provider: "Goldman Sachs",
      country: "USA",
      rating: "BBB",
      description: "Venture capital and private equity fund",
    });
  }

  // If no assets from strategy, add default
  if (assets.length === 0) {
    assets.push({
      name: "Diversified Portfolio",
      type: "etf",
      provider: "BlackRock",
      country: "Global",
      rating: "A",
      description: "Multi-asset diversified strategy",
    });
  }

  return {
    id: vaultInfo.address,
    name: vaultInfo.name,
    description: `${vaultInfo.strategy} vault with ${vaultInfo.riskTier} risk tier. Total assets: ${formatUnits(vaultInfo.totalAssets, 6)} USDC`,
    apr,
    matchPercentage,
    isNew: index === 0, // Mark first vault as new
    assets,
  };
}

// Get total assets value in USDC
export function getTotalAssetsValue(vaultInfo: VaultInfo): string {
  return formatUnits(vaultInfo.totalAssets, 6);
}

// Get share price
export function getSharePrice(vaultInfo: VaultInfo): string {
  if (vaultInfo.totalSupply === 0n) {
    return "1.00";
  }
  const price = (Number(vaultInfo.totalAssets) / Number(vaultInfo.totalSupply)) * 1e6;
  return price.toFixed(2);
}

