import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import {
  argentWallet,
  coinbaseWallet,
  ledgerWallet,
  metaMaskWallet,
  rabbyWallet,
  rainbowWallet,
  safeWallet,
  walletConnectWallet,
} from "@rainbow-me/rainbowkit/wallets";
import type { Transport } from "viem";
import { defineChain } from "viem";
import { createConfig, http } from "wagmi";

const walletConnectProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

// Log warning if WalletConnect project ID is missing
if (!walletConnectProjectId && typeof window !== "undefined") {
  console.warn(
    "⚠️ NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is not set. Get one from https://cloud.walletconnect.com"
  );
}

// Use a valid-looking dummy project ID if none is provided
// WalletConnect expects a 32-character hex string
const projectId: string = walletConnectProjectId || "0".repeat(32);

// Define Rayls Testnet chain
export const raylsTestnet = defineChain({
  id: 123123,
  name: "Rayls Testnet",
  nativeCurrency: {
    name: "USDgas",
    symbol: "USDgas",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://devnet-rpc.rayls.com"],
    },
  },
  blockExplorers: {
    default: {
      name: "Rayls Explorer",
      url: "https://devnet-explorer.rayls.com",
    },
  },
  testnet: true,
});

const transports: Record<number, Transport> = {
  [raylsTestnet.id]: http("https://devnet-rpc.rayls.com"),
};

// Lazy initialization to prevent SSR issues with indexedDB
let wagmiConfigInstance: ReturnType<typeof createConfig> | null = null;
let wasCreatedOnServer = false;

function createWagmiConfig() {
  const isServer = typeof window === "undefined";

  // Only create connectors on the client side to avoid indexedDB issues during SSR
  if (isServer) {
    // Return a minimal config for SSR (without connectors that use indexedDB)
    const config = createConfig({
      chains: [raylsTestnet],
      connectors: [], // Empty connectors for SSR
      transports,
      ssr: true,
    });
    wasCreatedOnServer = true;
    return config;
  }

  // On client side, always create full config with connectors
  // (even if one was created during SSR, we need a fresh one with connectors)
  
  // Only include WalletConnect if we have a valid project ID
  const hasValidProjectId = walletConnectProjectId && walletConnectProjectId.length > 0;
  const walletList = [
    metaMaskWallet,
    rainbowWallet,
    ...(hasValidProjectId ? [walletConnectWallet] : []),
    ledgerWallet,
    rabbyWallet,
    coinbaseWallet,
    argentWallet,
    safeWallet,
  ];
  
  const connectors = connectorsForWallets(
    [
      {
        groupName: "Recommended",
        wallets: walletList,
      },
    ],
    { appName: "Praxos", projectId },
  );

  return createConfig({
    chains: [raylsTestnet],
    connectors,
    transports,
    ssr: true,
  });
}

// Use a getter to ensure config is created lazily and correctly for each environment
export const wagmiConfig = new Proxy({} as ReturnType<typeof createConfig>, {
  get(_target, prop) {
    // If no config exists, or if it was created on server and we're now on client, create it
    const isClient = typeof window !== "undefined";
    if (!wagmiConfigInstance || (wasCreatedOnServer && isClient)) {
      wagmiConfigInstance = createWagmiConfig();
      wasCreatedOnServer = false;
    }
    return wagmiConfigInstance[prop as keyof typeof wagmiConfigInstance];
  },
});

