'use client';

import { useAccount, useDisconnect } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';

export function WalletPage() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();

  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-12 text-center">
        <div className="mb-4">
          <svg className="w-16 h-16 text-slate-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Wallet Coming Soon</h2>
        <p className="text-slate-400 mb-6">Advanced wallet management features will be available here.</p>
        
        <div className="mt-8 space-y-4">
          <div className="p-4 bg-slate-800 rounded-lg">
            <p className="text-sm text-slate-400 mb-2">Connection Status</p>
            <p className={`text-sm font-semibold ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
              {isConnected ? 'Connected' : 'Not Connected'}
            </p>
          </div>
          
          {isConnected && address && (
            <div className="p-4 bg-slate-800 rounded-lg">
              <p className="text-sm text-slate-400 mb-2">Wallet Address</p>
              <p className="text-sm font-mono text-white break-all">{address}</p>
            </div>
          )}
          
          <div className="pt-4">
            <ConnectButton />
          </div>
        </div>
      </div>
    </div>
  );
}

