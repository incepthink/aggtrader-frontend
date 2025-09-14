import { useQuery } from '@tanstack/react-query'
import type { TwapSupportedChainId } from '@/utils/config'
import type { Token } from '@/store/limit-order/utils/token.types'
import { convertTokenDataToToken } from '@/store/limit-order/utils/simpleCurrency'
import { useTokensBackend } from '@/hooks/useTokensBackend'
import type { Address } from 'viem'

interface UseTokenWithCacheProps {
  chainId: TwapSupportedChainId
  address: Address
  enabled?: boolean
}

export const useTokenWithCache = ({ chainId, address, enabled = true }: UseTokenWithCacheProps) => {
  // Get all tokens from your existing backend hook
  const { tokens: allTokens, isLoading: isTokensLoading } = useTokensBackend(chainId)
  console.log("useTokenWithCache", allTokens);
  
  return useQuery({
    queryKey: ['token-cache', chainId, address],
    queryFn: (): Token => {
      // Find token in the already-fetched tokens list
      const tokenData = allTokens?.find(
        token => token.address.toLowerCase() === address.toLowerCase()
      )
      console.log("useTokenWithCache", tokenData);
      

      if (tokenData) {
        // Convert your TokenData to Token using existing function
        return convertTokenDataToToken(tokenData)
      }

      // Fallback: create generic token if not found
      return {
        name: `Token ${address.slice(-4)}`,
        ticker: `T${address.slice(-4)}`,
        img: '',
        address,
        decimals: 18,
        chainId,
        isNative: false,
      }
    },
    enabled: Boolean(enabled && address && allTokens && !isTokensLoading && allTokens?.length),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  })
}