// /hooks/useCoinGeckoPrice.ts
"use client";

import React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

// Common token addresses to CoinGecko IDs mapping
const TOKEN_ID_MAP: { [address: string]: string } = {
  // Stablecoins (always $1)
  "0xa0b86a33e6441b8be0ae1a15e1e5f22d6b0cd2c4": "usd-coin", // USDC
  "0xdac17f958d2ee523a2206206994597c13d831ec7": "tether", // USDT
  "0x6b175474e89094c44da98b954eedeac495271d0f": "dai", // DAI
  "0x4fabb145d64652a948d72533023f6e7a623c7c53": "binance-usd", // BUSD
  "0x853d955acef822db058eb8505911ed77f175b99e": "frax", // FRAX

  // Major tokens
  "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2": "ethereum", // WETH
  "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599": "wrapped-bitcoin", // WBTC
  "0xcbb7c0000ab88b473b1f5afd9ef808440eed33bf": "coinbase-wrapped-btc", // cbBTC
  "0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0": "matic-network", // MATIC
  "0x514910771af9ca656af840dff83e8264ecf986ca": "chainlink", // LINK
  "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984": "uniswap", // UNI
  "0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9": "aave", // AAVE
  "0x6982508145454ce325ddbe47a25d4ec3d2311933": "pepe", // PEPE

  // LSTs
  "0x7f39c581f595b53c5cb19bd0b3f8da6c935e2ca0": "wrapped-steth", // wstETH
  "0xae78736cd615f374d3085123a210448e74fc6393": "rocket-pool-eth", // rETH
  "0xbe9895146f7af43049ca1c1ae358b0541ea49704": "coinbase-wrapped-staked-eth", // cbETH

  // ETH (special case)
  "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee": "ethereum", // ETH
};

// Stablecoins that should always return $1
const STABLECOINS = new Set([
  "0xa0b86a33e6441b8be0ae1a15e1e5f22d6b0cd2c4", // USDC
  "0xdac17f958d2ee523a2206206994597c13d831ec7", // USDT
  "0x6b175474e89094c44da98b954eedeac495271d0f", // DAI
  "0x4fabb145d64652a948d72533023f6e7a623c7c53", // BUSD
  "0x853d955acef822db058eb8505911ed77f175b99e", // FRAX
]);

interface PriceData {
  [coinId: string]: {
    usd: number;
    usd_24h_change?: number;
  };
}

interface QueryData {
  [key: string]: any;
}

// Batch fetch multiple token prices
async function fetchTokenPrices(coinIds: string[]): Promise<PriceData> {
  if (coinIds.length === 0) return {};

  try {
    const uniqueIds = [...new Set(coinIds)];
    const idsString = uniqueIds.join(",");

    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${idsString}&vs_currencies=usd&include_24hr_change=true`,
      {
        headers: {
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      // Handle rate limit specifically
      if (response.status === 429) {
        throw new Error("RATE_LIMIT");
      }
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching prices from CoinGecko:", error);
    throw error;
  }
}

// Fetch price by contract address (fallback for unmapped tokens)
async function fetchPriceByAddress(contractAddress: string): Promise<number> {
  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/token_price/ethereum?contract_addresses=${contractAddress}&vs_currencies=usd`,
      {
        headers: {
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error("RATE_LIMIT");
      }
      throw new Error(`CoinGecko contract API error: ${response.status}`);
    }

    const data = await response.json();
    const price = data[contractAddress.toLowerCase()]?.usd;
    return price || 0;
  } catch (error) {
    console.error(
      `Error fetching price for address ${contractAddress}:`,
      error
    );
    throw error;
  }
}

// Get CoinGecko ID from token address
function getCoinGeckoId(tokenAddress: string): string | null {
  const address = tokenAddress.toLowerCase();
  return TOKEN_ID_MAP[address] || null;
}

// Single token price hook
export function useCoinGeckoPrice(tokenAddress: string) {
  const normalizedAddress = tokenAddress.toLowerCase();

  // Return $1 immediately for stablecoins
  if (STABLECOINS.has(normalizedAddress)) {
    return {
      price: 1,
      change24h: 0,
      isLoading: false,
      error: null,
      isStablecoin: true,
    };
  }

  const coinId = getCoinGeckoId(tokenAddress);
  const hasCoinId = Boolean(coinId);

  // Primary query for mapped tokens (by coin ID)
  const coinIdQuery = useQuery<PriceData>({
    queryKey: ["coinGeckoPrice", coinId],
    queryFn: () =>
      coinId ? fetchTokenPrices([coinId]) : Promise.resolve({} as PriceData),
    enabled: hasCoinId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes cache time
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: (failureCount, error: any) => {
      if (error?.message === "RATE_LIMIT") {
        return false;
      }
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) =>
      Math.min(2000 * Math.pow(2, attemptIndex), 30000),
  });

  // Fallback query for unmapped tokens (by contract address)
  const addressQuery = useQuery<number>({
    queryKey: ["coinGeckoPriceByAddress", normalizedAddress],
    queryFn: () => fetchPriceByAddress(normalizedAddress),
    enabled: !hasCoinId && Boolean(tokenAddress) && tokenAddress !== "0x0",
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes cache time
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: (failureCount, error: any) => {
      if (error?.message === "RATE_LIMIT") {
        return false;
      }
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) =>
      Math.min(3000 * Math.pow(2, attemptIndex), 30000), // Slightly longer delay for address lookups
  });

  // Use mapped token data if available, otherwise use address lookup
  const activeQuery = hasCoinId ? coinIdQuery : addressQuery;
  const priceData = hasCoinId && coinId ? coinIdQuery.data?.[coinId] : null;
  const addressPrice = !hasCoinId ? addressQuery.data : null;

  return {
    price: priceData?.usd || addressPrice || 0,
    change24h: priceData?.usd_24h_change || 0, // Address API doesn't provide 24h change
    isLoading: activeQuery.isLoading,
    error: activeQuery.error,
    isStablecoin: false,
    isMappedToken: hasCoinId,
  };
}

