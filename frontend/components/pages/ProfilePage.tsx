'use client';

import { useAccount } from 'wagmi';

export function ProfilePage() {
  const { address, isConnected } = useAccount();

  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-12 text-center">
        <div className="mb-4">
          <svg className="w-16 h-16 text-slate-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Profile Coming Soon</h2>
        <p className="text-slate-400 mb-4">Manage your account settings and preferences.</p>
        {isConnected && address && (
          <div className="mt-6 p-4 bg-slate-800 rounded-lg inline-block">
            <p className="text-sm text-slate-400 mb-1">Connected Wallet</p>
            <p className="text-sm font-mono text-white">{address}</p>
          </div>
        )}
      </div>
    </div>
  );
}

