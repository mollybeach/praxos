"use client";
import { type ReactNode, useState, useEffect } from "react";

import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";

import { wagmiConfig, raylsTestnet } from "@/lib/wagmi";

export interface Web3ProviderProps {
  children: ReactNode;
}

export function Web3Providers({ children }: Readonly<Web3ProviderProps>) {
  const [queryClient] = useState(() => new QueryClient());
  const [mounted, setMounted] = useState(false);

  const appInfo = { appName: "Praxos" };

  useEffect(() => setMounted(true), []);

  // Prevent hydration issues by only rendering once mounted
  if (!mounted) {
    return null;
  }

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider appInfo={appInfo} initialChain={raylsTestnet}>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