// Batch prices hook for multiple tokens (enhanced for unmapped tokens)
export function useCoinGeckoPrices(tokenAddresses: string[]) {
  const normalizedAddresses = tokenAddresses.map((addr) => addr.toLowerCase());

  // Separate mapped and unmapped tokens
  const mappedTokens = normalizedAddresses.filter(
    (addr) => getCoinGeckoId(addr) !== null
  );
  const unmappedTokens = normalizedAddresses.filter(
    (addr) =>
      getCoinGeckoId(addr) === null && !STABLECOINS.has(addr) && addr !== "0x0"
  );

  const coinIds = mappedTokens
    .map(getCoinGeckoId)
    .filter((id): id is string => id !== null);

  // Query for mapped tokens
  const mappedQuery = useQuery<PriceData>({
    queryKey: ["coinGeckoPrices", coinIds.sort()],
    queryFn: () => fetchTokenPrices(coinIds),
    enabled: coinIds.length > 0,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: (failureCount, error: any) => {
      if (error?.message === "RATE_LIMIT") return false;
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) =>
      Math.min(2000 * Math.pow(2, attemptIndex), 30000),
  });

  // Individual queries for unmapped tokens (to avoid batching issues)
  const unmappedQueries = unmappedTokens.map((address) =>
    useQuery<number>({
      queryKey: ["coinGeckoPriceByAddress", address],
      queryFn: () => fetchPriceByAddress(address),
      enabled: Boolean(address),
      staleTime: 2 * 60 * 1000,
      gcTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      retry: (failureCount, error: any) => {
        if (error?.message === "RATE_LIMIT") return false;
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) =>
        Math.min(3000 * Math.pow(2, attemptIndex), 30000),
    })
  );

  // Transform data to be indexed by token address
  const pricesByAddress = normalizedAddresses.reduce(
    (acc, address) => {
      // Handle stablecoins
      if (STABLECOINS.has(address)) {
        acc[address] = {
          price: 1,
          change24h: 0,
          isStablecoin: true,
          isMappedToken: true,
        };
        return acc;
      }

      // Handle mapped tokens
      const coinId = getCoinGeckoId(address);
      if (coinId) {
        const priceData = mappedQuery.data?.[coinId];
        acc[address] = {
          price: priceData?.usd || 0,
          change24h: priceData?.usd_24h_change || 0,
          isStablecoin: false,
          isMappedToken: true,
        };
        return acc;
      }

      // Handle unmapped tokens
      const unmappedIndex = unmappedTokens.indexOf(address);
      if (unmappedIndex !== -1) {
        const query = unmappedQueries[unmappedIndex];
        acc[address] = {
          price: query.data || 0,
          change24h: 0, // Address API doesn't provide 24h change
          isStablecoin: false,
          isMappedToken: false,
        };
      } else {
        acc[address] = {
          price: 0,
          change24h: 0,
          isStablecoin: false,
          isMappedToken: false,
        };
      }

      return acc;
    },
    {} as {
      [address: string]: {
        price: number;
        change24h: number;
        isStablecoin: boolean;
        isMappedToken: boolean;
      };
    }
  );

  const isLoading =
    mappedQuery.isLoading || unmappedQueries.some((q) => q.isLoading);
  const error =
    mappedQuery.error || unmappedQueries.find((q) => q.error)?.error;

  return {
    prices: pricesByAddress,
    isLoading,
    error,
  };
}

// Preload common token prices to reduce individual API calls
export function usePreloadCommonPrices() {
  const queryClient = useQueryClient();

  React.useEffect(() => {
    const commonTokens = [
      "ethereum",
      "wrapped-bitcoin",
      "coinbase-wrapped-btc",
      "chainlink",
      "uniswap",
      "aave",
      "wrapped-steth",
    ];

    // Preload if not already cached
    const hasData = queryClient.getQueryData([
      "coinGeckoPrices",
      commonTokens.sort(),
    ]);
    if (!hasData) {
      queryClient.prefetchQuery({
        queryKey: ["coinGeckoPrices", commonTokens.sort()],
        queryFn: () => fetchTokenPrices(commonTokens),
        staleTime: 2 * 60 * 1000,
      });
    }
  }, [queryClient]);
}

// Helper function to get price without hook (for use in utilities)
export async function getTokenPrice(tokenAddress: string): Promise<number> {
  const normalizedAddress = tokenAddress.toLowerCase();

  if (STABLECOINS.has(normalizedAddress)) {
    return 1;
  }

  const coinId = getCoinGeckoId(tokenAddress);

  try {
    if (coinId) {
      // Use coin ID if available (more reliable)
      const data = await fetchTokenPrices([coinId]);
      return data[coinId]?.usd || 0;
    } else {
      // Fallback to address lookup
      return await fetchPriceByAddress(normalizedAddress);
    }
  } catch (error) {
    console.error(`Failed to get price for ${tokenAddress}:`, error);
    return 0;
  }
}

export default useCoinGeckoPrice;
