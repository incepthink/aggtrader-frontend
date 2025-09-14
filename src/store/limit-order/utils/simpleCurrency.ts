// store/limit-order/utils/simpleCurrency.ts

import { parseUnits, formatUnits } from 'viem/utils'
import type { Token } from "@/store/limit-order/utils/token.types";
import { 
  isNativeToken, 
  createWrappedToken, 
  createNativeToken, 
  createWrappedNativeToken,
  NATIVE_TOKEN_ADDRESSES, 
  WRAPPED_TOKEN_ADDRESSES 
} from "@/store/limit-order/utils/token.types";

export class SimpleAmount {
  public readonly token: Token
  public readonly quotient: bigint
  public readonly decimals: number

  constructor(token: Token, quotient: bigint) {
    if (!token) {
      throw new Error('Token cannot be undefined in SimpleAmount')
    }
    this.token = token
    this.quotient = quotient
    this.decimals = token.decimals
  }

  static fromRawAmount(token: Token, rawAmount: string | bigint): SimpleAmount {
    if (!token) {
      throw new Error('Token cannot be undefined in fromRawAmount')
    }
    const quotient = typeof rawAmount === 'string' ? BigInt(rawAmount) : rawAmount
    console.log('🔧 SimpleAmount.fromRawAmount:', {
      token: token.ticker,
      decimals: token.decimals,
      rawAmount: rawAmount.toString(),
      quotient: quotient.toString()
    })
    return new SimpleAmount(token, quotient)
  }

  static fromUserAmount(token: Token, userAmount: string): SimpleAmount | undefined {
    if (!token || !userAmount) {
      console.log('❌ SimpleAmount.fromUserAmount: Invalid inputs', { token, userAmount })
      return undefined
    }
    
    try {
      const parsed = parseFloat(userAmount)
      if (isNaN(parsed) || parsed < 0) {
        console.log('❌ SimpleAmount.fromUserAmount: Invalid number', { userAmount, parsed })
        return undefined
      }
      
      const rawAmount = parseUnits(userAmount, token.decimals)
      console.log('🔧 SimpleAmount.fromUserAmount:', {
        token: token.ticker,
        decimals: token.decimals,
        userAmount,
        parsed,
        rawAmount: rawAmount.toString()
      })
      return new SimpleAmount(token, rawAmount)
    } catch (error) {
      console.log('❌ SimpleAmount.fromUserAmount: Error', { userAmount, error })
      return undefined
    }
  }

  toSignificant(significantDigits: number = 6): string {
    const formatted = formatUnits(this.quotient, this.decimals)
    const num = parseFloat(formatted)
    
    if (num === 0) return '0'
    
    // Handle very small numbers to avoid scientific notation
    if (Math.abs(num) < 0.000001) {
      return num.toFixed(Math.min(12, significantDigits)).replace(/\.?0+$/, '')
    }
    
    return num.toPrecision(significantDigits).replace(/\.?0+$/, '')
  }

  toExact(): string {
    return formatUnits(this.quotient, this.decimals)
  }

  multiply(other: SimpleAmount | SimplePrice | SimplePercent | number | bigint | any): SimpleAmount {
    let multiplier: bigint

    if (other instanceof SimpleAmount) {
      if (!other.token) {
        throw new Error('Cannot multiply with SimpleAmount that has undefined token')
      }
      const scaledQuotient = (this.quotient * other.quotient) / BigInt(10 ** other.decimals)
      return new SimpleAmount(this.token, scaledQuotient)
    } else if (other instanceof SimplePrice) {
      multiplier = (other.scalar.numerator * BigInt(10 ** this.decimals)) / other.scalar.denominator
      return new SimpleAmount(this.token, (this.quotient * multiplier) / BigInt(10 ** this.decimals))
    } else if (other instanceof SimplePercent) {
      const percentValue = other.asFraction
      multiplier = BigInt(Math.floor(percentValue * 10 ** 18))
      return new SimpleAmount(this.token, (this.quotient * multiplier) / BigInt(10 ** 18))
    } else if (typeof other === 'bigint') {
      return new SimpleAmount(this.token, this.quotient * other)
    } else if (typeof other === 'number') {
      multiplier = BigInt(Math.floor(other * 10 ** 18))
      return new SimpleAmount(this.token, (this.quotient * multiplier) / BigInt(10 ** 18))
    }

    return this
  }

