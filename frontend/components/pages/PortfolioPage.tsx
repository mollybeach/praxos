'use client';

import { useState, useEffect } from 'react';
import { useWeb3 } from '@/contexts/Web3Context';
import { loadVaults, getReadOnlyProvider } from '@/lib/web3';
import { DEFAULT_FACTORY_ADDRESS } from '@/lib/config';
import { VaultCard } from '@/components/VaultCard';
import type { VaultInfo } from '@/types';
import { ethers } from 'ethers';

export function PortfolioPage() {
  const { provider, address, isConnected } = useWeb3();
  const [vaults, setVaults] = useState<VaultInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalValue, setTotalValue] = useState<bigint>(BigInt(0));

  useEffect(() => {
    const fetchPortfolio = async () => {
      if (!DEFAULT_FACTORY_ADDRESS) return;

      try {
        setLoading(true);
        const activeProvider = provider || getReadOnlyProvider();
        const loadedVaults = await loadVaults(activeProvider, DEFAULT_FACTORY_ADDRESS, address || undefined);
        setVaults(loadedVaults);

        // Calculate total value
        const total = loadedVaults.reduce((sum, vault) => sum + vault.userBalance, BigInt(0));
        setTotalValue(total);
      } catch (error) {
        console.error('Error loading portfolio:', error);
      } finally {
        setLoading(false);
      }
    };

    if (isConnected || address) {
      fetchPortfolio();
    }
  }, [provider, address, isConnected]);

  if (!isConnected) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-12 text-center">
          <p className="text-slate-400 mb-4">Connect your wallet to view your portfolio</p>
        </div>
      </div>
    );
  }

  if (loading) {
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
              {ethers.formatEther(totalValue)} USDr
            </p>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
            <p className="text-sm text-slate-400 mb-1">Active Vaults</p>
            <p className="text-2xl font-bold text-white">{vaults.length}</p>
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
        {vaults.length === 0 ? (
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-12 text-center">
            <p className="text-slate-400">You don't have any vault positions yet.</p>
            <p className="text-sm text-slate-500 mt-2">Start investing in recommended vaults to build your portfolio.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vaults
              .filter(vault => vault.userBalance > BigInt(0))
              .map((vault) => (
                <VaultCard key={vault.address} vault={vault} />
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

