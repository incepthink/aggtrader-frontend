// hooks/lend-morpho/useUserMarketPositions.ts
"use client";
import { useQuery } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import axios from "axios";
import { useChain } from "@/context/ChainContext";

export interface UserMarketPosition {
  market: {
    uniqueKey: string;
    loanAsset: { symbol: string; address: string };
    collateralAsset: { symbol: string; address: string };
    state: { borrowApy: number; supplyApy: number };
  };
  user: { address: string };
  state: {
    borrowAssets: string;
    borrowAssetsUsd: number;
    collateral: string;
    collateralUsd: number;
  };
}

export interface UserBorrowPositionsSummary {
  totalBorrowedUsd: number;
  totalCollateralUsd: number;
  weightedBorrowRate: number;
  positions: UserMarketPosition[];
  positionCount: number;
}

const MORPHO_API_URL = "https://api.morpho.org/graphql";

export const useUserMarketPositions = () => {
  const { address, isConnected } = useAccount();

  const { chainId } = useChain(); // Get chainId from context

  // Simple query focusing only on essential fields
  const query = `
    query GetUserMarketPositions($userAddress: String!, $chainId: Int!) {
      marketPositions(
        first: 100
        where: {
          userAddress_in: [$userAddress]
          chainId: $chainId
        }
      ) {
        items {
          market {
            uniqueKey
            loanAsset {
              symbol
              address
            }
            collateralAsset {
              symbol
              address
            }
            state {
              borrowApy
              supplyApy
            }
          }
          user {
            address
          }
          state {
            borrowAssets
            borrowAssetsUsd
            collateral
            collateralUsd
          }
        }
      }
    }
  `;

  return useQuery<UserBorrowPositionsSummary>({
    queryKey: ["user-market-positions", address, chainId],
    queryFn: async (): Promise<UserBorrowPositionsSummary> => {
      const defaultResult = {
        totalBorrowedUsd: 0,
        totalCollateralUsd: 0,
        weightedBorrowRate: 0,
        positions: [],
        positionCount: 0,
      };

      if (!address || !isConnected) {
        return defaultResult;
      }

      try {
        const response = await axios.post(
          MORPHO_API_URL,
          {
            query,
            variables: {
              userAddress: address.toLowerCase(),
              chainId: chainId,
            },
          },
          {
            headers: { "Content-Type": "application/json" },
            timeout: 15000,
          }
        );

        if (response.data.errors) {
          console.warn("GraphQL errors:", response.data.errors);
          return defaultResult;
        }

        const items = response.data.data?.marketPositions?.items || [];

        // Filter only positions with actual borrowed amounts
        const borrowPositions = items.filter(
          (position: any) => parseFloat(position.state.borrowAssets || "0") > 0
        );

        const totalBorrowedUsd = borrowPositions.reduce(
          (sum: number, position: any) =>
            sum + (position.state.borrowAssetsUsd || 0),
          0
        );

        const totalCollateralUsd = borrowPositions.reduce(
          (sum: number, position: any) =>
            sum + (position.state.collateralUsd || 0),
          0
        );

        // Calculate weighted borrow rate
        const weightedBorrowRate =
          totalBorrowedUsd > 0
            ? borrowPositions.reduce((sum: number, position: any) => {
                const weight =
                  position.state.borrowAssetsUsd / totalBorrowedUsd;
                const borrowApy = position.market?.state?.borrowApy || 0;
                return sum + borrowApy * weight;
              }, 0)
            : 0;

        return {
          totalBorrowedUsd,
          totalCollateralUsd,
          weightedBorrowRate: isNaN(weightedBorrowRate)
            ? 0
            : weightedBorrowRate,
          positions: borrowPositions,
          positionCount: borrowPositions.length,
        };
      } catch (error) {
        console.error("Failed to fetch user market positions:", error);
        return defaultResult;
      }
    },
    enabled: Boolean(address && isConnected && chainId),
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
    refetchInterval: 60 * 1000,
  });
};

// Simplified single position hook
export const useUserMarketPosition = (
  marketUniqueKey: string,
  chainId: number = 1
) => {
  const { address, isConnected } = useAccount();

  const query = `
    query GetUserMarketPosition($userAddress: String!, $marketUniqueKey: String!) {
      marketPositions(
        first: 1
        where: {
          userAddress_in: [$userAddress]
          marketUniqueKey_in: [$marketUniqueKey]
        }
      ) {
        items {
          market {
            uniqueKey
            loanAsset {
              symbol
              address
            }
            collateralAsset {
              symbol
              address
            }
            state {
              borrowApy
              supplyApy
            }
          }
          user {
            address
          }
          state {
            borrowAssets
            borrowAssetsUsd
            collateral
            collateralUsd
          }
        }
      }
    }
  `;

  return useQuery<UserMarketPosition | null>({
    queryKey: ["user-market-position", marketUniqueKey, address, chainId],
    queryFn: async (): Promise<UserMarketPosition | null> => {
      if (!address || !isConnected || !marketUniqueKey) {
        return null;
      }

      try {
        const response = await axios.post(
          MORPHO_API_URL,
          {
            query,
            variables: {
              userAddress: address.toLowerCase(),
              marketUniqueKey: marketUniqueKey.toLowerCase(),
            },
          },
          {
            headers: { "Content-Type": "application/json" },
            timeout: 10000,
          }
        );

        if (response.data.errors) {
          console.warn("GraphQL errors:", response.data.errors);
          return null;
        }

        const items = response.data.data?.marketPositions?.items || [];
        return items[0] || null;
      } catch (error) {
        console.error("Failed to fetch user market position:", error);
        return null;
      }
    },
    enabled: Boolean(address && isConnected && marketUniqueKey),
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 2,
  });
};