  equalTo(other: SimpleAmount): boolean {
    // Add null safety checks
    if (!this.token || !other || !other.token) {
      return false
    }
    return this.token.address === other.token.address && this.quotient === other.quotient
  }

  lessThan(other: SimpleAmount): boolean {
    if (!this.token || !other || !other.token) {
      throw new Error('Cannot compare amounts with undefined tokens')
    }
    if (this.token.address !== other.token.address) {
      throw new Error('Cannot compare amounts of different tokens')
    }
    return this.quotient < other.quotient
  }

  greaterThan(other: SimpleAmount): boolean {
    if (!this.token || !other || !other.token) {
      throw new Error('Cannot compare amounts with undefined tokens')
    }
    if (this.token.address !== other.token.address) {
      throw new Error('Cannot compare amounts of different tokens')
    }
    return this.quotient > other.quotient
  }

  get currency(): Token {
    return this.token
  }

  get wrapped(): SimpleAmount {
    // If token is native, return wrapped version
    if (isNativeToken(this.token)) {
      const wrappedToken = createWrappedToken(this.token)
      return new SimpleAmount(wrappedToken, this.quotient)
    }
    return this
  }
}

export class SimplePrice {
  public readonly baseCurrency: Token
  public readonly quoteCurrency: Token
  public readonly scalar: { numerator: bigint; denominator: bigint }

  constructor({ baseAmount, quoteAmount }: { baseAmount: SimpleAmount; quoteAmount: SimpleAmount }) {
    if (!baseAmount || !quoteAmount || !baseAmount.token || !quoteAmount.token) {
      throw new Error('BaseAmount and quoteAmount must have valid tokens')
    }
    
    this.baseCurrency = baseAmount.token
    this.quoteCurrency = quoteAmount.token
    
    console.log('🔧 SimplePrice.constructor:', {
      base: { token: baseAmount.token.ticker, decimals: baseAmount.token.decimals, quotient: baseAmount.quotient.toString() },
      quote: { token: quoteAmount.token.ticker, decimals: quoteAmount.token.decimals, quotient: quoteAmount.quotient.toString() }
    })
    
    // Prevent division by zero
    if (baseAmount.quotient === BigInt(0)) {
      this.scalar = {
        numerator: BigInt(0),
        denominator: BigInt(1)
      }
      console.log('⚠️ SimplePrice.constructor: Zero base amount, using 0/1 scalar')
    } else {
      // Store the raw price ratio without decimal adjustments
      // We'll handle decimal scaling in the quote() method
      this.scalar = {
        numerator: quoteAmount.quotient,
        denominator: baseAmount.quotient
      }
      
      console.log('🔧 SimplePrice.constructor: Created scalar:', {
        numerator: this.scalar.numerator.toString(),
        denominator: this.scalar.denominator.toString(),
        rawRatio: Number(this.scalar.numerator) / Number(this.scalar.denominator)
      })
    }
  }

