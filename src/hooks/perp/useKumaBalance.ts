'use client';

import { useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAccount } from 'wagmi';
import { KatanaPerpsAccountBalance } from './useKumaAuth';
import { usePerpBalanceStore } from '@/store/perpBalanceStore';
import { hasValidSessionKey } from '@/utils/perp/sessionKeyStorage';

interface UseKatanaPerpsBalanceReturn {
  balance: KatanaPerpsAccountBalance | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  isAssociated: boolean;
}

/**
 * Hook to fetch Katana Perps account balance
 *
 * This hook:
 * - Fetches account balance from Katana Perps API
 * - Auto-refreshes every 5 seconds when wallet is connected
 * - Only requires wallet to be connected (no association/signature needed)
 * - Uses global store for isAssociated to share state across components
 */
export const useKatanaPerpsBalance = (): UseKatanaPerpsBalanceReturn => {
  const { address, isConnected } = useAccount();

  // Use global store for isAssociated to share state across all components
  const isAssociated = usePerpBalanceStore((state) => state.isAssociated);
  const setIsAssociated = usePerpBalanceStore((state) => state.setIsAssociated);

  // Check sessionStorage after mount and sync to global store
  useEffect(() => {
    if (!address) {
      setIsAssociated(false);
      return;
    }

    // Check both old and new session storage keys for backwards compatibility
    const katanaKey = `katana_perps_associated_${address}`;
    const kumaKey = `kuma_associated_${address}`;
    const katanaValue = sessionStorage.getItem(katanaKey);
    const kumaValue = sessionStorage.getItem(kumaKey);

    const hasLocalStorageKey = hasValidSessionKey(address);
    const associated = katanaValue === 'true' || kumaValue === 'true' || hasLocalStorageKey;
    setIsAssociated(associated);

    // Set up storage event listener to detect changes from other tabs/windows
    const handleStorageChange = () => {
      const newAssociated =
        sessionStorage.getItem(`katana_perps_associated_${address}`) === 'true' ||
        sessionStorage.getItem(`kuma_associated_${address}`) === 'true';
      setIsAssociated(newAssociated);
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [address, setIsAssociated]);

  // Always fetch balance when wallet is connected (no association required)
  const queryEnabled = isConnected && !!address;

  const {
    data: balance,
    isLoading,
    error,
    refetch,
  } = useQuery<KatanaPerpsAccountBalance | null, Error>({
    queryKey: ['katana-perps-balance', address],
    queryFn: async () => {
      if (!address || !isConnected) {
        return null;
      }
      const response = await fetch(`/api/kuma/account-balance?wallet=${address}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch balance');
      }

      const data = await response.json();

      // Map response to KatanaPerpsAccountBalance interface
      return {
        equity: data.equity || '0',
        freeCollateral: data.freeCollateral || '0',
        heldCollateral: data.heldCollateral || '0',
        availableCollateral: data.availableCollateral || '0',
        buyingPower: data.buyingPower || '0',
        leverage: data.leverage || '0',
        marginRatio: data.marginRatio || '0',
        quoteBalance: data.quoteBalance || '0',
        unrealizedPnL: data.unrealizedPnL || '0',
        makerFeeRate: data.makerFeeRate || '0',
        takerFeeRate: data.takerFeeRate || '0',
        positions: data.positions || [],
      };
    },
    enabled: queryEnabled,
    refetchInterval: 5000, // Refresh every 5 seconds
    staleTime: 3000, // Consider data stale after 3 seconds
    retry: 3,
    retryDelay: 1000,
  });

  const handleRefetch = useCallback(() => {
    refetch();
  }, [refetch]);

  return {
    balance: balance || null,
    isLoading,
    error: error || null,
    isAssociated,
    refetch: handleRefetch,
  };
};

// Keep the old name as an alias for backwards compatibility
export const useKumaBalance = useKatanaPerpsBalance;
