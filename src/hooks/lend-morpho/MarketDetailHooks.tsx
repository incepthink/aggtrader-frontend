// /hooks/lend-morpho/MarketDetailHooks.ts
"use client";

import { useQuery } from "@tanstack/react-query";

// Types based on Morpho API structure
export interface MarketAsset {
  symbol: string;
  name: string;
  decimals: number;
  address: string;
  priceUsd?: number;
}

export interface MarketOracle {
  address: string;
  type: string;
}

export interface MarketOracleInfo {
  type: string;
}

export interface MarketWarning {
  type: string;
  level: "YELLOW" | "RED";
}

export interface MarketData {
  uniqueKey: string;
  lltv: string;
  whitelisted: boolean;
  oracleAddress: string;
  irmAddress: string;
  loanAsset: MarketAsset;
  collateralAsset: MarketAsset;
  oracle: MarketOracle;
  oracleInfo: MarketOracleInfo;
  warnings: MarketWarning[];
  badDebt: {
    usd: number;
  };
  realizedBadDebt: {
    usd: number;
  };
  state: {
    supplyApy: number;
    borrowApy: number;
    utilization: number;
    supplyAssets: string;
    supplyAssetsUsd: number;
    borrowAssets: string;
    borrowAssetsUsd: number;
    liquidityAssets: string;
    liquidityAssetsUsd: number;
    fee: number;
  };
  // Computed fields
  ltv: number;
  liquidationLtv: number;
  totalSupplyUsd: number;
  totalBorrowUsd: number;
  liquidityUsd: number;
  totalSupplyAssets: string;
  totalBorrowAssets: string;
  utilization: number;
  supplyApy: number;
  borrowApy: number;
}

// Morpho API base URL
const MORPHO_API_BASE = "https://blue-api.morpho.org/graphql";

// Enhanced GraphQL query to get market data by unique key
const GET_MARKET_QUERY = `
  query GetMarket($uniqueKey: String!, $chainId: Int!) {
    marketByUniqueKey(uniqueKey: $uniqueKey, chainId: $chainId) {
      uniqueKey
      lltv
      whitelisted
      oracleAddress
      irmAddress
      loanAsset {
        address
        symbol
        name
        decimals
        priceUsd
      }
      collateralAsset {
        address
        symbol
        name
        decimals
        priceUsd
      }
      oracle {
        address
        type
      }
      oracleInfo {
        type
      }
      state {
        supplyApy
        borrowApy
        utilization
        supplyAssets
        supplyAssetsUsd
        borrowAssets
        borrowAssetsUsd
        liquidityAssets
        liquidityAssetsUsd
        fee
      }
      warnings {
        type
        level
      }
      badDebt {
        usd
      }
      realizedBadDebt {
        usd
      }
    }
  }
`;

