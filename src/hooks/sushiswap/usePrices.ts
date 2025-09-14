// hooks/sushiswap/usePrices.ts
import { useMemo } from 'react'
import { Fraction } from '@sushiswap/math'
import { parseUnits } from 'viem/utils'
import { usePriceBackend } from '@/hooks/sushiswap/usePriceBackend'
import type { Token } from '@/store/limit-order/utils/token.types'

interface PricesData {
  getFraction: (tokenAddress: string) => Fraction | undefined
}

interface UsePricesProps {
  chainId: number
  token0?: Token | undefined
  token1?: Token | undefined
}

export const usePrices = ({ chainId, token0, token1 }: UsePricesProps) => {
  // Use your custom hook directly for token0
  const token0PriceHook = usePriceBackend(
    token0?.address,
    undefined,
    chainId
  )

  // Use your custom hook directly for token1
  const token1PriceHook = usePriceBackend(
    token1?.address,
    undefined,
    chainId
  )

  // Extract the actual price values from your hook responses
  const token0Price = token0PriceHook?.data ?? token0PriceHook?.tokenPrice
  const token1Price = token1PriceHook?.data ?? token1PriceHook?.tokenPrice

  const data: PricesData = useMemo(() => ({
    getFraction: (tokenAddress: string) => {
      const normalizedAddress = tokenAddress.toLowerCase()
      
      const token0Address = token0?.address?.toLowerCase()
      const token1Address = token1?.address?.toLowerCase()
      
      if (token0Address === normalizedAddress && token0Price != null) {
        return createFraction(token0Price)
      }
      if (token1Address === normalizedAddress && token1Price != null) {
        return createFraction(token1Price)
      }
      
      return undefined
    }
  }), [token0Price, token1Price, token0?.address, token1?.address])

  return {
    data,
    isLoading: token0PriceHook?.isLoading || token1PriceHook?.isLoading || false,
  }
}

// Create a proper Fraction from a price number
function createFraction(priceNumber: number): Fraction {
  const numerator = parseUnits(String(priceNumber), 18).toString()
  const denominator = parseUnits('1', 18).toString()
  return new Fraction(numerator, denominator)
}