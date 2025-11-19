"use client";

import { useReadContract, useReadContracts } from "wagmi";
import { useMemo } from "react";
import { type Address, formatUnits, parseUnits } from "viem";
import { getFactoryAddress, getFactoryAbi, getVaultAbi, type ContractsData, getContractsData } from "../contracts";

export interface VaultInfo {
  address: Address;
  name: string;
  symbol: string;
  strategy: string;
  riskTier: number;
  targetDuration: bigint;
  assetCount: bigint;
  totalAssets: bigint;
  totalSupply: bigint;
  asset: Address;
}

export function useAllVaults() {
  const factoryAddress = getFactoryAddress();
  const factoryAbi = getFactoryAbi();

  // Get all vault addresses from factory
  const { data: vaultAddresses, isLoading: isLoadingAddresses } = useReadContract({
    address: factoryAddress || undefined,
    abi: factoryAbi || undefined,
    functionName: "getAllVaults",
    query: {
      enabled: !!factoryAddress && !!factoryAbi,
    },
  });

  return {
    vaultAddresses: (vaultAddresses as Address[]) || [],
    isLoading: isLoadingAddresses,
  };
}

// Placeholder address for maintaining consistent hook calls
const PLACEHOLDER_ADDRESS = "0x0000000000000000000000000000000000000000" as Address;

export function useVaultInfo(vaultAddress: Address | undefined) {
  const vaultAbi = getVaultAbi();

  // Always return a fixed-size array to prevent hook order changes
  // Use a placeholder address when vaultAddress is undefined to maintain array size
  const contracts = useMemo(() => {
    const address = vaultAddress || PLACEHOLDER_ADDRESS;
    const abi = vaultAbi || [];

    // Always return the same array structure
    return [
      {
        address,
        abi,
        functionName: "name" as const,
      },
      {
        address,
        abi,
        functionName: "symbol" as const,
      },
      {
        address,
        abi,
        functionName: "getVaultInfo" as const,
      },
      {
        address,
        abi,
        functionName: "totalAssets" as const,
      },
      {
        address,
        abi,
        functionName: "totalSupply" as const,
      },
      {
        address,
        abi,
        functionName: "asset" as const,
      },
    ];
  }, [vaultAddress, vaultAbi]);

  const { data, isLoading, error } = useReadContracts({
    contracts,
    query: {
      enabled: !!vaultAddress && !!vaultAbi,
    },
  });

  const vaultInfo: VaultInfo | null = useMemo(() => {
    if (!vaultAddress || !data || data.some((d) => d.status !== "success")) {
      return null;
    }

    const [name, symbol, vaultInfoData, totalAssets, totalSupply, asset] = data.map(
      (d) => d.result
    ) as [string, string, [string, number, bigint, bigint], bigint, bigint, Address];

    return {
      address: vaultAddress,
      name: name as string,
      symbol: symbol as string,
      strategy: vaultInfoData[0],
      riskTier: vaultInfoData[1],
      targetDuration: vaultInfoData[2],
      assetCount: vaultInfoData[3],
      totalAssets,
      totalSupply,
      asset,
    };
  }, [vaultAddress, data]);

  return {
    vaultInfo,
    isLoading,
    error,
  };
}

export function useVaults() {
  const { vaultAddresses, isLoading: isLoadingAddresses } = useAllVaults();

  // Use individual hooks for each vault address (up to MAX_VAULTS)
  // This ensures consistent hook order - always call the same number of hooks
  // Hooks must be called in the same order every render
  const MAX_VAULTS = 10; // Adjust based on expected max vaults
  
  const vault0 = useVaultInfo(vaultAddresses[0]);
  const vault1 = useVaultInfo(vaultAddresses[1]);
  const vault2 = useVaultInfo(vaultAddresses[2]);
  const vault3 = useVaultInfo(vaultAddresses[3]);
  const vault4 = useVaultInfo(vaultAddresses[4]);
  const vault5 = useVaultInfo(vaultAddresses[5]);
  const vault6 = useVaultInfo(vaultAddresses[6]);
  const vault7 = useVaultInfo(vaultAddresses[7]);
  const vault8 = useVaultInfo(vaultAddresses[8]);
  const vault9 = useVaultInfo(vaultAddresses[9]);

  const allVaultInfos = [vault0, vault1, vault2, vault3, vault4, vault5, vault6, vault7, vault8, vault9];

  const isLoading = isLoadingAddresses || allVaultInfos.some((v) => v.isLoading);

  const vaults: VaultInfo[] = useMemo(() => {
    // Only include vaults that actually exist (have valid addresses)
    return allVaultInfos
      .slice(0, Math.min(vaultAddresses.length, MAX_VAULTS))
      .map((v) => v.vaultInfo)
      .filter((v): v is VaultInfo => v !== null);
  }, [allVaultInfos, vaultAddresses.length]);

  return {
    vaults,
    isLoading,
  };
}

export function useVaultBalance(vaultAddress: Address | undefined, userAddress: Address | undefined) {
  const vaultAbi = getVaultAbi();

  const { data: balance, isLoading } = useReadContract({
    address: vaultAddress,
    abi: vaultAbi || undefined,
    functionName: "balanceOf",
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: !!vaultAddress && !!userAddress && !!vaultAbi,
    },
  });

  return {
    balance: balance || BigInt(0),
    isLoading,
  };
}

export function useVaultAssets(vaultAddress: Address | undefined) {
  const vaultAbi = getVaultAbi();

  const { data: allocations, isLoading } = useReadContract({
    address: vaultAddress,
    abi: vaultAbi || undefined,
    functionName: "getAllocations",
    query: {
      enabled: !!vaultAddress && !!vaultAbi,
    },
  });

  return {
    allocations: allocations as [Address[], bigint[]] | undefined,
    isLoading,
  };
}

