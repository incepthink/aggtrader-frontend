import { SimpleAmount, SimplePercent } from '@/store/limit-order/utils/simpleCurrency'
import type { Token } from '@/store/limit-order/utils/token.types'
import type { Fraction } from '@sushiswap/math'

export const TWAP_SUPPORTED_CHAIN_IDS = [
  1, // Ethereum
  747474, // Katana
] as const
  

export type TwapSupportedChainId = (typeof TWAP_SUPPORTED_CHAIN_IDS)[number]
export const isTwapSupportedChainId = (
  chainId: number,
): chainId is TwapSupportedChainId =>
  TWAP_SUPPORTED_CHAIN_IDS.includes(chainId as TwapSupportedChainId)

export const getFeeString = ({
  fromToken,
  toToken,
  tokenOutPrice,
  minAmountOut,
}: {
  fromToken: Token
  toToken: Token
  tokenOutPrice: Fraction | undefined
  minAmountOut: SimpleAmount
}) => {
  // Simple 0.25% fee calculation without special cases
  const feeAmount = minAmountOut.multiply(new SimplePercent(25, 10000))
  
  if (tokenOutPrice) {
    // Convert Fraction to number for multiplication
    try {
      // Try to get the fraction value as a number
      const priceValue = typeof tokenOutPrice.asFraction === 'number' 
        ? tokenOutPrice.asFraction 
        : parseFloat(tokenOutPrice.toFixed(18))
      
      const feeInUSD = feeAmount.multiply(priceValue)
      return `$${feeInUSD.toSignificant(4)}`
    } catch {
      // Fallback to token units if price conversion fails
      return `${feeAmount.toSignificant(4)} ${toToken.ticker}`
    }
  } else {
    // Show in token units if no USD price
    return `${feeAmount.toSignificant(4)} ${toToken.ticker}`
  }
}
