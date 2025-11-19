"use client"

import { SidebarTrigger } from "@/components/ui/sidebar"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { Button } from "@/components/ui/button"
import { useMintUSDC } from "@/lib/hooks/use-vault-actions"
import { useAccount } from "wagmi"
import { getUSDCAddress, getTransactionExplorerUrl } from "@/lib/contracts"
import { Loader2, Coins } from "lucide-react"
import { useState, useEffect } from "react"

interface AppHeaderProps {
  title: string
}

export function AppHeader({ title }: AppHeaderProps) {
  const { address, isConnected } = useAccount()
  const { mint, isPending: isMinting, isSuccess: isMintSuccess, hash: mintHash } = useMintUSDC(address)
  const [showSuccess, setShowSuccess] = useState(false)

  const handleMintUSDC = async () => {
    const usdcAddress = getUSDCAddress()
    
    try {
      console.log("🚀 ========== MINT USDC TRANSACTION ==========")
      if (address) {
        console.log("📍 Recipient address:", address)
      }
      if (usdcAddress) {
        console.log("📍 USDC Contract address:", usdcAddress)
      }
      console.log("💵 Amount: 1000 USDC")
      console.log("⏳ Initiating mint transaction...")
      
      await mint("1000") // Mint 1000 USDC
      
      console.log("✅ Mint transaction submitted successfully")
      console.log("📝 Transaction hash will be available after confirmation")
      console.log("================================================")
      
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)
    } catch (error) {
      console.error("❌ ========== MINT USDC ERROR ==========")
      if (address) {
        console.error("📍 Recipient address:", address)
      }
      if (usdcAddress) {
        console.error("📍 USDC Contract address:", usdcAddress)
      }
      console.error("💥 Error details:", error)
      console.error("=========================================")
      alert(error instanceof Error ? error.message : "Failed to mint USDC")
    }
  }
  
  // Log transaction hash when available
  useEffect(() => {
    if (mintHash) {
      const explorerUrl = getTransactionExplorerUrl(mintHash)
      console.log("📝 Mint transaction hash:", mintHash)
      console.log("🔗 Explorer URL:", explorerUrl)
    }
  }, [mintHash])

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-border/40 px-4 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
      </div>
      <div className="flex items-center gap-2">
        {isConnected && (
          <Button
            onClick={handleMintUSDC}
            disabled={isMinting}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            {isMinting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Minting...
              </>
            ) : (
              <>
                <Coins className="h-4 w-4" />
                Mint USDC
              </>
            )}
          </Button>
        )}
        <ConnectButton />
      </div>
      {showSuccess && isMintSuccess && (
        <div className="fixed top-4 right-4 z-50 rounded-lg bg-green-500/10 border border-green-500/20 p-3 text-sm text-green-600 dark:text-green-400 shadow-lg">
          Successfully minted 1000 USDC!
        </div>
      )}
    </header>
  )
}