  quote(currencyAmount: SimpleAmount): SimpleAmount {
    console.log('🔧 SimplePrice.quote: Starting calculation:', {
      inputToken: currencyAmount.token.ticker,
      inputDecimals: currencyAmount.token.decimals,
      inputQuotient: currencyAmount.quotient.toString(),
      inputAmount: currencyAmount.toSignificant(6),
      baseToken: this.baseCurrency.ticker,
      quoteToken: this.quoteCurrency.ticker,
      scalar: {
        numerator: this.scalar.numerator.toString(),
        denominator: this.scalar.denominator.toString()
      }
    })
    
    if (!currencyAmount || !currencyAmount.token || !this.baseCurrency) {
      console.log('❌ SimplePrice.quote: Invalid inputs')
      throw new Error('Cannot quote with undefined tokens')
    }
    
    if (currencyAmount.token.address !== this.baseCurrency.address) {
      console.log('❌ SimplePrice.quote: Token mismatch', {
        inputToken: currencyAmount.token.address,
        expectedToken: this.baseCurrency.address
      })
      throw new Error('Token does not match price base currency')
    }

    // Prevent division by zero
    if (this.scalar.denominator === BigInt(0)) {
      console.log('⚠️ SimplePrice.quote: Zero denominator, returning zero')
      return new SimpleAmount(this.quoteCurrency, BigInt(0))
    }

    // Calculate the quote with proper decimal handling
    const baseDecimals = this.baseCurrency.decimals
    const quoteDecimals = this.quoteCurrency.decimals
    
    console.log('🔧 SimplePrice.quote: Decimal info:', { baseDecimals, quoteDecimals })
    
    // Formula: (inputAmount * priceNumerator * 10^quoteDecimals) / (priceDenominator * 10^baseDecimals)
    const numeratorWithDecimals = currencyAmount.quotient * this.scalar.numerator
const denominatorWithDecimals = this.scalar.denominator * BigInt(10 ** (baseDecimals - quoteDecimals))
    
    console.log('🔧 SimplePrice.quote: Calculation details:', {
      step1_inputAmount: currencyAmount.quotient.toString(),
      step2_priceNumerator: this.scalar.numerator.toString(),
      step3_quoteDecimalMultiplier: `10^${quoteDecimals} = ${BigInt(10 ** quoteDecimals).toString()}`,
      step4_numeratorWithDecimals: numeratorWithDecimals.toString(),
      step5_priceDenominator: this.scalar.denominator.toString(),
      step6_baseDecimalMultiplier: `10^${baseDecimals} = ${BigInt(10 ** baseDecimals).toString()}`,
      step7_denominatorWithDecimals: denominatorWithDecimals.toString()
    })
    
    const rawQuote = numeratorWithDecimals / denominatorWithDecimals
    
    console.log('🔧 SimplePrice.quote: Final calculation:', {
      rawQuote: rawQuote.toString(),
      outputToken: this.quoteCurrency.ticker,
      outputDecimals: this.quoteCurrency.decimals,
      formattedOutput: formatUnits(rawQuote, this.quoteCurrency.decimals)
    })
    
    const result = new SimpleAmount(this.quoteCurrency, rawQuote)
    
    console.log('✅ SimplePrice.quote: Result:', {
      token: result.token.ticker,
      quotient: result.quotient.toString(),
      toSignificant: result.toSignificant(6)
    })
    
    return result
  }

  invert(): SimplePrice {
    if (!this.baseCurrency || !this.quoteCurrency) {
      throw new Error('Cannot invert price with undefined currencies')
    }
    
    const invertedBaseAmount = new SimpleAmount(this.quoteCurrency, BigInt(10 ** this.quoteCurrency.decimals))
    
    // Prevent division by zero
    if (this.scalar.numerator === BigInt(0)) {
      const invertedQuoteAmount = new SimpleAmount(this.baseCurrency, BigInt(0))
      return new SimplePrice({
        baseAmount: invertedBaseAmount,
        quoteAmount: invertedQuoteAmount
      })
    }
    
    const invertedQuoteAmount = new SimpleAmount(this.baseCurrency, BigInt(10 ** this.baseCurrency.decimals))
    
    return new SimplePrice({
      baseAmount: invertedBaseAmount,
      quoteAmount: invertedQuoteAmount
    })
  }

