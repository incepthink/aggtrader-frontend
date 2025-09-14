// utils/currency.ts

import { parseUnits, formatUnits } from 'viem/utils'
import type { Type, AmountData, PriceData } from './currency.types'

export class Amount {
  public readonly currency: Type
  public readonly quotient: bigint
  public readonly decimals: number

  constructor(currency: Type, quotient: bigint) {
    this.currency = currency
    this.quotient = quotient
    this.decimals = currency.decimals
  }

  static fromRawAmount(currency: Type, rawAmount: string | bigint): Amount {
    const quotient = typeof rawAmount === 'string' ? BigInt(rawAmount) : rawAmount
    return new Amount(currency, quotient)
  }

  toSignificant(significantDigits: number = 6): string {
    const formatted = formatUnits(this.quotient, this.decimals)
    const num = parseFloat(formatted)
    return num.toPrecision(significantDigits)
  }

  toExact(): string {
    return formatUnits(this.quotient, this.decimals)
  }

  multiply(other: Amount | Price | { asFraction: any } | bigint | number): Amount {
    let multiplier: bigint

    if (other instanceof Amount) {
      // When multiplying amounts, we need to handle decimals properly
      const scaledQuotient = (this.quotient * other.quotient) / BigInt(10 ** other.decimals)
      return new Amount(this.currency, scaledQuotient)
    } else if (other instanceof Price) {
      // Convert price to quotient ratio
      multiplier = (other.scalar.numerator * BigInt(10 ** this.decimals)) / other.scalar.denominator
      return new Amount(this.currency, (this.quotient * multiplier) / BigInt(10 ** this.decimals))
    } else if (typeof other === 'object' && other.asFraction) {
      // Handle Fraction-like objects
      const fractionValue = other.asFraction
      if (typeof fractionValue === 'number') {
        multiplier = BigInt(Math.floor(fractionValue * 10 ** 18))
        return new Amount(this.currency, (this.quotient * multiplier) / BigInt(10 ** 18))
      }
      return this
    } else if (typeof other === 'bigint') {
      return new Amount(this.currency, this.quotient * other)
    } else if (typeof other === 'number') {
      multiplier = BigInt(Math.floor(other * 10 ** 18))
      return new Amount(this.currency, (this.quotient * multiplier) / BigInt(10 ** 18))
    }

    return this
  }

  equalTo(other: Amount): boolean {
    return this.currency.address === other.currency.address && this.quotient === other.quotient
  }

  lessThan(other: Amount): boolean {
    if (this.currency.address !== other.currency.address) {
      throw new Error('Cannot compare amounts of different currencies')
    }
    return this.quotient < other.quotient
  }

  greaterThan(other: Amount): boolean {
    if (this.currency.address !== other.currency.address) {
      throw new Error('Cannot compare amounts of different currencies')
    }
    return this.quotient > other.quotient
  }

  get wrapped(): Amount {
    if (this.currency.isNative && this.currency.wrapped) {
      return new Amount(this.currency.wrapped, this.quotient)
    }
    return this
  }
}

export class Price {
  public readonly baseCurrency: Type
  public readonly quoteCurrency: Type
  public readonly scalar: { numerator: bigint; denominator: bigint }

  constructor({ baseAmount, quoteAmount }: { baseAmount: Amount; quoteAmount: Amount }) {
    this.baseCurrency = baseAmount.currency
    this.quoteCurrency = quoteAmount.currency
    
    // Calculate the scalar (price ratio)
    this.scalar = {
      numerator: quoteAmount.quotient * BigInt(10 ** baseAmount.decimals),
      denominator: baseAmount.quotient * BigInt(10 ** quoteAmount.decimals)
    }
  }

  quote(currencyAmount: Amount): Amount {
    if (currencyAmount.currency.address !== this.baseCurrency.address) {
      throw new Error('Token does not match price base currency')
    }

    // Calculate quote amount: (amount * numerator) / denominator
    const rawQuote = (currencyAmount.quotient * this.scalar.numerator) / this.scalar.denominator
    return new Amount(this.quoteCurrency, rawQuote)
  }

  invert(): Price {
    const invertedBaseAmount = new Amount(this.quoteCurrency, BigInt(10 ** this.quoteCurrency.decimals))
    const invertedQuoteAmount = new Amount(this.baseCurrency, this.scalar.denominator / BigInt(10 ** this.baseCurrency.decimals))
    
    return new Price({
      baseAmount: invertedBaseAmount,
      quoteAmount: invertedQuoteAmount
    })
  }

  toSignificant(significantDigits: number = 6): string {
    const price = Number(this.scalar.numerator) / Number(this.scalar.denominator)
    return price.toPrecision(significantDigits)
  }
}

export function tryParseAmount(value: string, currency?: Type): Amount | undefined {
  if (!value || !currency) return undefined
  
  try {
    const parsed = parseFloat(value)
    if (isNaN(parsed) || parsed < 0) return undefined
    
    const rawAmount = parseUnits(value, currency.decimals)
    return Amount.fromRawAmount(currency, rawAmount)
  } catch {
    return undefined
  }
}

export const ZERO = new Amount(
  { address: '0x0', decimals: 18, symbol: 'ZERO', name: 'Zero', chainId: 1 },
  BigInt(0)
)

// Create native token helper
export function createNativeToken(chainId: number): Type {
  const baseToken = {
    decimals: 18,
    chainId,
    isNative: true as const,
    isToken: false,
  }

  switch (chainId) {
    case 1:
      return {
        ...baseToken,
        address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
        symbol: 'ETH',
        name: 'Ethereum',
        wrapped: {
          address: '0xC02aaA39b223FE8DaA0e5C4F27eAD9083C756Cc2',
          decimals: 18,
          symbol: 'WETH',
          name: 'Wrapped Ethereum',
          chainId,
          isNative: false,
          isToken: true,
        }
      }
    case 747474:
      return {
        ...baseToken,
        address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
        symbol: 'RON',
        name: 'Ronin',
        wrapped: {
          address: '0xe514d9deb7966c8be0ca922de8a064264ea6bcd4',
          decimals: 18,
          symbol: 'WRON',
          name: 'Wrapped Ronin',
          chainId,
          isNative: false,
          isToken: true,
        }
      }
    default:
      return {
        ...baseToken,
        address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
        symbol: 'ETH',
        name: 'Ethereum',
        wrapped: {
          address: '0xC02aaA39b223FE8DaA0e5C4F27eAD9083C756Cc2',
          decimals: 18,
          symbol: 'WETH',
          name: 'Wrapped Ethereum',
          chainId,
          isNative: false,
          isToken: true,
        }
      }
  }
}

// Percent helper class
export class Percent {
  public readonly numerator: bigint
  public readonly denominator: bigint

  constructor(numerator: number, denominator: number) {
    this.numerator = BigInt(numerator)
    this.denominator = BigInt(denominator)
  }

  get asFraction() {
    return Number(this.numerator) / Number(this.denominator)
  }
}
