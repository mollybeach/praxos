'use client';

import { useAccount } from 'wagmi';
import { useVaults } from '@/lib/hooks/use-vaults';
import { VaultCard } from '@/components/dashboard/vault-card';
import { vaultInfoToVault } from '@/lib/vault-utils';
import { formatUnits } from 'viem';

export function PortfolioPage() {
  const { address, isConnected } = useAccount();
  const { vaults, isLoading } = useVaults();
  // Convert vaults to UI format
  const displayVaults = vaults.map((v, i) => vaultInfoToVault(v, i));
  
  // Calculate total value (simplified - would need user balances from hooks)
  const totalValue = vaults.reduce((sum, vault) => sum + vault.totalAssets, BigInt(0));

  if (!isConnected) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-12 text-center">
          <p className="text-slate-400 mb-4">Connect your wallet to view your portfolio</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mb-4"></div>
          <p className="text-slate-400">Loading portfolio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Portfolio Summary */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
        <h2 className="text-2xl font-bold text-white mb-4">Portfolio Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
            <p className="text-sm text-slate-400 mb-1">Total Value</p>
            <p className="text-2xl font-bold text-white">
              {formatUnits(totalValue, 6)} USDC
            </p>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
            <p className="text-sm text-slate-400 mb-1">Active Vaults</p>
            <p className="text-2xl font-bold text-white">{displayVaults.length}</p>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
            <p className="text-sm text-slate-400 mb-1">Wallet Address</p>
            <p className="text-sm font-mono text-white">{address?.slice(0, 6)}...{address?.slice(-4)}</p>
          </div>
        </div>
      </div>

      {/* Vault Holdings */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-4">Your Vault Holdings</h2>
        {displayVaults.length === 0 ? (
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-12 text-center">
            <p className="text-slate-400">You don't have any vault positions yet.</p>
            <p className="text-sm text-slate-500 mt-2">Start investing in recommended vaults to build your portfolio.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayVaults.map((vault, index) => (
              <VaultCard key={vault.id} vault={vault} index={index} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

