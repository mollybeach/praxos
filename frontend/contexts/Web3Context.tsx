'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { connectWallet } from '@/lib/web3';

interface Web3ContextType {
  provider: ethers.BrowserProvider | null;
  signer: ethers.JsonRpcSigner | null;
  address: string | null;
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  loading: boolean;
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

export function Web3Provider({ children }: { children: React.ReactNode }) {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const connect = useCallback(async () => {
    try {
      setLoading(true);
      const newProvider = await connectWallet();
      const newSigner = await newProvider.getSigner();
      const newAddress = await newSigner.getAddress();
      
      setProvider(newProvider);
      setSigner(newSigner);
      setAddress(newAddress);
    } catch (error) {
      console.error('Error connecting wallet:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setProvider(null);
    setSigner(null);
    setAddress(null);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.ethereum) return;

    const handleAccountsChanged = () => {
      if (provider) {
        connect();
      }
    };

    const handleChainChanged = () => {
      window.location.reload();
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum?.removeListener('chainChanged', handleChainChanged);
    };
  }, [provider, connect]);

  return (
    <Web3Context.Provider
      value={{
        provider,
        signer,
        address,
        isConnected: !!address,
        connect,
        disconnect,
        loading,
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

