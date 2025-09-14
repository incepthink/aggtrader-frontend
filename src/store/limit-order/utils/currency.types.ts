// types/currency.ts

export interface Token {
  address: string
  decimals: number
  symbol: string
  name: string
  chainId: number
  isNative?: boolean
  isToken?: boolean
  wrapped?: Token
}

export interface NativeToken extends Token {
  isNative: true
  wrapped: Token
}

export interface ERC20Token extends Token {
  isToken: true
  isNative: false
}

export type Type = Token | NativeToken | ERC20Token

export interface AmountData {
  currency: Type
  quotient: bigint
  decimals: number
}

export interface PriceData {
  baseCurrency: Type
  quoteCurrency: Type
  scalar: { numerator: bigint; denominator: bigint }
}