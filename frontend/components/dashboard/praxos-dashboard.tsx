"use client"

import { useState } from "react"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Sparkles, Search, Check, Info, X } from 'lucide-react'
import { VaultCard } from "./vault-card"
import { mockVaults } from "@/lib/mock-data"
import { cn } from "@/lib/utils"
import { useVaults } from "@/lib/hooks/use-vaults"
import { vaultInfoToVault } from "@/lib/vault-utils"
import { useAccount } from "wagmi"

const CATEGORIES = [
  { id: "tbill", name: "T-Bill", description: "Short-term US Gov debt" },
  { id: "mutual-funds", name: "Mutual Funds", description: "Professionally managed pools" },
  { id: "etf", name: "Vanilla ETF", description: "Track major market indices" },
  { id: "gov-bonds", name: "Gov Bonds", description: "Long-term sovereign debt" },
  { id: "obligations", name: "Obligations", description: "Corporate debt securities" },
  { id: "reits", name: "REITs", description: "Real estate income trusts" },
  { id: "growing", name: "Growing Sectors", description: "High-growth industries" },
  { id: "emerging", name: "Emerging Markets", description: "Developing economy assets" },
  { id: "vc-pe", name: "VC/PE Funds", description: "Private equity & startups" },
]

export function PraxosDashboard() {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [riskLevel, setRiskLevel] = useState([2])
  const [amount, setAmount] = useState("1000")
  const [timeframe, setTimeframe] = useState("6m")
  const [isGenerating, setIsGenerating] = useState(false)
  const [showResults, setShowResults] = useState(false)
  
  // Load vaults from blockchain
  const { vaults: blockchainVaults, isLoading: isLoadingVaults } = useVaults()
  const { isConnected } = useAccount()
  
  // Convert blockchain vaults to UI format, fallback to mock data
  const displayVaults = blockchainVaults.length > 0
    ? blockchainVaults.map((v, i) => vaultInfoToVault(v, i))
    : mockVaults

  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category],
    )
  }

  const handleSelectAll = () => {
    const visibleCategories = CATEGORIES.filter(c => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      c.description.toLowerCase().includes(searchQuery.toLowerCase())
    ).map(c => c.name)

    const allVisibleSelected = visibleCategories.every(c => selectedCategories.includes(c))

    if (allVisibleSelected) {
      // Deselect all visible
      setSelectedCategories(prev => prev.filter(c => !visibleCategories.includes(c)))
    } else {
      // Select all visible
      const newSelected = [...selectedCategories]
      visibleCategories.forEach(c => {
        if (!newSelected.includes(c)) newSelected.push(c)
      })
      setSelectedCategories(newSelected)
    }
  }

  const filteredCategories = CATEGORIES.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleGenerate = () => {
    setIsGenerating(true)
    setShowResults(false)
    // Simulate API call
    setTimeout(() => {
      setIsGenerating(false)
      setShowResults(true)
    }, 1500)
  }

  const getRiskLabel = (val: number) => {
    if (val <= 1) return "Low"
    if (val <= 2) return "Average"
    if (val <= 3) return "Medium"
    if (val <= 4) return "High"
    return "Degen"
  }

  return (
    <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
      {/* Left Panel - Strategy Generator */}
      <div className="w-full lg:w-[450px] lg:shrink-0">
        <Card className="border-border/50 bg-card/50 backdrop-blur-xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary">
                  <Sparkles className="h-4 w-4" />
                </div>
                <CardTitle>Find Strategy Vaults</CardTitle>
              </div>
              <Badge variant="outline" className="bg-background/50">
                AI Powered
              </Badge>
            </div>
            <CardDescription>Configure your preferences to find the best TradFi opportunities.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Categories */}
            <div className="space-y-4">
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Preferred TradFi Investments
                  </label>
                  <button 
                    onClick={handleSelectAll}
                    className="text-xs text-primary hover:text-primary/80 transition-colors"
                  >
                    {filteredCategories.every(c => selectedCategories.includes(c.name)) && filteredCategories.length > 0
                      ? "Deselect All" 
                      : "Select All"}
                  </button>
                </div>
                
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search categories..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-9 text-xs bg-background/50"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-2 max-h-[300px] overflow-hidden pr-1 custom-scrollbar">
                {filteredCategories.map((category) => {
                  const isSelected = selectedCategories.includes(category.name)
                  return (
                    <button
                      key={category.id}
                      onClick={() => toggleCategory(category.name)}
                      className={cn(
                        "group relative flex flex-col items-start justify-center rounded-lg border px-3 py-2.5 text-left transition-all duration-200 h-full",
                        isSelected
                          ? "border-primary bg-primary/10 shadow-[0_0_10px_rgba(74,222,128,0.1)]"
                          : "border-input bg-background/50 hover:border-primary/50 hover:bg-accent"
                      )}
                    >
                      <div className="flex w-full items-center justify-between mb-1">
                        <span className={cn(
                          "text-xs font-semibold",
                          isSelected ? "text-primary" : "text-foreground"
                        )}>
                          {category.name}
                        </span>
                        {isSelected && (
                          <div className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_5px_rgba(74,222,128,0.5)]" />
                        )}
                      </div>
                      <span className="text-[10px] text-muted-foreground leading-tight line-clamp-2">
                        {category.description}
                      </span>
                    </button>
                  )
                })}
                {filteredCategories.length === 0 && (
                  <div className="col-span-2 py-4 text-center text-xs text-muted-foreground">
                    No categories found matching "{searchQuery}"
                  </div>
                )}
              </div>
            </div>

            {/* Risk Level */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Risk Level</label>
                <span className="text-sm font-medium text-primary">{getRiskLabel(riskLevel[0])}</span>
              </div>
              <Slider
                value={riskLevel}
                onValueChange={setRiskLevel}
                max={5}
                min={1}
                step={1}
                className="[&>.relative>.absolute]:bg-primary"
              />
              <div className="flex justify-between px-1 text-[10px] text-muted-foreground">
                <span>Low</span>
                <span>Avg</span>
                <span>Med</span>
                <span>High</span>
                <span>Degen</span>
              </div>
            </div>

            {/* Capital & Timeframe */}
            <div className="space-y-3">
              <label className="text-sm font-medium">Capital Committed</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-2.5 text-xs font-medium text-muted-foreground">USDC</span>
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="pl-12"
                  />
                </div>
                <Select value={timeframe} onValueChange={setTimeframe}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1m">1 Month</SelectItem>
                    <SelectItem value="3m">3 Months</SelectItem>
                    <SelectItem value="6m">6 Months</SelectItem>
                    <SelectItem value="1y">1 Year</SelectItem>
                    <SelectItem value="3y">3 Years</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button 
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_20px_rgba(74,222,128,0.2)]" 
              size="lg"
              onClick={handleGenerate}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing Opportunities...
                </>
              ) : (
                "Find Vaults"
              )}
            </Button>
            
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
               <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
               <span>Accuracy Mode Active</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Panel - Results */}
      <div className="flex-1 space-y-6">
        {!showResults && !isGenerating && (
          <div className="flex h-full min-h-[400px] flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border/50 bg-card/20 p-8 text-center text-muted-foreground">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/50">
              <Search className="h-8 w-8 opacity-50" />
            </div>
            <div className="max-w-xs">
              <h3 className="mb-1 text-lg font-medium text-foreground">No Strategy Generated</h3>
              <p className="text-sm">Configure your preferences on the left to generate personalized investment vaults.</p>
            </div>
          </div>
        )}

        {(isGenerating || isLoadingVaults) && (
          <div className="flex h-full min-h-[400px] flex-col items-center justify-center gap-4">
             <div className="relative flex h-24 w-24 items-center justify-center">
                <div className="absolute h-full w-full animate-ping rounded-full bg-primary/20 opacity-75"></div>
                <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                   <Loader2 className="h-8 w-8 animate-spin" />
                </div>
             </div>
             <p className="animate-pulse text-sm font-medium text-primary">
               {isLoadingVaults ? "Loading vaults from blockchain..." : "Scanning TradFi Markets..."}
             </p>
          </div>
        )}

        {(showResults || displayVaults.length > 0) && !isGenerating && !isLoadingVaults && (
          <div className="space-y-4">
            <div className="flex items-center justify-between animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-xl font-semibold">Recommended Vaults</h2>
              <div className="flex items-center gap-2">
                {blockchainVaults.length > 0 && (
                  <span className="text-xs text-primary bg-primary/10 px-2 py-1 rounded-full">
                    On-Chain
                  </span>
                )}
                <span className="text-sm text-muted-foreground">Found {displayVaults.length} matches</span>
              </div>
            </div>
            <div className="grid gap-4">
              {displayVaults.map((vault, index) => (
                <div 
                  key={vault.id} 
                  className="animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-both"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <VaultCard vault={vault} index={index} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
