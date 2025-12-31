'use client';

import { useQuery } from '@tanstack/react-query';
import { useAccount } from 'wagmi';
import { KumaAccountBalance } from './useKumaAuth';
import { useEffect } from 'react';

interface UseKumaBalanceReturn {
  balance: KumaAccountBalance | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  isAssociated: boolean;
}

/**
 * Hook to fetch Kuma account balance
 *
 * This hook:
 * - Fetches account balance from Kuma API
 * - Auto-refreshes every 5 seconds when wallet is associated
 * - Only fetches when wallet is connected and associated
 */
export const useKumaBalance = (): UseKumaBalanceReturn => {
  const { address, isConnected } = useAccount();

  // Check if wallet is associated (stored in session storage after signature)
  const isAssociated = address
    ? sessionStorage.getItem(`kuma_associated_${address}`) === 'true'
    : false;

  useEffect(() => {
    console.log('[useKumaBalance] State:', {
      address,
      isConnected,
      isAssociated,
      sessionStorageKey: address ? `kuma_associated_${address}` : 'N/A',
      sessionStorageValue: address ? sessionStorage.getItem(`kuma_associated_${address}`) : 'N/A',
    });
  }, [address, isConnected, isAssociated]);

  const {
    data: balance,
    isLoading,
    error,
    refetch,
  } = useQuery<KumaAccountBalance | null, Error>({
    queryKey: ['kuma-balance', address],
    queryFn: async () => {
      if (!address || !isConnected || !isAssociated) {
        console.log('[useKumaBalance] Query skipped - not ready:', { address, isConnected, isAssociated });
        return null;
      }

      console.log('[useKumaBalance] Fetching balance from API...');
      const response = await fetch('/api/kuma/account-balance');

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[useKumaBalance] API error:', errorData);
        throw new Error(errorData.error || 'Failed to fetch balance');
      }

      const data = await response.json();
      console.log('[useKumaBalance] Balance data received:', data);

      // Map response to KumaAccountBalance interface
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
    enabled: isConnected && isAssociated && !!address,
    refetchInterval: 5000, // Refresh every 5 seconds
    staleTime: 3000, // Consider data stale after 3 seconds
    retry: 3,
    retryDelay: 1000,
  });

  return {
    balance: balance || null,
    isLoading,
    error: error || null,
    isAssociated,
    refetch: () => {
      refetch();
    },
  };
};
