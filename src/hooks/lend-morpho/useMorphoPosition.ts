// /hooks/lend-morpho/useMorphoPosition.ts
"use client";

import { useQuery, UseQueryResult } from "@tanstack/react-query";
import axios, { AxiosResponse } from "axios";
import { MarketData } from "@/hooks/lend-morpho/MarketDetailHooks";

const MORPHO_API_URL = "https://api.morpho.org/graphql";

export interface UserPosition {
  collateralAmount: number; // In token units
  borrowedAmount: number; // In token units
  collateralShares: string;
  borrowShares: string;
  supplyShares: string;
  hasPosition: boolean;
  hasDebt: boolean;
  ltv: number; // Current LTV as decimal
  healthFactor: number; // Health factor
  formattedCollateral: string;
  formattedBorrowed: string;
}

interface GraphQLUserPosition {
  user: {
    address: string;
  };
  market: {
    uniqueKey: string;
    loanAsset: {
      address: string;
      symbol: string;
      decimals: number;
    };
    collateralAsset: {
      address: string;
      symbol: string;
      decimals: number;
    };
    lltv: number;
  };
  supplyShares: string;
  borrowShares: string;
  collateral: string;
  supplyAssets: string;
  borrowAssets: string;
  supplyAssetsUsd: number;
  borrowAssetsUsd: number;
  collateralUsd: number;
  healthFactor: number;
}

interface UserPositionsQueryResponse {
  marketPositions: {
    items: GraphQLUserPosition[];
    pageInfo: {
      count: number;
      countTotal: number;
    };
  };
}

interface GraphQLResponse<T> {
  data: T;
  errors?: Array<{
    message: string;
    locations?: Array<{
      line: number;
      column: number;
    }>;
    path?: string[];
  }>;
}

interface PositionQueryOptions {
  userAddress: string;
  marketUniqueKey?: string;
  chainIds?: number[];
}

const defaultPosition: UserPosition = {
  collateralAmount: 0,
  borrowedAmount: 0,
  collateralShares: "0",
  borrowShares: "0",
  supplyShares: "0",
  hasPosition: false,
  hasDebt: false,
  ltv: 0,
  healthFactor: Infinity,
  formattedCollateral: "0.00",
  formattedBorrowed: "0.00",
};

/**
 * Custom hook to fetch user position data from Morpho GraphQL API
 */
export const useMorphoPosition = (
  market: MarketData | null,
  userAddress: string | undefined,
  collateralTokenPrice: number = 0,
  loanTokenPrice: number = 0
): UseQueryResult<UserPosition, Error> & { refetch: () => void } => {
  const queryResult = useQuery<UserPosition, Error>({
    queryKey: [
      "morpho-user-position",
      {
        userAddress: userAddress?.toLowerCase(),
        marketKey: market?.uniqueKey,
        collateralPrice: collateralTokenPrice,
        loanPrice: loanTokenPrice,
      },
    ],
    queryFn: async (): Promise<UserPosition> => {
      // Return default if no user or market
      if (!userAddress || !market) {
        return defaultPosition;
      }

      try {
        const query = `
          query GetUserPosition($userAddress: [String!]!, $marketUniqueKey: [String!]!, $chainIds: [Int!]!) {
            marketPositions(
              first: 1
              where: {
                userAddress_in: $userAddress
                marketUniqueKey_in: $marketUniqueKey
                chainId_in: $chainIds
              }
            ) {
              pageInfo {
                count
                countTotal
              }
              items {
                user {
                  address
                }
                market {
                  uniqueKey
                  loanAsset {
                    address
                    symbol
                    decimals
                  }
                  collateralAsset {
                    address
                    symbol
                    decimals
                  }
                  lltv
                }
                supplyShares
                borrowShares
                collateral
                supplyAssets
                borrowAssets
                supplyAssetsUsd
                borrowAssetsUsd
                collateralUsd
                healthFactor
              }
            }
          }
        `;

        console.log("=== FETCHING USER POSITION VIA GRAPHQL ===");
        console.log("User Address:", userAddress);
        console.log("Market Key:", market.uniqueKey);

        const response: AxiosResponse<
          GraphQLResponse<UserPositionsQueryResponse>
        > = await axios({
          url: MORPHO_API_URL,
          method: "POST",
          data: {
            query,
            variables: {
              userAddress: [userAddress.toLowerCase()],
              marketUniqueKey: [market.uniqueKey],
              chainIds: [1], // Ethereum mainnet
            },
          },
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          timeout: 10000,
        });

        // Check for GraphQL errors
        if (response.data.errors && response.data.errors.length > 0) {
          console.error("GraphQL Error:", response.data.errors[0].message);
          return defaultPosition;
        }

        // Check if data exists
        if (!response.data.data || !response.data.data.marketPositions) {
          console.log("No position data received from API");
          return defaultPosition;
        }

        const positions = response.data.data.marketPositions.items;

        // If no position found, return default
        if (positions.length === 0) {
          console.log("No position found for user in this market");
          return defaultPosition;
        }

        const position = positions[0];
        console.log("Raw position data:", position);

        // Convert string amounts to numbers with proper decimal handling
        const collateralAmount =
          parseFloat(position.collateral) /
            Math.pow(10, position.market.collateralAsset.decimals) || 0;
        const borrowedAmount =
          parseFloat(position.borrowAssets) /
            Math.pow(10, position.market.loanAsset.decimals) || 0;

        // Calculate LTV if we have prices
        let ltv = 0;
        if (
          collateralAmount > 0 &&
          collateralTokenPrice > 0 &&
          loanTokenPrice > 0
        ) {
          const borrowedValueUSD = borrowedAmount * loanTokenPrice;
          const collateralValueUSD = collateralAmount * collateralTokenPrice;
          ltv = borrowedValueUSD / collateralValueUSD;
        }

        // Calculate health factor
        const lltv = position.market.lltv / 1e18; // Convert from wei
        const healthFactor = ltv > 0 ? lltv / ltv : Infinity;

        const userPosition: UserPosition = {
          collateralAmount,
          borrowedAmount,
          collateralShares: position.collateral,
          borrowShares: position.borrowShares,
          supplyShares: position.supplyShares,
          hasPosition: collateralAmount > 0 || borrowedAmount > 0,
          hasDebt: borrowedAmount > 0,
          ltv,
          healthFactor,
          formattedCollateral: collateralAmount.toFixed(6), // More precision for small amounts
          formattedBorrowed: borrowedAmount.toFixed(6),
        };

        console.log("Processed user position:", userPosition);
        return userPosition;
      } catch (error) {
        console.error("Error fetching user position:", error);

        if (axios.isAxiosError(error)) {
          if (error.response) {
            throw new Error(
              `API Error: ${error.response.status} - ${error.response.statusText}`
            );
          } else if (error.request) {
            throw new Error("Network Error: Unable to reach Morpho API");
          }
        }

        // Return default position on error instead of throwing
        return defaultPosition;
      }
    },
    enabled: Boolean(userAddress && market), // Only run query when we have user and market
    staleTime: 30 * 1000, // 30 seconds - positions change more frequently
    gcTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: true, // Refetch when user comes back to tab
    retry: (failureCount, error) => {
      // Retry up to 2 times, but not for 4xx errors
      if (failureCount < 2) {
        const axiosError = error as any;
        if (
          axiosError?.response?.status >= 400 &&
          axiosError?.response?.status < 500
        ) {
          return false; // Don't retry 4xx errors
        }
        return true;
      }
      return false;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });

  return {
    ...queryResult,
    refetch: queryResult.refetch,
  };
};