// Fetch market data function
async function fetchMarketData(
  uniqueKey: string,
  chainId: number
): Promise<MarketData> {
  const response = await fetch(MORPHO_API_BASE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: GET_MARKET_QUERY,
      variables: { uniqueKey, chainId },
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();

  if (data.errors) {
    console.error("GraphQL errors:", data.errors);
    throw new Error(data.errors[0]?.message || "GraphQL query failed");
  }

  const market = data.data?.marketByUniqueKey;

  if (!market) {
    throw new Error("Market not found");
  }

  // Calculate additional fields with safe parsing
  let lltv = 0;
  try {
    lltv = parseFloat(market.lltv) / 1e18; // Convert from wei to decimal
  } catch (error) {
    console.warn("Error parsing LLTV:", error);
  }

  const ltv = lltv * 100;
  const liquidationLtv = ltv + 2; // Typically 2% above LTV

  // Calculate liquidity in USD with safe parsing
  let liquidityUsd = 0;
  try {
    const liquidityAssets = parseFloat(market.state.liquidityAssets || "0");
    const priceUsd = market.loanAsset.priceUsd || 0;
    liquidityUsd = liquidityAssets * priceUsd;
  } catch (error) {
    console.warn("Error calculating liquidity USD:", error);
  }

  return {
    ...market,
    // Ensure these fields exist with fallbacks
    whitelisted: market.whitelisted || false,
    oracle: market.oracle || { address: "", type: "" },
    oracleInfo: market.oracleInfo || { type: "" },
    warnings: market.warnings || [],
    badDebt: market.badDebt || { usd: 0 },
    realizedBadDebt: market.realizedBadDebt || { usd: 0 },
    state: {
      ...market.state,
      liquidityAssetsUsd: market.state.liquidityAssetsUsd || liquidityUsd,
    },
    // Computed fields
    utilization: market.state.utilization,
    supplyApy: market.state.supplyApy,
    borrowApy: market.state.borrowApy,
    totalSupplyUsd: market.state.supplyAssetsUsd,
    totalBorrowUsd: market.state.borrowAssetsUsd,
    totalSupplyAssets: market.state.supplyAssets,
    totalBorrowAssets: market.state.borrowAssets,
    liquidityUsd,
    ltv,
    liquidationLtv,
  };
}

// Custom hook to get market details
export function useMarketDetail(uniqueKey: string, chainId: number = 1) {
  return useQuery({
    queryKey: ["market", uniqueKey, chainId],
    queryFn: () => fetchMarketData(uniqueKey, chainId),
    enabled: !!uniqueKey,
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every minute
    retry: (failureCount, error) => {
      // Don't retry if market not found
      if (error?.message?.includes("Market not found")) {
        return false;
      }
      return failureCount < 3;
    },
  });
}

// Enhanced markets query with additional fields
export function useMarkets(chainId: number = 1) {
  const GET_MARKETS_QUERY = `
    query GetMarkets($chainId: Int!) {
      markets(where: { chainId_in: [$chainId] }, first: 50, orderBy: SupplyAssetsUsd, orderDirection: Desc) {
        items {
          uniqueKey
          lltv
          whitelisted
          oracleAddress
          loanAsset {
            address
            symbol
            name
            decimals
            priceUsd
          }
          collateralAsset {
            address
            symbol
            name
            decimals
            priceUsd
          }
          oracle {
            address
            type
          }
          oracleInfo {
            type
          }
          state {
            supplyApy
            borrowApy
            utilization
            supplyAssets
            supplyAssetsUsd
            borrowAssets  
            borrowAssetsUsd
            liquidityAssets
            liquidityAssetsUsd
            fee
          }
          warnings {
            type
            level
          }
          badDebt {
            usd
          }
          realizedBadDebt {
            usd
          }
        }
      }
    }
  `;

  return useQuery({
    queryKey: ["markets", chainId],
    queryFn: async () => {
      const response = await fetch(MORPHO_API_BASE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: GET_MARKETS_QUERY,
          variables: { chainId },
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.errors) {
        console.error("GraphQL errors:", data.errors);
        throw new Error(data.errors[0]?.message || "GraphQL query failed");
      }

      const markets = data.data?.markets?.items || [];

      // Process each market to add computed fields and ensure required properties
      return markets.map((market: any) => {
        let lltv = 0;
        try {
          lltv = parseFloat(market.lltv) / 1e18;
        } catch (error) {
          console.warn(
            "Error parsing LLTV for market:",
            market.uniqueKey,
            error
          );
        }

        const ltv = lltv * 100;
        const liquidationLtv = ltv + 2;

        let liquidityUsd = 0;
        try {
          const liquidityAssets = parseFloat(
            market.state.liquidityAssets || "0"
          );
          const priceUsd = market.loanAsset.priceUsd || 0;
          liquidityUsd = liquidityAssets * priceUsd;
        } catch (error) {
          console.warn(
            "Error calculating liquidity USD for market:",
            market.uniqueKey,
            error
          );
        }

        return {
          ...market,
          // Ensure required fields exist
          whitelisted: market.whitelisted || false,
          oracle: market.oracle || { address: "", type: "" },
          oracleInfo: market.oracleInfo || { type: "" },
          warnings: market.warnings || [],
          badDebt: market.badDebt || { usd: 0 },
          realizedBadDebt: market.realizedBadDebt || { usd: 0 },
          state: {
            ...market.state,
            liquidityAssetsUsd: market.state.liquidityAssetsUsd || liquidityUsd,
          },
          // Computed fields
          utilization: market.state.utilization,
          supplyApy: market.state.supplyApy,
          borrowApy: market.state.borrowApy,
          totalSupplyUsd: market.state.supplyAssetsUsd,
          totalBorrowUsd: market.state.borrowAssetsUsd,
          totalSupplyAssets: market.state.supplyAssets,
          totalBorrowAssets: market.state.borrowAssets,
          liquidityUsd,
          ltv,
          liquidationLtv,
        };
      });
    },
    staleTime: 60000, // 1 minute
    refetchInterval: 120000, // Refetch every 2 minutes
  });
}
