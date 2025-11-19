"use client";

import { useWriteContract, useWaitForTransactionReceipt, useReadContract } from "wagmi";
import { type Address, parseUnits } from "viem";
import { getVaultAbi, getUSDCAbi, getUSDCAddress, getContractsData } from "../contracts";

// Helper hook to get USDC decimals (MockUSDC uses 18, real USDC uses 6)
export function useUSDCDecimals() {
  const usdcAddress = getUSDCAddress();
  const usdcAbi = getUSDCAbi();
  
  const { data: decimals } = useReadContract({
    address: usdcAddress || undefined,
    abi: usdcAbi || undefined,
    functionName: "decimals",
    query: {
      enabled: !!usdcAddress && !!usdcAbi,
    },
  });
  
  return decimals ? Number(decimals) : 18; // Default to 18 for MockUSDC
}

export function useDeposit(vaultAddress: Address | undefined) {
  const vaultAbi = getVaultAbi();
  const usdcDecimals = useUSDCDecimals();

  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const deposit = async (amount: string, receiver?: Address) => {
    if (!vaultAddress) {
      throw new Error("Vault address not provided");
    }
    
    // Get fresh ABI in case it wasn't loaded when hook initialized
    const currentVaultAbi = getVaultAbi();
    if (!currentVaultAbi) {
      const contractsData = getContractsData();
      if (!contractsData) {
        throw new Error("Contracts not loaded. Please ensure contracts are deployed and contracts_data.json exists.");
      }
      throw new Error("Vault ABI not found. Please check that contracts_data.json contains PraxosVault, PraxosVaultCompliant, DemoVault, or DemoVaultCompliant.");
    }
    
    if (!amount || parseFloat(amount) <= 0) {
      throw new Error("Invalid deposit amount");
    }

    try {
      const amountWei = parseUnits(amount, usdcDecimals);
      const receiverAddress = receiver || vaultAddress;

      writeContract({
        address: vaultAddress,
        abi: currentVaultAbi,
        functionName: "deposit",
        args: [amountWei, receiverAddress],
      });
    } catch (error) {
      console.error("Deposit error:", error);
      throw error;
    }
  };

  return {
    deposit,
    hash,
    isPending: isPending || isConfirming,
    isSuccess,
    error,
  };
}

export function useWithdraw(vaultAddress: Address | undefined) {
  const vaultAbi = getVaultAbi();

  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const usdcDecimals = useUSDCDecimals();

  const withdraw = async (assets: string, receiver?: Address, owner?: Address) => {
    if (!vaultAddress || !vaultAbi) {
      throw new Error("Contracts not loaded");
    }

    const assetsWei = parseUnits(assets, usdcDecimals);

    writeContract({
      address: vaultAddress,
      abi: vaultAbi,
      functionName: "withdraw",
      args: [assetsWei, receiver || vaultAddress, owner || vaultAddress],
    });
  };

  return {
    withdraw,
    hash,
    isPending: isPending || isConfirming,
    isSuccess,
    error,
  };
}

export function useApproveUSDC(spender: Address | undefined) {
  const usdcAddress = getUSDCAddress();
  const usdcAbi = getUSDCAbi();

  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const usdcDecimals = useUSDCDecimals();

  const approve = async (amount: string) => {
    if (!spender || !usdcAddress || !usdcAbi) {
      throw new Error("Contracts not loaded");
    }

    const amountWei = parseUnits(amount, usdcDecimals);

    writeContract({
      address: usdcAddress,
      abi: usdcAbi,
      functionName: "approve",
      args: [spender, amountWei],
    });
  };

  return {
    approve,
    hash,
    isPending: isPending || isConfirming,
    isSuccess,
    error,
  };
}

export function useUSDCAllowance(owner: Address | undefined, spender: Address | undefined) {
  const usdcAddress = getUSDCAddress();
  const usdcAbi = getUSDCAbi();

  const { data: allowance, isLoading, refetch } = useReadContract({
    address: usdcAddress || undefined,
    abi: usdcAbi || undefined,
    functionName: "allowance",
    args: owner && spender ? [owner, spender] : undefined,
    query: {
      enabled: !!owner && !!spender && !!usdcAddress && !!usdcAbi,
    },
  });

  return {
    allowance: (allowance as bigint) || BigInt(0),
    isLoading,
    refetch,
  };
}

export function useMintUSDC(recipient: Address | undefined) {
  const usdcAddress = getUSDCAddress();
  const usdcAbi = getUSDCAbi();

  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  // Check decimals (MockUSDC uses 18, real USDC uses 6)
  const { data: decimals } = useReadContract({
    address: usdcAddress || undefined,
    abi: usdcAbi || undefined,
    functionName: "decimals",
    query: {
      enabled: !!usdcAddress && !!usdcAbi,
    },
  });

  const mint = async (amount: string = "1000") => {
    if (!recipient) {
      throw new Error("Recipient address not provided");
    }
    if (!usdcAddress || !usdcAbi) {
      throw new Error("USDC contract not loaded");
    }

    // MockUSDC uses 18 decimals, real USDC uses 6
    const tokenDecimals = decimals ? Number(decimals) : 18;
    const amountWei = parseUnits(amount, tokenDecimals);

    console.log("💰 Minting USDC transaction details:");
    console.log("  📍 USDC Contract Address:", usdcAddress);
    console.log("  📍 Recipient Address:", recipient);
    console.log("  💵 Amount:", amount, "USDC");
    console.log("  🔢 Amount (wei):", amountWei.toString());
    console.log("  🔢 Decimals:", tokenDecimals);

    const result = writeContract({
      address: usdcAddress,
      abi: usdcAbi,
      functionName: "mint",
      args: [recipient, amountWei],
    });

    console.log("  📝 Transaction result:", result);
    
    return result;
  };

  return {
    mint,
    hash,
    isPending: isPending || isConfirming,
    isSuccess,
    error,
  };
}

