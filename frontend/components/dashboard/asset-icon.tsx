import { Building2, Landmark, Banknote, TrendingUp, Globe2, Briefcase, Leaf } from 'lucide-react'
import { cn } from "@/lib/utils"

export type AssetType = "bond" | "etf" | "reit" | "stock" | "fund" | "commodity" | "crypto"

interface AssetIconProps {
  type: AssetType
  provider: string
  size?: "sm" | "md" | "lg"
  className?: string
}

const typeIcons = {
  bond: Landmark,
  etf: TrendingUp,
  reit: Building2,
  stock: Briefcase,
  fund: Globe2,
  commodity: Leaf,
  crypto: Banknote,
}

const providerColors: Record<string, string> = {
  "BlackRock": "bg-black text-white",
  "Vanguard": "bg-red-700 text-white",
  "Fidelity": "bg-green-700 text-white",
  "J.P. Morgan": "bg-blue-800 text-white",
  "Goldman Sachs": "bg-blue-400 text-white",
  "Invesco": "bg-blue-600 text-white",
  "State Street": "bg-blue-500 text-white",
}

export function AssetIcon({ type, provider, size = "md", className }: AssetIconProps) {
  const Icon = typeIcons[type] || Banknote
  const providerColor = providerColors[provider] || "bg-gray-500 text-white"
  const initials = provider.substring(0, 2).toUpperCase()

  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-10 w-10",
    lg: "h-12 w-12",
  }

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  }

  const badgeSizes = {
    sm: "h-3 w-3 text-[6px]",
    md: "h-4 w-4 text-[8px]",
    lg: "h-5 w-5 text-[10px]",
  }

  return (
    <div className={cn("relative flex items-center justify-center rounded-full bg-muted border border-border shadow-sm", sizeClasses[size], className)}>
      <Icon className={cn("text-muted-foreground", iconSizes[size])} />
      <div className={cn("absolute -bottom-1 -right-1 flex items-center justify-center rounded-full border border-background font-bold", providerColor, badgeSizes[size])}>
        {initials}
      </div>
    </div>
  )
}
