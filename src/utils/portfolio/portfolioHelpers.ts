// utils/portfolio/portfolioHelpers.ts
import type { PortfolioToken } from "@/hooks/usePortfolioDetailed";
import type { KatanaPortfolioToken } from "@/hooks/useKatanaPortfolio";
import type { CombinedToken, TokenPair } from "@/types/portfolio";

// Constants for ETH handling
export const WETH_ADDRESS = "0xC02aaA39b223FE8d0A0e5C4F27eAD9083C756Cc2";
export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
export const ETH_PLACEHOLDER = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";

/**
 * Check if a token is native ETH on Ethereum mainnet
 */
export const isNativeEth = (
  token: PortfolioToken | KatanaPortfolioToken
): boolean => {
  const tokenChainId = (token as any).chain_id;
  const addr =
    ((token as any).contract_address as string | undefined) ??
    ((token as any).address as string | undefined) ??
    "";
  const sym = (token as any).symbol?.toUpperCase?.();

  return (
    tokenChainId === 1 &&
    (!addr ||
      addr === ZERO_ADDRESS ||
      addr.toLowerCase() === ETH_PLACEHOLDER ||
      sym === "ETH")
  );
};

/**
 * Get chain name from chain ID
 */
export const getChainName = (chainId: number): string => {
  switch (chainId) {
    case 1:
      return "Ethereum";
    case 747474:
      return "Katana";
    default:
      return `Chain ${chainId}`;
  }
};

/**
 * Convert raw token data to PortfolioToken format for entry prices hook
 */
export const convertToPortfolioTokenFormat = (
  rawData: (PortfolioToken | KatanaPortfolioToken)[],
  isKatana: boolean
): PortfolioToken[] => {
  return rawData.map((token): PortfolioToken => {
    if (isKatana) {
      const katanaToken = token as KatanaPortfolioToken;
      return {
        symbol: katanaToken.symbol,
        name: katanaToken.name,
        contract_address: katanaToken.address,
        amount: katanaToken.balance,
        price_to_usd: katanaToken.price,
        value_usd: katanaToken.value,
        chain_id: katanaToken.chain_id,
        token_address: katanaToken.address,
        contract_name: katanaToken.name,
        contract_ticker_symbol: katanaToken.symbol,
        contract_decimals: katanaToken.decimals,
        supports_erc: null,
        logo_url: katanaToken.logoUrl || null,
        abs_profit_usd: 0,
        roi: 0,
        status: "success",
      } as unknown as PortfolioToken;
    } else {
      return token as PortfolioToken;
    }
  });
};

/**
 * Create unique token pairs for price fetching
 */
export const createTokenPairs = (
  rawData: (PortfolioToken | KatanaPortfolioToken)[],
  isKatana: boolean,
  chainId: number
): TokenPair[] => {
  const uniqueAddresses = new Set<string>();
  const pairs: TokenPair[] = [];

  rawData.forEach((token) => {
    let tokenAddress: string | undefined = isKatana
      ? (token as KatanaPortfolioToken).address
      : (token as PortfolioToken).contract_address;

    // Map native ETH (and 0xeeee / zero addr / missing addr on mainnet) to WETH
    if (!isKatana && isNativeEth(token)) {
      tokenAddress = WETH_ADDRESS;
    } else if (tokenAddress?.toLowerCase() === ETH_PLACEHOLDER) {
      tokenAddress = WETH_ADDRESS;
    }

    if (tokenAddress && tokenAddress.startsWith("0x")) {
      const key = tokenAddress.toLowerCase();
      if (!uniqueAddresses.has(key)) {
        uniqueAddresses.add(key);
        const cid = (chainId === 1 ? 1 : 747474) as 1 | 747474;
        pairs.push({
          addressOne: tokenAddress as `0x${string}`,
          chainId: cid,
        });
      }
    }
  });

  return pairs;
};

/**
 * Create price lookup map from price data
 */
export const createPriceMap = (
  priceData: any[] | undefined,
  tokenPairs: TokenPair[]
): Record<string, number> => {
  if (!priceData) return {};
  
  const map: Record<string, number> = {};
  tokenPairs.forEach((pair, index) => {
    const result = priceData[index];
    if (result?.success && result.data !== null) {
      map[pair.addressOne.toLowerCase()] = result.data;
    }
  });
  return map;
};

/**
 * Get price for a token from the price map
 */
export const getTokenPrice = (
  tokenAddress: string | undefined,
  token: CombinedToken | undefined,
  priceMap: Record<string, number>,
  isKatana: boolean
): number | null => {
  // If ETH on mainnet, always use WETH price
  if (!isKatana && token && isNativeEth(token as any)) {
    return priceMap[WETH_ADDRESS.toLowerCase()] ?? null;
  }
  if (!tokenAddress) return null;
  
  const lower = tokenAddress.toLowerCase();
  if (lower === ETH_PLACEHOLDER || tokenAddress === ZERO_ADDRESS) {
    return priceMap[WETH_ADDRESS.toLowerCase()] ?? null;
  }
  return priceMap[lower] ?? null;
};

/**
 * Normalize token data with real-time prices
 */
export const normalizeTokenData = (
  rawData: (PortfolioToken | KatanaPortfolioToken)[],
  isKatana: boolean,
  priceMap: Record<string, number>
): CombinedToken[] => {
  return rawData.map((token): CombinedToken => {
    const originalTokenAddress = isKatana
      ? (token as KatanaPortfolioToken).address
      : (token as PortfolioToken).contract_address;

    const realtimePrice = getTokenPrice(
      originalTokenAddress,
      token as any,
      priceMap,
      isKatana
    );
    const fallbackPrice = isKatana
      ? (token as KatanaPortfolioToken).price
      : (token as PortfolioToken).price_to_usd;

    const finalPrice = realtimePrice ?? fallbackPrice;

    if (isKatana) {
      const t = token as KatanaPortfolioToken;
      const value = t.balance * finalPrice;
      return {
        ...t,
        amount: t.balance,
        price_to_usd: finalPrice,
        value_usd: value,
        contract_address: t.address,
      };
    } else {
      const t = token as PortfolioToken;
      const isEth = isNativeEth(t);
      const value = t.amount * finalPrice;
      return {
        ...t,
        // Force native ETH to present with WETH address so downstream checks see it as LIVE
        address: isEth ? WETH_ADDRESS : t.contract_address,
        price_to_usd: finalPrice,
        value_usd: value,
      };
    }
  });
};