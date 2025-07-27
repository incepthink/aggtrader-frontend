// hooks/lend-morpho/useUserVaultPosition.ts
"use client";
import { useQuery } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import axios from "axios";

// Keep existing interface for backward compatibility
interface UserPosition {
  shares: string | number;
  assets: string | number;
  assetsUsd: number;
}

// New interfaces for all positions
interface UserVaultPosition {
  id: string;
  assets: string | number;
  assetsUsd: number;
  shares: string | number;
  vault: {
    id: string;
    address: string;
    name?: string;
    state: {
      netApy: number;
      apy: number;
    };
  };
}

interface UserPositionsResponse {
  vaultPositions: {
    items: UserVaultPosition[];
  };
}

// Summary interface for easier consumption
export interface UserPositionsSummary {
  totalDepositsUsd: number;
  weightedNetApy: number;
  positions: UserVaultPosition[];
  positionCount: number;
}

const MORPHO_API_URL = "https://api.morpho.org/graphql";

// Original hook - kept for backward compatibility
export const useUserVaultPosition = (
  vaultAddress: string,
  chainId: number = 1
) => {
  const { address, isConnected } = useAccount();

  const query = `
    query GetUserVaultPosition($vaultAddress: String!, $userAddress: String!, $chainId: Int!) {
      vaultPosition(
        vaultAddress: $vaultAddress
        userAddress: $userAddress
        chainId: $chainId
      ) {
        shares
        assets  
        assetsUsd
      }
    }
  `;

  return useQuery<UserPosition | null>({
    queryKey: ["user-vault-position", vaultAddress, address, chainId],
    queryFn: async (): Promise<UserPosition | null> => {
      if (!address || !isConnected) return null;

      // Validate address format
      if (
        address === "0x0000000000000000000000000000000000000000" ||
        !address.startsWith("0x") ||
        address.length !== 42
      ) {
        console.warn("Invalid address for position query:", address);
        return null;
      }

      try {
        console.log("Fetching user position:", {
          vaultAddress,
          userAddress: address,
          chainId,
        });

        const response = await axios({
          url: MORPHO_API_URL,
          method: "POST",
          data: {
            query,
            variables: {
              vaultAddress: vaultAddress.toLowerCase(),
              userAddress: address.toLowerCase(),
              chainId,
            },
          },
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          timeout: 10000,
        });

        if (response.data.errors) {
          console.warn("GraphQL errors:", response.data.errors);
          return null;
        }

        const position = response.data.data?.vaultPosition;
        console.log("User position response:", position);

        return position || null;
      } catch (error) {
        console.error("Failed to fetch user position:", error);
        return null;
      }
    },
    enabled: Boolean(
      address &&
        isConnected &&
        vaultAddress &&
        address !== "0x0000000000000000000000000000000000000000" &&
        address.startsWith("0x") &&
        address.length === 42
    ),
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error) => {
      // Don't retry if it's a user address validation issue
      if (error?.message?.includes("Invalid address")) {
        return false;
      }
      return failureCount < 2;
    },
  });
};

// New hook for all user positions
export const useUserVaultPositions = (chainId: number = 1) => {
  const { address, isConnected } = useAccount();

  const query = `
    query GetAllUserPositions($chainId: Int!, $userAddress: String!) {
      vaultPositions(
        where: {
          chainId_in: [$chainId]
          shares_gte: 0
          userAddress_in: [$userAddress]
        }
      ) {
        items {
          id
          assets
          assetsUsd
          shares
          vault {
            id
            address
            name
            state {
              netApy
              apy
            }
          }
        }
      }
    }
  `;

  return useQuery<UserPositionsSummary>({
    queryKey: ["user-vault-positions", address, chainId],
    queryFn: async (): Promise<UserPositionsSummary> => {
      if (!address || !isConnected) {
        return {
          totalDepositsUsd: 0,
          weightedNetApy: 0,
          positions: [],
          positionCount: 0,
        };
      }

      // Validate address format
      if (
        address === "0x0000000000000000000000000000000000000000" ||
        !address.startsWith("0x") ||
        address.length !== 42
      ) {
        console.warn("Invalid address for positions query:", address);
        return {
          totalDepositsUsd: 0,
          weightedNetApy: 0,
          positions: [],
          positionCount: 0,
        };
      }

      try {
        console.log("Fetching user vault positions:", {
          userAddress: address,
          chainId,
        });

        const response = await axios({
          url: MORPHO_API_URL,
          method: "POST",
          data: {
            query,
            variables: {
              chainId,
              userAddress: address.toLowerCase(),
            },
          },
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          timeout: 15000,
        });

        if (response.data.errors) {
          console.warn("GraphQL errors:", response.data.errors);
          return {
            totalDepositsUsd: 0,
            weightedNetApy: 0,
            positions: [],
            positionCount: 0,
          };
        }

        const data: UserPositionsResponse = response.data.data;
        const positions = data.vaultPositions?.items || [];

        console.log("User positions response:", positions);

        // Calculate summary data
        const totalDepositsUsd = positions.reduce(
          (sum, position) => sum + (position.assetsUsd || 0),
          0
        );

        // Calculate weighted average APY based on deposit amounts
        const weightedNetApy =
          totalDepositsUsd > 0
            ? positions.reduce((weightedSum, position) => {
                const weight = position.assetsUsd / totalDepositsUsd;
                const apy = position.vault?.state?.netApy || 0;
                return weightedSum + apy * weight;
              }, 0)
            : 0;

        return {
          totalDepositsUsd,
          weightedNetApy: isNaN(weightedNetApy) ? 0 : weightedNetApy,
          positions,
          positionCount: positions.length,
        };
      } catch (error) {
        console.error("Failed to fetch user positions:", error);
        return {
          totalDepositsUsd: 0,
          weightedNetApy: 0,
          positions: [],
          positionCount: 0,
        };
      }
    },
    enabled: Boolean(
      address &&
        isConnected &&
        address !== "0x0000000000000000000000000000000000000000" &&
        address.startsWith("0x") &&
        address.length === 42
    ),
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error) => {
      // Don't retry if it's a user address validation issue
      if (error?.message?.includes("Invalid address")) {
        return false;
      }
      return failureCount < 2;
    },
  });
};

// Export all types for backward compatibility
export type { UserPosition, UserVaultPosition };
