'use client';

import { useState } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '@/contexts/Web3Context';
import { depositToVault } from '@/lib/web3';
import type { Vault } from '@/types';

interface RecommendedVaultCardProps {
  vault: Vault;
  onDepositSuccess?: () => void;
}

export function RecommendedVaultCard({ vault, onDepositSuccess }: RecommendedVaultCardProps) {
  const { signer, isConnected } = useWeb3();
  const [isDepositing, setIsDepositing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInvest = async () => {
    if (!signer || !isConnected || !vault.address) {
      setError('Please connect your wallet first');
      return;
    }

    try {
      setIsDepositing(true);
      setError(null);
      // For now, use a default amount - you can add an input later
      const tx = await depositToVault(signer, vault.address, '100');
      await tx.wait();
      onDepositSuccess?.();
    } catch (err: unknown) {
      const error = err as { message?: string };
      setError(error.message || 'Deposit failed');
    } finally {
      setIsDepositing(false);
    }
  };

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 hover:border-green-500/30 transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-bold text-white">{vault.name}</h3>
            {vault.isNew && (
              <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded border border-green-500/30">
                New
              </span>
            )}
          </div>
          <p className="text-sm text-slate-400 mb-4">{vault.description}</p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-green-400 font-semibold">{vault.matchPercentage}% Match</span>
        </div>
        <div className="text-green-400 text-2xl font-bold">{vault.apr}% APR</div>
      </div>

      <div className="mb-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs text-slate-400">Underlying Assets</span>
          <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Building icons for bonds/REITs */}
          {vault.assets.filter(a => a.type === 'bond' || a.type === 'reit').map((asset, index) => (
            <div key={`building-${index}`} className="w-6 h-6" title={asset.name}>
              <svg className="w-full h-full text-slate-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 21h18v-2H3v2zm0-4h18v-2H3v2zm0-4h18v-2H3v2zm0-4h18V7H3v2zm0-4h18V3H3v2z" />
              </svg>
            </div>
          ))}
          {/* Gear icons for tech/funds */}
          {vault.assets.filter(a => a.type === 'fund').map((asset, index) => (
            <div key={`gear-${index}`} className="w-6 h-6" title={asset.name}>
              <svg className="w-full h-full text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          ))}
          {/* Asset badges */}
          {vault.assets.slice(0, 3).map((asset, index) => {
            const colors = ['bg-red-500/20 text-red-400', 'bg-blue-500/20 text-blue-400', 'bg-purple-500/20 text-purple-400'];
            return (
              <div
                key={index}
                className={`w-8 h-8 rounded-full flex items-center justify-center border ${colors[index % colors.length]} border-opacity-30`}
                title={`${asset.name} - ${asset.provider}`}
              >
                <span className="text-xs font-semibold">
                  {asset.name.substring(0, 2).toUpperCase()}
                </span>
              </div>
            );
          })}
          {vault.assets.length > 3 && (
            <div className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center border border-slate-700">
              <span className="text-xs text-slate-400">+{vault.assets.length - 3}</span>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-500/10 border border-red-500/30 rounded-lg p-2">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      <button
        onClick={handleInvest}
        disabled={isDepositing || !isConnected || !vault.address}
        className="w-full py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-600 disabled:to-gray-600 text-white font-semibold rounded-lg transition-all shadow-lg hover:shadow-green-500/50 flex items-center justify-center gap-2"
      >
        {isDepositing ? 'Processing...' : 'Invest Now'}
        <span>→</span>
      </button>
    </div>
  );
}

