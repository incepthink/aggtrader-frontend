// store/limit-order/utils/token.types.ts

export interface Token {
  name: string
  ticker: string
  img: string
  address: `0x${string}`
  decimals: number
  chainId: number
  isNative?: boolean
  wrappedAddress?: `0x${string}`
}

// Native tokens have no contract address (they're true native tokens)
// We use special placeholder addresses for identification only
export const NATIVE_TOKEN_ADDRESSES = {
  1: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee' as const, // Ethereum native placeholder
  747474: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee' as const, // Katana native placeholder
}

// WETH contract addresses (actual ERC-20 contracts)
export const WRAPPED_TOKEN_ADDRESSES = {
  1: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2' as const, // WETH on Ethereum
  747474: '0xee7d8bcfb72bc1880d0cf19822eb0a2e6577ab62' as const, // WETH on Katana
}

export function isNativeToken(token: Token): boolean {
  if (!token) return false
  return token.isNative === true || 
         token.address === NATIVE_TOKEN_ADDRESSES[token.chainId as keyof typeof NATIVE_TOKEN_ADDRESSES]
}

export function isWrappedNativeToken(token: Token): boolean {
  if (!token) return false
  return token.address === WRAPPED_TOKEN_ADDRESSES[token.chainId as keyof typeof WRAPPED_TOKEN_ADDRESSES]
}

export function getWrappedTokenAddress(chainId: number): `0x${string}` | undefined {
  return WRAPPED_TOKEN_ADDRESSES[chainId as keyof typeof WRAPPED_TOKEN_ADDRESSES]
}

export function getNativeTokenAddress(chainId: number): `0x${string}` | undefined {
  return NATIVE_TOKEN_ADDRESSES[chainId as keyof typeof NATIVE_TOKEN_ADDRESSES]
}

export function createNativeToken(chainId: number): Token {
  const nativeAddress = NATIVE_TOKEN_ADDRESSES[chainId as keyof typeof NATIVE_TOKEN_ADDRESSES]
  const wrappedAddress = WRAPPED_TOKEN_ADDRESSES[chainId as keyof typeof WRAPPED_TOKEN_ADDRESSES]

  switch (chainId) {
    case 1:
      return {
        name: 'Ethereum',
        ticker: 'ETH',
        img: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png',
        address: nativeAddress || '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee' as `0x${string}`,
        decimals: 18,
        chainId,
        isNative: true,
        wrappedAddress: wrappedAddress,
      }
    case 747474:
      return {
        name: 'Ethereum',
        ticker: 'ETH',
        img: 'https://assets.katana.network/icons/eth.svg',
        address: nativeAddress || '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee' as `0x${string}`,
        decimals: 18,
        chainId,
        isNative: true,
        wrappedAddress: wrappedAddress,
      }
    default:
      return {
        name: 'Ethereum',
        ticker: 'ETH',
        img: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png',
        address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee' as `0x${string}`,
        decimals: 18,
        chainId,
        isNative: true,
        wrappedAddress: WRAPPED_TOKEN_ADDRESSES[1],
      }
  }
}

export function createWrappedNativeToken(chainId: number): Token {
  const wrappedAddress = WRAPPED_TOKEN_ADDRESSES[chainId as keyof typeof WRAPPED_TOKEN_ADDRESSES]

  switch (chainId) {
    case 1:
      return {
        name: 'Wrapped Ethereum',
        ticker: 'WETH',
        img: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png',
        address: wrappedAddress || '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2' as `0x${string}`,
        decimals: 18,
        chainId,
        isNative: false,
      }
    case 747474:
      return {
        name: 'Wrapped Ethereum',
        ticker: 'WETH',
        img: 'https://assets.katana.network/icons/eth.svg',
        address: wrappedAddress || '0xee7d8bcfb72bc1880d0cf19822eb0a2e6577ab62' as `0x${string}`,
        decimals: 18,
        chainId,
        isNative: false,
      }
    default:
      return {
        name: 'Wrapped Ethereum',
        ticker: 'WETH',
        img: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png',
        address: WRAPPED_TOKEN_ADDRESSES[1] || '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2' as `0x${string}`,
        decimals: 18,
        chainId,
        isNative: false,
      }
  }
}

export function createWrappedToken(nativeToken: Token): Token {
  if (!isNativeToken(nativeToken)) {
    throw new Error('Token is not a native token')
  }
  return createWrappedNativeToken(nativeToken.chainId)
}