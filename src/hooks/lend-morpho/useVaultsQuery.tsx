import { useQuery, UseQueryResult } from "@tanstack/react-query";
import axios, { AxiosResponse } from "axios";
import { useChain } from "@/context/ChainContext";

// Updated to official API endpoint
const MORPHO_API_URL = "https://api.morpho.org/graphql";

export interface Asset {
  address: string;
}

export interface Yield {
  apr: number;
}

export interface VaultAsset {
  yield: Yield;
}

export interface Reward {
  asset: Asset;
  supplyApr: number;
  yearlySupplyTokens: number;
}

export interface MarketReward {
  asset: Asset;
  supplyApr: number;
  borrowApr: number;
}

export interface MarketState {
  rewards: MarketReward[];
}

export interface LoanAsset {
  name: string;
}

export interface CollateralAsset {
  name: string;
}

export interface Market {
  uniqueKey: string;
  loanAsset: LoanAsset | null;
  collateralAsset: CollateralAsset | null;
  oracleAddress: string;
  irmAddress: string;
  lltv: number;
  state: MarketState;
}

export interface Allocation {
  market: Market;
  supplyCap: string;
  supplyAssets: string;
  supplyAssetsUsd: number;
}

export interface VaultState {
  owner: string;
  curator: string;
  guardian: string;
  timelock: string;
  apy: number;
  netApy: number;
  netApyWithoutRewards: number;
  dailyApy: number;
  dailyNetApy: number;
  avgNetApy: number;
  weeklyApy: number;
  weeklyNetApy: number;
  monthlyApy: number;
  monthlyNetApy: number;
  totalAssets: string;
  totalAssetsUsd: number;
  rewards: Reward[];
  allocation: Allocation[];
}

export interface Curator {
  image: string;
  name: string;
  url: string;
}

export interface Metadata {
  description: string;
  forumLink: string;
  image: string;
  curators: Curator[];
}

export interface Allocator {
  address: string;
}

export interface Vault {
  address: string;
  name: string;
  symbol: string;
  whitelisted: boolean;
  asset: VaultAsset;
  metadata: Metadata;
  allocators: Allocator[];
  state: VaultState;
}

export interface VaultsQueryResponse {
  vaults: {
    items: Vault[];
  };
}

export interface GraphQLResponse<T> {
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

export interface VaultsQueryOptions {
  limit?: number;
  whitelistedOnly?: boolean;
  chainId?: number[];
}

/**
 * Custom hook to fetch vault data from Morpho GraphQL API
 * @param options - Query options
 * @returns Query result object with type safety
 */
export const useVaultsQuery = (
  options: VaultsQueryOptions = {}
): UseQueryResult<Vault[], Error> => {
  const {
    limit = 100,
    whitelistedOnly = true, // Default to whitelisted only like official app
  } = options;

  const { chainId } = useChain(); // Get chainId from context

  // Updated GraphQL query to match official API structure - fixed VaultFilters type
  const query = `
    query GetVaults($first: Int!, $where: VaultFilters) {
      vaults(first: $first, orderBy: TotalAssetsUsd, orderDirection: Desc, where: $where) {
        items {
          address
          name
          symbol
          whitelisted
          asset {
            address
            decimals
            yield {
              apr
            }
          }
          metadata {
            description
            forumLink
            image
            curators {
              image
              name
              url
            }
          }
          allocators {
            address
          }
          state {
            owner
            curator
            guardian
            timelock
            apy
            netApy
            avgNetApy
            netApyWithoutRewards
            dailyApy
            dailyNetApy
            weeklyApy
            weeklyNetApy
            monthlyApy
            monthlyNetApy
            totalAssets
            totalAssetsUsd
            rewards {
              asset {
                address
              }
              supplyApr
              yearlySupplyTokens
            }
            allocation {
              supplyAssets
              supplyAssetsUsd
              market {
                uniqueKey
                loanAsset {
                  name
                }
                collateralAsset {
                  name
                }
                oracleAddress
                irmAddress
                lltv
                state {
                  rewards {
                    asset {
                      address
                    }
                    supplyApr
                    borrowApr
                  }
                }
              }
            }
          }
        }
      }
    }
  `;

  // Build where clause
  const buildWhereClause = () => {
    const whereConditions: any = {
      chainId_in: chainId,
    };

    if (whitelistedOnly) {
      whereConditions.whitelisted = true;
    }

    return whereConditions;
  };

  return useQuery<Vault[], Error>({
    queryKey: ["morpho-vaults", { limit, whitelistedOnly, chainId }],
    queryFn: async (): Promise<Vault[]> => {
      try {
        const response: AxiosResponse<GraphQLResponse<VaultsQueryResponse>> =
          await axios({
            url: MORPHO_API_URL,
            method: "POST",
            data: {
              query,
              variables: {
                first: limit,
                where: buildWhereClause(),
              },
            },
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            timeout: 15000, // Increased timeout for official API
          });

        // Check for GraphQL errors
        if (response.data.errors && response.data.errors.length > 0) {
          throw new Error(`GraphQL Error: ${response.data.errors[0].message}`);
        }

        // Check if data exists
        if (!response.data.data || !response.data.data.vaults) {
          throw new Error("No vault data received from API");
        }

        return response.data.data.vaults.items;
      } catch (error) {
        if (axios.isAxiosError(error)) {
          if (error.response) {
            throw new Error(
              `API Error: ${error.response.status} - ${error.response.statusText}`
            );
          } else if (error.request) {
            throw new Error("Network Error: Unable to reach Morpho API");
          }
        }
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      // Retry up to 3 times, but not for 4xx errors
      if (failureCount < 3) {
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
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

export default useVaultsQuery;
