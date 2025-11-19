'use client';

import { useState } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '@/contexts/Web3Context';
import { depositToVault } from '@/lib/web3';
import type { VaultInfo } from '@/types';

interface VaultCardProps {
  vault: VaultInfo;
  onDepositSuccess?: () => void;
}

export function VaultCard({ vault, onDepositSuccess }: VaultCardProps) {
  const { signer, isConnected } = useWeb3();
  const [depositAmount, setDepositAmount] = useState('');
  const [isDepositing, setIsDepositing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const riskColors: Record<number, string> = {
    1: 'bg-green-100 text-green-800',
    2: 'bg-blue-100 text-blue-800',
    3: 'bg-yellow-100 text-yellow-800',
    4: 'bg-orange-100 text-orange-800',
    5: 'bg-red-100 text-red-800',
  };

  const handleDeposit = async () => {
    if (!signer || !isConnected) {
      setError('Please connect your wallet first');
      return;
    }

    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    try {
      setIsDepositing(true);
      setError(null);
      const tx = await depositToVault(signer, vault.address, depositAmount);
      await tx.wait();
      setDepositAmount('');
      onDepositSuccess?.();
    } catch (err: any) {
      setError(err.message || 'Deposit failed');
    } finally {
      setIsDepositing(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">{vault.name}</h3>
          <p className="text-sm text-gray-500 mt-1">{vault.symbol}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${riskColors[vault.riskTier] || 'bg-gray-100 text-gray-800'}`}>
          Risk {vault.riskTier}
        </span>
      </div>

      <div className="space-y-3 mb-6">
        <div className="flex justify-between">
          <span className="text-gray-600">Strategy:</span>
          <span className="font-semibold">{vault.strategy}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Total Assets:</span>
          <span className="font-semibold">
            {ethers.formatEther(vault.totalAssets)} USDr
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Your Balance:</span>
          <span className="font-semibold">
            {ethers.formatEther(vault.userBalance)} {vault.symbol}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Assets:</span>
          <span className="font-semibold">{vault.assetCount}</span>
        </div>
      </div>

      <div className="border-t pt-4">
        <div className="flex gap-2 mb-3">
          <input
            type="number"
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
            placeholder="Amount to deposit"
            step="0.0001"
            min="0"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isDepositing || !isConnected}
          />
          <button
            onClick={handleDeposit}
            disabled={isDepositing || !isConnected}
            className="px-6 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-lg font-semibold transition-colors"
          >
            {isDepositing ? 'Depositing...' : 'Deposit'}
          </button>
        </div>
        {error && (
          <p className="text-red-500 text-sm mt-2">{error}</p>
        )}
        <a
          href={`https://devnet-explorer.rayls.com/address/${vault.address}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:text-blue-600 text-sm inline-block mt-2"
        >
          View on Explorer →
        </a>
      </div>
    </div>
  );
}

