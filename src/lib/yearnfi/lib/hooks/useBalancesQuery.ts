import type { TAddress } from '../types/address';

export const balanceQueryKeys = {
  all: ['balances'] as const,
  byChain: (chainId: number) => [...balanceQueryKeys.all, chainId] as const,
  byChainAndUser: (chainId: number, userAddress: TAddress | undefined) =>
    [...balanceQueryKeys.byChain(chainId), userAddress] as const,
  byTokens: (chainId: number, userAddress: TAddress | undefined, tokenAddresses: TAddress[]) =>
    [...balanceQueryKeys.byChainAndUser(chainId, userAddress), ...tokenAddresses] as const
};