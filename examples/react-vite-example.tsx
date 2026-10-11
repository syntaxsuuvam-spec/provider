import React, { useState, useEffect, useCallback } from 'react';
import { isConnected, getPublicKey, getNetwork, signTransaction } from '@sorocrew/provider';

interface SoroCrewWalletState {
  connected: boolean;
  publicKey: string | null;
  network: string | null;
  loading: boolean;
  error: string | null;
}

/**
 * Custom React Hook for connecting to SoroCrew Studio's injected provider.
 * Features automated event listener registration and memory-safe unmount cleanup.
 */
export function useSoroCrew() {
  const [state, setState] = useState<SoroCrewWalletState>({
    connected: false,
    publicKey: null,
    network: null,
    loading: true,
    error: null,
  });

  const refreshState = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const connected = await isConnected();
      if (!connected) {
        setState({
          connected: false,
          publicKey: null,
          network: null,
          loading: false,
          error: null,
        });
        return;
      }

      const [pubKey, net] = await Promise.all([
        getPublicKey(),
        getNetwork(),
      ]);

      setState({
        connected: true,
        publicKey: pubKey,
        network: net,
        loading: false,
        error: null,
      });
    } catch (err: any) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: err?.message || 'Failed to connect to SoroCrew Provider',
      }));
    }
  }, []);

  const connect = useCallback(async () => {
    await refreshState();
  }, [refreshState]);

  useEffect(() => {
    refreshState();

    // Event listener for dynamic network switches from SoroCrew Studio header
    const handleNetworkChange = (details: { networkUrl: string; networkPassphrase?: string }) => {
      console.log('[SoroCrew] Network switch detected:', details);
      setState((prev) => ({ ...prev, network: details.networkUrl }));
    };

    const handleAccountChange = (details: { publicKey: string }) => {
      console.log('[SoroCrew] Account switch detected:', details);
      setState((prev) => ({ ...prev, publicKey: details.publicKey }));
    };

    if (typeof window !== 'undefined' && (window as any).sorocrew) {
      (window as any).sorocrew.on('networkChange', handleNetworkChange);
      (window as any).sorocrew.on('accountChange', handleAccountChange);
    }

    // Teardown event listeners on unmount
    return () => {
      if (typeof window !== 'undefined' && (window as any).sorocrew?.off) {
        (window as any).sorocrew.off('networkChange', handleNetworkChange);
        (window as any).sorocrew.off('accountChange', handleAccountChange);
      }
    };
  }, [refreshState]);

  return {
    ...state,
    connect,
    refreshState,
    signTransaction,
  };
}

/**
 * Example UI component demonstrating React + Vite integration.
 */
export const SoroCrewWalletButton: React.FC = () => {
  const { connected, publicKey, network, loading, error, connect } = useSoroCrew();

  if (loading) {
    return <button disabled className="px-4 py-2 bg-gray-200 text-gray-700 rounded font-mono text-sm">Connecting...</button>;
  }

  if (error) {
    return <div className="text-red-600 font-mono text-xs">Error: {error}</div>;
  }

  if (!connected) {
    return (
      <button
        onClick={connect}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded font-mono text-sm shadow-md transition-colors"
      >
        Connect SoroCrew Mock Wallet
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3 p-3 bg-white border border-gray-300 rounded-lg shadow-sm font-mono text-xs">
      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
      <div>
        <div className="font-bold text-gray-900">
          {publicKey?.slice(0, 6)}...{publicKey?.slice(-4)}
        </div>
        <div className="text-gray-500 text-[10px]">
          Network: {network || 'Testnet'}
        </div>
      </div>
    </div>
  );
};
