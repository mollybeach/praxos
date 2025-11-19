'use client';

import { useWeb3 } from '@/contexts/Web3Context';

export function WalletButton() {
  const { address, isConnected, connect, disconnect, loading } = useWeb3();

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-4">
        <span className="text-sm font-mono bg-white/10 px-3 py-2 rounded-lg">
          {address.slice(0, 6)}...{address.slice(-4)}
        </span>
        <button
          onClick={disconnect}
          className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={connect}
      disabled={loading}
      className="px-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-lg font-semibold transition-colors"
    >
      {loading ? 'Connecting...' : 'Connect Wallet'}
    </button>
  );
}

