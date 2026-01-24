'use client';

import { useQuery } from '@tanstack/react-query';
import { useAccount } from 'wagmi';
import { KatanaPerpsAccountBalance } from './useKumaAuth';

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
 * - Auto-refreshes every 5 seconds when wallet is associated
 * - Only fetches when wallet is connected and associated
 */
export const useKatanaPerpsBalance = (): UseKatanaPerpsBalanceReturn => {
  const { address, isConnected } = useAccount();

  // Check if wallet is associated (stored in session storage after signature)
  // Check both old and new session storage keys for backwards compatibility
  const isAssociated = address
    ? sessionStorage.getItem(`katana_perps_associated_${address}`) === 'true' ||
      sessionStorage.getItem(`kuma_associated_${address}`) === 'true'
    : false;


  const {
    data: balance,
    isLoading,
    error,
    refetch,
  } = useQuery<KatanaPerpsAccountBalance | null, Error>({
    queryKey: ['katana-perps-balance', address],
    queryFn: async () => {
      if (!address || !isConnected || !isAssociated) {
        return null;
      }
      const response = await fetch('/api/kuma/account-balance');

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[useKatanaPerpsBalance] API error:', errorData);
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

// Keep the old name as an alias for backwards compatibility
export const useKumaBalance = useKatanaPerpsBalance;
