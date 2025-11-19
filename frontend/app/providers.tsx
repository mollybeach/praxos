'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createAppKit } from '@reown/appkit/react';
import { WagmiProvider, type Config } from 'wagmi';
import { cookieStorage, createStorage } from '@wagmi/core';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { RAYLS_DEVNET, WALLETCONNECT_PROJECT_ID } from '@/lib/config';
import { Web3Provider } from '@/contexts/Web3Context';
import { useState } from 'react';

// Create custom chain for Rayls Devnet
const raylsDevnet = {
  id: parseInt(RAYLS_DEVNET.chainId, 16),
  name: RAYLS_DEVNET.chainName,
  nativeCurrency: RAYLS_DEVNET.nativeCurrency,
  rpcUrls: {
    default: {
      http: RAYLS_DEVNET.rpcUrls,
    },
  },
  blockExplorers: {
    default: {
      name: 'Rayls Explorer',
      url: RAYLS_DEVNET.blockExplorerUrls[0],
    },
  },
} as const;

// Set up metadata
const getOrigin = () => {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  return process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
};

const metadata = {
  name: 'Praxos',
  description: 'AI-Generated ERC-4626 Vaults for Real-World Assets',
  url: getOrigin(),
  icons: [],
};

// Initialize WagmiAdapter and AppKit
let wagmiAdapter: WagmiAdapter | null = null;
let wagmiConfig: Config | null = null;
let initializationError: Error | null = null;

// Always try to initialize - even with placeholder if project ID is missing
// This ensures useAppKit hook doesn't throw
try {
  if (!WALLETCONNECT_PROJECT_ID) {
    console.warn('NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is not set. Wallet connection will not work. Get a project ID from https://cloud.walletconnect.com');
    // Create a minimal adapter with placeholder to prevent useAppKit from throwing
    wagmiAdapter = new WagmiAdapter({
      storage: createStorage({
        storage: cookieStorage,
      }),
      ssr: true,
      projectId: '00000000000000000000000000000000', // Placeholder
      networks: [raylsDevnet],
    });
    wagmiConfig = wagmiAdapter.wagmiConfig;
    
    createAppKit({
      adapters: [wagmiAdapter],
      projectId: '00000000000000000000000000000000',
      networks: [raylsDevnet],
      defaultNetwork: raylsDevnet,
      metadata,
      features: {
        analytics: false,
      },
      themeMode: 'dark',
      themeVariables: {
        '--w3m-accent': '#9333ea',
      },
    });
  } else {
    wagmiAdapter = new WagmiAdapter({
      storage: createStorage({
        storage: cookieStorage,
      }),
      ssr: true,
      projectId: WALLETCONNECT_PROJECT_ID,
      networks: [raylsDevnet],
    });

    // Get the wagmi config from the adapter
    wagmiConfig = wagmiAdapter.wagmiConfig;

    // Initialize AppKit with the adapter
    createAppKit({
      adapters: [wagmiAdapter],
      projectId: WALLETCONNECT_PROJECT_ID,
      networks: [raylsDevnet],
      defaultNetwork: raylsDevnet,
      metadata,
      features: {
        analytics: false,
      },
      themeMode: 'dark',
      themeVariables: {
        '--w3m-accent': '#9333ea',
      },
    });
  }
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;
  console.error('Failed to initialize WalletConnect:', {
    message: errorMessage,
    stack: errorStack,
    error,
  });
  initializationError = error instanceof Error ? error : new Error(String(error));
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        refetchOnWindowFocus: false,
      },
    },
  }));

  // If wagmiConfig is not available due to initialization error, show error message
  if (!wagmiConfig && initializationError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white p-4">
        <div className="text-center max-w-2xl">
          <h1 className="text-2xl font-bold mb-4">WalletConnect Configuration Error</h1>
          <p className="text-red-400 mb-2">
            Failed to initialize WalletConnect
          </p>
          {initializationError && (
            <p className="text-sm text-red-300 mb-4 font-mono">
              {initializationError.message}
            </p>
          )}
          <p className="text-xs text-purple-500 mt-4">
            Check the browser console for more details
          </p>
        </div>
      </div>
    );
  }

  // If no project ID, show warning but still render (AppKit initialized with placeholder)
  if (!WALLETCONNECT_PROJECT_ID && wagmiConfig) {
    console.warn('⚠️ WalletConnect is using a placeholder project ID. Set NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID for full functionality.');
  }

  // At this point, wagmiConfig should always be set (either from successful init or placeholder)
  if (!wagmiConfig) {
    // Fallback - should never reach here, but TypeScript needs this
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="text-center">
          <p className="text-red-400">Critical error: Wagmi config not available</p>
        </div>
      </div>
    );
  }

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <Web3Provider>
          {children}
        </Web3Provider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
