import { type Address, type Abi } from "viem";

// Import contracts data - file contains valid JSON (empty object {} if not deployed yet)
// Next.js will parse this at build time, so it must always be valid JSON
// The deploy script will populate this file with actual contract data
import contractsDataRaw from "./data/contracts_data.json";

// Type assertion to handle the JSON import
const contractsData: unknown = contractsDataRaw;

export interface ContractData {
  name: string;
  address: Address;
  explorerUrl: string;
  abiRaw: Abi;
}

export interface ContractsData {
  deploymentId: string;
  deployedBy: Address;
  networkName: string;
  chainId: string;
  explorerUrl: string;
  deployedAt: string;
  deploymentType: string;
  contracts: Record<string, ContractData>;
  configuration: {
    vaultStrategy: string;
    vaultRiskTier: number;
    vaultTargetDuration: number;
    vaultWeights: number[];
    bondYield: number;
    realEstateYield: number;
    startupYield: number;
  };
}

// Type guard to check if contracts_data.json has valid structure
function isValidContractsData(data: unknown): data is ContractsData {
  if (typeof data !== "object" || data === null) return false;
  const obj = data as Record<string, unknown>;
  return (
    typeof obj.deploymentId === "string" &&
    typeof obj.contracts === "object" &&
    obj.contracts !== null
  );
}

// Load contracts data
let contractsDataCache: ContractsData | null = null;

export function getContractsData(): ContractsData | null {
  if (contractsDataCache) {
    return contractsDataCache;
  }

  try {
    // contracts_data.json should be populated by the deploy script
    // Check if it's an empty object or has no contracts
    if (!contractsData || 
        Object.keys(contractsData).length === 0 || 
        (typeof contractsData === 'object' && !('contracts' in contractsData))) {
      if (typeof window !== 'undefined') {
        console.warn("⚠️ contracts_data.json is empty. Run the deploy script first.");
      }
      return null;
    }

    if (isValidContractsData(contractsData)) {
      contractsDataCache = contractsData;
      return contractsDataCache;
    } else {
      if (typeof window !== 'undefined') {
        console.error("❌ Invalid contracts_data.json structure");
      }
      return null;
    }
  } catch (error) {
    if (typeof window !== 'undefined') {
      console.error("❌ Failed to load contracts_data.json:", error);
    }
    return null;
  }
}

// Get contract by name
export function getContract(name: string): ContractData | null {
  const data = getContractsData();
  if (!data) return null;
  return data.contracts[name] || null;
}

// Get contract address by name
export function getContractAddress(name: string): Address | null {
  const contract = getContract(name);
  return contract ? contract.address : null;
}

// Get contract ABI by name
export function getContractAbi(name: string): Abi | null {
  const contract = getContract(name);
  return contract ? contract.abiRaw : null;
}

// Factory contract
export function getFactoryAddress(): Address | null {
  return getContractAddress("PraxosFactory") || getContractAddress("PraxosFactoryCompliant");
}

export function getFactoryAbi(): Abi | null {
  return getContractAbi("PraxosFactory") || getContractAbi("PraxosFactoryCompliant");
}

// USDC contract
export function getUSDCAddress(): Address | null {
  return getContractAddress("MockUSDC");
}

export function getUSDCAbi(): Abi | null {
  return getContractAbi("MockUSDC");
}

// Vault contracts
export function getVaultAddresses(): Address[] {
  const data = getContractsData();
  if (!data) return [];
  
  const vaults: Address[] = [];
  // Check all possible vault contract names
  const vaultNames = ["DemoVault", "DemoVaultCompliant", "PraxosVault", "PraxosVaultCompliant"];
  for (const name of vaultNames) {
    if (data.contracts[name]?.address) {
      vaults.push(data.contracts[name].address);
    }
  }
  return vaults;
}

export function getVaultAbi(): Abi | null {
  // Try both naming conventions (deployment uses DemoVault, but contracts are PraxosVault)
  return (
    getContractAbi("PraxosVault") || 
    getContractAbi("PraxosVaultCompliant") ||
    getContractAbi("DemoVault") ||
    getContractAbi("DemoVaultCompliant")
  );
}

// Get explorer base URL
export function getExplorerUrl(): string {
  const data = getContractsData();
  return data?.explorerUrl || "https://devnet-explorer.rayls.com";
}

// Generate transaction explorer URL
export function getTransactionExplorerUrl(txHash: string): string {
  const baseUrl = getExplorerUrl();
  // Remove trailing slash if present
  const cleanBase = baseUrl.replace(/\/$/, "");
  return `${cleanBase}/tx/${txHash}`;
}

// Generate address explorer URL
export function getAddressExplorerUrl(address: Address): string {
  const baseUrl = getExplorerUrl();
  // Remove trailing slash if present
  const cleanBase = baseUrl.replace(/\/$/, "");
  return `${cleanBase}/address/${address}`;
}

