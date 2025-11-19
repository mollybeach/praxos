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
    } catch (err: unknown) {
      const error = err as { message?: string };
      setError(error.message || 'Deposit failed');
    } finally {
      setIsDepositing(false);
    }
  };

  const riskColors: Record<number, { bg: string; text: string; border: string }> = {
    1: { bg: 'bg-emerald-500/20', text: 'text-emerald-300', border: 'border-emerald-500/50' },
    2: { bg: 'bg-blue-500/20', text: 'text-blue-300', border: 'border-blue-500/50' },
    3: { bg: 'bg-yellow-500/20', text: 'text-yellow-300', border: 'border-yellow-500/50' },
    4: { bg: 'bg-orange-500/20', text: 'text-orange-300', border: 'border-orange-500/50' },
    5: { bg: 'bg-red-500/20', text: 'text-red-300', border: 'border-red-500/50' },
  };

  const riskStyle = riskColors[vault.riskTier] || { bg: 'bg-gray-500/20', text: 'text-gray-300', border: 'border-gray-500/50' };

  return (
    <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-lg rounded-2xl p-6 border border-purple-500/20 hover:border-purple-500/40 shadow-2xl hover:shadow-purple-500/10 transition-all duration-300">
      <div className="flex justify-between items-start mb-6">
        <div className="flex-1">
          <h3 className="text-2xl font-bold text-white mb-1">{vault.name}</h3>
          <p className="text-sm text-purple-300 font-mono">{vault.symbol}</p>
        </div>
        <span className={`px-4 py-1.5 rounded-full text-sm font-semibold border ${riskStyle.bg} ${riskStyle.text} ${riskStyle.border}`}>
          Risk {vault.riskTier}
        </span>
      </div>

      <div className="space-y-4 mb-6">
        <div className="bg-slate-900/50 rounded-lg p-3 border border-purple-500/10">
          <div className="flex justify-between items-center">
            <span className="text-purple-300 text-sm">Strategy</span>
            <span className="font-semibold text-white">{vault.strategy}</span>
          </div>
        </div>
        <div className="bg-slate-900/50 rounded-lg p-3 border border-purple-500/10">
          <div className="flex justify-between items-center">
            <span className="text-purple-300 text-sm">Total Assets</span>
            <span className="font-semibold text-white">
              {ethers.formatEther(vault.totalAssets)} USDr
            </span>
          </div>
        </div>
        <div className="bg-slate-900/50 rounded-lg p-3 border border-purple-500/10">
          <div className="flex justify-between items-center">
            <span className="text-purple-300 text-sm">Your Balance</span>
            <span className="font-semibold text-white">
              {ethers.formatEther(vault.userBalance)} {vault.symbol}
            </span>
          </div>
        </div>
        <div className="bg-slate-900/50 rounded-lg p-3 border border-purple-500/10">
          <div className="flex justify-between items-center">
            <span className="text-purple-300 text-sm">Assets</span>
            <span className="font-semibold text-white">{vault.assetCount}</span>
          </div>
        </div>
      </div>

      <div className="border-t border-purple-500/20 pt-4">
        <div className="flex gap-2 mb-3">
          <input
            type="number"
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
            placeholder="Amount to deposit"
            step="0.0001"
            min="0"
            className="flex-1 px-4 py-2.5 rounded-lg bg-slate-900/80 border border-purple-500/30 text-white placeholder-purple-400/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
            disabled={isDepositing || !isConnected}
          />
          <button
            onClick={handleDeposit}
            disabled={isDepositing || !isConnected}
            className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:from-gray-600 disabled:to-gray-600 text-white rounded-lg font-semibold transition-all shadow-lg hover:shadow-purple-500/50"
          >
            {isDepositing ? 'Depositing...' : 'Deposit'}
          </button>
        </div>
        {error && (
          <p className="text-red-400 text-sm mt-2 bg-red-500/10 border border-red-500/30 rounded-lg p-2">{error}</p>
        )}
        <a
          href={`https://devnet-explorer.rayls.com/address/${vault.address}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-purple-400 hover:text-purple-300 text-sm inline-flex items-center gap-1 mt-3 transition-colors"
        >
          <span>View on Explorer</span>
          <span>→</span>
        </a>
      </div>
    </div>
  );
}