  toSignificant(significantDigits: number = 6): string {
    if (this.scalar.denominator === BigInt(0)) return '0'
    
    // Calculate price considering decimal differences
    const baseDecimals = this.baseCurrency.decimals
    const quoteDecimals = this.quoteCurrency.decimals
    
    // Normalize both to the same decimal base for comparison
    const normalizedNumerator = this.scalar.numerator * BigInt(10 ** baseDecimals)
    const normalizedDenominator = this.scalar.denominator * BigInt(10 ** quoteDecimals)
    
    const price = Number(normalizedNumerator) / Number(normalizedDenominator)
    
    console.log('🔧 SimplePrice.toSignificant:', {
      baseDecimals,
      quoteDecimals,
      rawNumerator: this.scalar.numerator.toString(),
      rawDenominator: this.scalar.denominator.toString(),
      normalizedNumerator: normalizedNumerator.toString(),
      normalizedDenominator: normalizedDenominator.toString(),
      price,
      significantDigits
    })
    
    if (price === 0 || isNaN(price)) return '0'
    
    // Handle very small numbers to avoid scientific notation
    if (Math.abs(price) < 0.000001) {
      return price.toFixed(Math.min(12, significantDigits)).replace(/\.?0+$/, '')
    }
    
    return price.toPrecision(significantDigits).replace(/\.?0+$/, '')
  }
}

export function tryParseAmount(value: string, token?: Token): SimpleAmount | undefined {
  console.log('🔧 tryParseAmount:', { value, token: token?.ticker })
  if (!value || !token) {
    console.log('❌ tryParseAmount: Invalid inputs')
    return undefined
  }
  const result = SimpleAmount.fromUserAmount(token, value)
  console.log('🔧 tryParseAmount result:', result ? {
    token: result.token.ticker,
    quotient: result.quotient.toString(),
    toSignificant: result.toSignificant(6)
  } : 'undefined')
  return result
}

// Create a safe zero amount with a dummy token
export const SIMPLE_ZERO = (() => {
  try {
    const dummyToken: Token = { 
      name: 'Zero', 
      ticker: 'ZERO', 
      img: '', 
      address: '0x0000000000000000000000000000000000000000' as `0x${string}`, 
      decimals: 18, 
      chainId: 1 
    }
    return new SimpleAmount(dummyToken, BigInt(0))
  } catch {
    return null
  }
})()

export class SimplePercent {
  public readonly numerator: bigint
  public readonly denominator: bigint

  constructor(numerator: number, denominator: number) {
    this.numerator = BigInt(numerator)
    this.denominator = BigInt(denominator)
  }

  get asFraction() {
    return Number(this.numerator) / Number(this.denominator)
  }

  toSignificant(significantDigits: number = 2): string {
    const percent = this.asFraction * 100
    return percent.toFixed(significantDigits) + '%'
  }
}

// Convert backend TokenData to simple Token with validation and native token detection
export function convertTokenDataToToken(tokenData: any): Token {
  if (!tokenData || !tokenData.address || !tokenData.name) {
    throw new Error('Invalid token data')
  }
  
  const chainId = tokenData.chainId || 1
  const address = tokenData.address as `0x${string}`
  const nativeAddress = NATIVE_TOKEN_ADDRESSES[chainId as keyof typeof NATIVE_TOKEN_ADDRESSES]
  const wrappedAddress = WRAPPED_TOKEN_ADDRESSES[chainId as keyof typeof WRAPPED_TOKEN_ADDRESSES]
  
  return {
    name: tokenData.name,
    ticker: tokenData.symbol || tokenData.ticker || 'UNKNOWN',
    img: tokenData.logoURI || tokenData.img || '',
    address: address,
    decimals: tokenData.decimals || 18,
    chainId: chainId,
    // Native token uses placeholder address, check against it
    isNative: address === nativeAddress,
    wrappedAddress: address === nativeAddress ? wrappedAddress : undefined,
  }
}