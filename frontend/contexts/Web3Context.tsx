'use client';

import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';
import { useAccount, useDisconnect, useWalletClient } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';
import { ethers } from 'ethers';
import { getEthersProvider } from '@/lib/web3';

// Note: Window.ethereum is already declared in lib/web3.ts

interface Web3ContextType {
  provider: ethers.BrowserProvider | null;
  signer: ethers.JsonRpcSigner | null;
  address: string | null;
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
  loading: boolean;
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

export function Web3Provider({ children }: { children: React.ReactNode }) {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  
  // useAppKit must be called unconditionally (React hooks rule)
  // If AppKit isn't initialized, this will throw - but that's handled by the Providers component
  const { open: openModal } = useAppKit();
  
  const { disconnect: disconnectWallet } = useDisconnect();
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);

  // Handle unhandled promise rejections from wallet connections
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason;
      // Check if it's a wallet connection error
      if (error && typeof error === 'object' && 'code' in error) {
        const errorObj = error as { code?: number; message?: string };
        if (errorObj.code === 4001) {
          // User rejected or wallet has no accounts
          console.warn('Wallet connection error:', errorObj.message || 'Wallet must have at least one account');
          event.preventDefault(); // Prevent the error from showing in console
        }
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  const provider = useMemo(() => {
    if (walletClient) {
      return getEthersProvider(walletClient);
    }
    return null;
  }, [walletClient]);

  useEffect(() => {
    let cancelled = false;
    
    if (provider) {
      provider.getSigner()
        .then((s) => {
          if (!cancelled) {
            setSigner(s);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setSigner(null);
          }
        });
    } else {
      // Use setTimeout to avoid synchronous setState
      setTimeout(() => {
        if (!cancelled) {
          setSigner(null);
        }
      }, 0);
    }
    
    return () => {
      cancelled = true;
    };
  }, [provider]);

  const connect = () => {
    try {
      // Check if MetaMask is available and has accounts
      if (typeof window !== 'undefined' && window.ethereum) {
        const ethereum = window.ethereum as {
          request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
          isMetaMask?: boolean;
        };
        
        ethereum.request({ method: 'eth_accounts' })
          .then((accounts: unknown) => {
            const accountList = accounts as string[];
            if (accountList.length === 0) {
              // MetaMask is installed but no accounts are available
              alert('Please unlock MetaMask and ensure you have at least one account. Then try connecting again.');
              return;
            }
            // Accounts are available, open the modal
            openModal();
          })
          .catch((error: unknown) => {
            console.error('Error checking MetaMask accounts:', error);
            // Still try to open modal - might be a different wallet
            openModal();
          });
      } else {
        // No MetaMask detected, open modal to let user choose wallet
        openModal();
      }
    } catch (error) {
      console.error('Error opening wallet modal:', error);
      const errorObj = error as { code?: number; message?: string };
      
      // Handle specific MetaMask errors
      if (errorObj.code === 4001) {
        alert('Connection rejected or wallet has no accounts. Please unlock MetaMask and ensure you have at least one account.');
      } else {
        alert('Unable to open wallet connection. Please check the console for details.');
      }
    }
  };

  const disconnect = () => {
    try {
      disconnectWallet();
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
    }
  };

  return (
    <Web3Context.Provider
      value={{
        provider,
        signer,
        address: address || null,
        isConnected,
        connect,
        disconnect,
        loading: false,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
}

export function useWeb3() {
  const context = useContext(Web3Context);
  if (context === undefined) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
}
