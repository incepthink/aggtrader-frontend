// ============================================================================
// FILE: lib/hooks/useBalancesWithQuery.ts
// ============================================================================
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { useWeb3 } from '../contexts/useWeb3';
import type { TAddress } from '../types/address';
import { toAddress } from '../utils/tools.address';
import type { TChainTokens, TDict, TToken } from '../types/mixed';
import { isZeroAddress } from '../utils/tools.address';
import type { TUseBalancesTokens } from './useBalances.multichains';
import { fetchTokenBalancesWithRateLimit, useBalancesQueries } from './useBalancesQueries';
import { balanceQueryKeys } from './useBalancesQuery';

export function useBalancesWithQuery(props?: {
  tokens?: TUseBalancesTokens[];
  priorityChainID?: number;
}): {
  data: TChainTokens;
  onUpdate: (shouldForceFetch?: boolean) => Promise<TChainTokens>;
  onUpdateSome: (tokenList: TUseBalancesTokens[]) => Promise<TChainTokens>;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
} {
  const { address: userAddress } = useWeb3();
  const queryClient = useQueryClient();

  const tokens = useMemo(() => props?.tokens || [], [props?.tokens]);

  // Convert userAddress to TAddress type
  const typedUserAddress = useMemo(() => {
    return userAddress ? toAddress(userAddress) : undefined;
  }, [userAddress]);

  const {
    data: balances,
    isLoading,
    isError,
    isSuccess,
    refetch
  } = useBalancesQueries(typedUserAddress, tokens, {
    priorityChainId: props?.priorityChainID,
    enabled: tokens.length > 0
  });

  const onUpdate = useCallback(
    async (shouldForceFetch?: boolean): Promise<TChainTokens> => {
      if (shouldForceFetch) {
        refetch();
      }
      return balances;
    },
    [balances, refetch]
  );

  const onUpdateSome = useCallback(
    async (tokenList: TUseBalancesTokens[]): Promise<TChainTokens> => {
      const validTokens = tokenList.filter(({ address }) => !isZeroAddress(address));
      if (validTokens.length === 0) return {};

      const tokensByChain: Record<number, TUseBalancesTokens[]> = {};
      for (const token of validTokens) {
        if (!tokensByChain[token.chainID]) {
          tokensByChain[token.chainID] = [];
        }
        tokensByChain[token.chainID].push(token);
      }

      const updatedBalances: TChainTokens = {};

      for (const [chainIdStr, chainTokens] of Object.entries(tokensByChain)) {
        const chainId = Number(chainIdStr);

        const freshBalances = await fetchTokenBalancesWithRateLimit(
          chainId, 
          typedUserAddress, 
          chainTokens, 
          true
        );

        const allQueries = queryClient.getQueriesData<TDict<TToken>>({
          queryKey: balanceQueryKeys.byChainAndUser(chainId, typedUserAddress),
          exact: false
        });

        allQueries.forEach(([queryKey, queryData]) => {
          if (queryData) {
            const updated = { ...queryData, ...freshBalances };
            queryClient.setQueryData(queryKey, updated);
          }
        });

        updatedBalances[chainId] = freshBalances;
      }

      return updatedBalances;
    },
    [queryClient, typedUserAddress]
  );

  return {
    data: balances,
    onUpdate,
    onUpdateSome,
    isLoading,
    isSuccess,
    isError
  };
}