"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ChevronRight, Info, ShieldCheck, Globe, Loader2 } from 'lucide-react'
import { AssetIcon } from "./asset-icon"
import type { Vault } from "@/lib/mock-data"
import { useDeposit, useApproveUSDC, useUSDCAllowance, useMintUSDC } from "@/lib/hooks/use-vault-actions"
import { useAccount, useReadContract } from "wagmi"
import { parseUnits, formatUnits } from "viem"
import { useState, useEffect } from "react"
import { getUSDCAddress, getUSDCAbi } from "@/lib/contracts"

interface VaultCardProps {
  vault: Vault
  index: number
}

export function VaultCard({ vault, index }: VaultCardProps) {
  const { address: userAddress, isConnected } = useAccount()
  // Use vaultAddress from API response if available, otherwise check if id is an address
  const vaultAddress = vault.vaultAddress?.startsWith("0x") 
    ? (vault.vaultAddress as `0x${string}`)
    : vault.id.startsWith("0x") 
    ? (vault.id as `0x${string}`) 
    : undefined
  
  const [depositAmount, setDepositAmount] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  
  const { approve, isPending: isApproving, isSuccess: isApproved, hash: approveHash } = useApproveUSDC(vaultAddress)
  const { allowance, isLoading: isLoadingAllowance, refetch: refetchAllowance } = useUSDCAllowance(userAddress, vaultAddress)
  const { deposit, isPending: isDepositing, isSuccess: isDepositSuccess } = useDeposit(vaultAddress)
  const { mint: mintUSDC, isPending: isMinting, isSuccess: isMintSuccess } = useMintUSDC(userAddress)
  
  // Check USDC balance
  const usdcAddress = getUSDCAddress()
  const usdcAbi = getUSDCAbi()
  const { data: usdcBalance } = useReadContract({
    address: usdcAddress || undefined,
    abi: usdcAbi || undefined,
    functionName: "balanceOf",
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: !!userAddress && !!usdcAddress && !!usdcAbi,
    },
  })
  
  // Check decimals (MockUSDC uses 18, real USDC uses 6)
  const { data: decimals } = useReadContract({
    address: usdcAddress || undefined,
    abi: usdcAbi || undefined,
    functionName: "decimals",
    query: {
      enabled: !!usdcAddress && !!usdcAbi,
    },
  })
  
  const balance = (usdcBalance as bigint) || BigInt(0)
  const tokenDecimals = decimals ? Number(decimals) : 18 // Default to 18 for MockUSDC
  const balanceFormatted = formatUnits(balance, tokenDecimals)
  
  // Refetch allowance after approval succeeds
  useEffect(() => {
    if (isApproved && approveHash) {
      const timer = setTimeout(() => refetchAllowance(), 2000)
      return () => clearTimeout(timer)
    }
  }, [isApproved, approveHash, refetchAllowance])
  
  // Handle mint USDC
  const handleMintUSDC = async () => {
    try {
      await mintUSDC("1000") // Mint 1000 USDC
    } catch (error) {
      console.error("Mint error:", error)
      alert(error instanceof Error ? error.message : "Failed to mint USDC")
    }
  }
  
  const depositAmountWei = depositAmount ? parseUnits(depositAmount, tokenDecimals) : BigInt(0)
  const hasEnoughBalance = depositAmount ? balance >= depositAmountWei : true
  const needsApproval = vaultAddress && userAddress && allowance < depositAmountWei && depositAmountWei > BigInt(0)
  
  const handleInvest = () => {
    if (!isConnected) {
      alert("Please connect your wallet first")
      return
    }
    setIsDialogOpen(true)
  }
  
  const handleDeposit = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      alert("Please enter a valid amount")
      return
    }
    
    if (!vaultAddress) {
      alert("Vault address not available")
      return
    }
    
    try {
      if (needsApproval) {
        await approve(depositAmount)
      } else {
        await deposit(depositAmount, userAddress)
      }
    } catch (error) {
      console.error("Deposit error:", error)
      alert(error instanceof Error ? error.message : "Failed to deposit. Please check console for details.")
    }
  }
  
  // Close dialog on successful deposit
  if (isDepositSuccess && isDialogOpen) {
    setTimeout(() => {
      setIsDialogOpen(false)
      setDepositAmount("")
    }, 2000)
  }

  return (
    <Card className="group relative overflow-hidden border-border/50 bg-card/50 transition-all hover:border-primary/50 hover:bg-card/80">
      <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-primary to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      
      <CardHeader className="flex flex-col gap-4 pb-2 md:flex-row md:items-start md:justify-between md:gap-6">
        <div className="space-y-1 md:flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold leading-none tracking-tight">{vault.name}</h3>
            {vault.isNew && (
              <Badge variant="secondary" className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20">
                New
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2">{vault.description}</p>
        </div>
        
        <div className="flex items-center justify-between gap-4 md:flex-col md:items-end md:justify-start md:gap-1 md:text-right">
          <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
            <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
            {vault.matchPercentage}% Match
          </div>
          <div className="flex flex-col items-start md:items-end">
             <div className="text-2xl font-bold text-primary">{vault.apr}%</div>
             <span className="text-xs font-normal text-muted-foreground">APR</span>
          </div>

        </div>
      </CardHeader>
      
      <CardContent>
        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <span>Underlying Assets</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3 w-3" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Assets held in this vault strategy</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            
            <div className="flex items-center -space-x-2">
              {vault.assets.slice(0, 5).map((asset, i) => (
                <TooltipProvider key={i}>
                  <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                      <div className="relative transition-transform hover:z-10 hover:scale-110">
                        <AssetIcon type={asset.type} provider={asset.provider} />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="w-64 p-0">
                      <div className="flex flex-col gap-2 p-3">
                        <div className="flex items-center gap-2 border-b border-border/50 pb-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
                            <AssetIcon type={asset.type} provider={asset.provider} size="sm" />
                          </div>
                          <div>
                            <p className="font-semibold text-sm">{asset.name}</p>
                            <p className="text-xs text-muted-foreground">{asset.provider}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Globe className="h-3 w-3" />
                            {asset.country}
                          </div>
                          <div className="flex items-center gap-1 text-green-500">
                            <ShieldCheck className="h-3 w-3" />
                            {asset.rating} Rated
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">{asset.description}</p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
              {vault.assets.length > 5 && (
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-background bg-muted text-xs font-medium text-muted-foreground ring-2 ring-background">
                  +{vault.assets.length - 5}
                </div>
              )}
            </div>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                className="w-full sm:w-auto group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                onClick={handleInvest}
                disabled={!isConnected}
              >
                {isConnected ? (
                  <>
                    Invest Now
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </>
                ) : (
                  "Connect Wallet"
                )}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invest in {vault.name}</DialogTitle>
                <DialogDescription>
                  Deposit USDC to receive vault shares
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="amount">Amount (USDC)</Label>
                    {userAddress && (
                      <span className="text-xs text-muted-foreground">
                        Balance: {balanceFormatted} USDC
                      </span>
                    )}
                  </div>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="0.00"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    disabled={isDepositing || isApproving || isMinting}
                  />
                </div>
                {!hasEnoughBalance && depositAmount && (
                  <div className="rounded-lg bg-orange-500/10 border border-orange-500/20 p-3">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-orange-600 dark:text-orange-400">
                        Insufficient USDC balance. You need {depositAmount} USDC but only have {balanceFormatted} USDC.
                      </div>
                      <Button
                        onClick={handleMintUSDC}
                        disabled={isMinting}
                        size="sm"
                        variant="outline"
                        className="ml-2"
                      >
                        {isMinting ? (
                          <>
                            <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                            Minting...
                          </>
                        ) : (
                          "Mint 1000 USDC"
                        )}
                      </Button>
                    </div>
                  </div>
                )}
                {isMintSuccess && (
                  <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-3 text-sm text-green-600 dark:text-green-400">
                    Successfully minted 1000 USDC!
                  </div>
                )}
                {needsApproval && !isApproved && hasEnoughBalance && (
                  <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/20 p-3 text-sm text-yellow-600 dark:text-yellow-400">
                    <div className="font-semibold mb-1">Step 1: Approve USDC Spending</div>
                    <div className="text-xs opacity-90">
                      Click "Approve USDC" below and confirm the transaction in MetaMask. This allows the vault to spend your USDC.
                    </div>
                  </div>
                )}
                {isApproving && (
                  <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-3 text-sm text-blue-600 dark:text-blue-400">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Waiting for approval transaction confirmation in MetaMask...</span>
                    </div>
                  </div>
                )}
                {isApproved && needsApproval && (
                  <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-3 text-sm text-green-600 dark:text-green-400">
                    ✅ USDC approved! You can now deposit.
                  </div>
                )}
                <div className="flex gap-2">
                  {needsApproval && !isApproved ? (
                    <Button
                      onClick={handleDeposit}
                      disabled={!depositAmount || isApproving || isDepositing || !hasEnoughBalance}
                      className="w-full"
                    >
                      {isApproving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Approving...
                        </>
                      ) : (
                        "Approve USDC"
                      )}
                    </Button>
                  ) : (
                    <Button
                      onClick={handleDeposit}
                      disabled={!depositAmount || isDepositing || isApproving || !hasEnoughBalance || (needsApproval && !isApproved)}
                      className="w-full"
                    >
                      {isDepositing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Depositing...
                        </>
                      ) : (
                        "Deposit"
                      )}
                    </Button>
                  )}
                </div>
                {isDepositSuccess && (
                  <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-3 text-sm text-green-600 dark:text-green-400">
                    Deposit successful!
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  )
}
