'use client';

import { useEffect, useState } from 'react';
import { useWeb3 } from '@/contexts/Web3Context';
import { loadVaults, getReadOnlyProvider } from '@/lib/web3';
import { VaultCard } from './VaultCard';
import type { VaultInfo } from '@/types';

interface VaultListProps {
  factoryAddress: string;
}

export function VaultList({ factoryAddress }: VaultListProps) {
  const { provider, address, isConnected } = useWeb3();
  const [vaults, setVaults] = useState<VaultInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchVaults = async () => {
    if (!factoryAddress) return;

    try {
      setLoading(true);
      setError(null);
      
      // Use connected provider if available, otherwise use read-only provider
      const activeProvider = provider || getReadOnlyProvider();
      const loadedVaults = await loadVaults(activeProvider, factoryAddress, address || undefined);
      setVaults(loadedVaults);
    } catch (err: any) {
      console.error('Error loading vaults:', err);
      setError(err.message || 'Failed to load vaults');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (factoryAddress) {
      fetchVaults();
    }
  }, [provider, factoryAddress, address]);

  if (!factoryAddress) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8 text-center">
        <p className="text-gray-600">Factory not deployed. Please deploy contracts first.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8 text-center">
        <p className="text-gray-600">Loading vaults...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8 text-center">
        <p className="text-red-500 mb-4">{error}</p>
        <button
          onClick={fetchVaults}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
        >
          Retry
        </button>
      </div>
    );
  }

  if (vaults.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8 text-center">
        <p className="text-gray-600">No vaults available yet. Deploy some vaults first!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {vaults.map((vault) => (
        <VaultCard key={vault.address} vault={vault} onDepositSuccess={fetchVaults} />
      ))}
    </div>
  );
}

