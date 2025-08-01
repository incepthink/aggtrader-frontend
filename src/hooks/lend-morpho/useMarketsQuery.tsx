import { useChain } from "@/context/ChainContext";
import { useQuery, UseQueryResult } from "@tanstack/react-query";
import axios, { AxiosResponse } from "axios";

const MORPHO_API_URL = "https://api.morpho.org/graphql";

export interface Asset {
  address: string;
  symbol: string;
  decimals: number;
}

export interface MarketReward {
  asset: Asset;
  supplyApr: number;
  borrowApr: number;
}

export interface MarketState {
  borrowApy: number;
  supplyApy: number;
  netBorrowApy: number;
  netSupplyApy: number;
  borrowAssets: string;
  borrowAssetsUsd: number;
  supplyAssets: string;
  supplyAssetsUsd: number;
  collateralAssets: string;
  collateralAssetsUsd: number;
  liquidityAssets: string;
  liquidityAssetsUsd: number;
  utilization: number;
  fee: number;
  rewards: MarketReward[];
}

export interface OracleInfo {
  type: string;
}

export interface Oracle {
  address: string;
  type: string;
}

export interface SupplyingVault {
  address: string;
  symbol: string;
  metadata?: {
    description: string;
  };
}

export interface Warning {
  type: string;
  level: "YELLOW" | "RED";
}

export interface Market {
  uniqueKey: string;
  whitelisted: boolean;
  lltv: number;
  oracleAddress: string;
  irmAddress: string;
  loanAsset: Asset;
  collateralAsset: Asset;
  state: MarketState;
  oracle: Oracle;
  oracleInfo: OracleInfo;
  supplyingVaults: SupplyingVault[];
  warnings: Warning[];
}

export interface MarketsQueryResponse {
  markets: {
    items: Market[];
    pageInfo: {
      count: number;
      countTotal: number;
    };
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

export interface MarketsQueryOptions {
  limit?: number;
  skip?: number;
  whitelistedOnly?: boolean;
  orderBy?: "SupplyAssetsUsd" | "BorrowAssetsUsd" | "Lltv";
  orderDirection?: "Asc" | "Desc";
}

/**
 * Custom hook to fetch markets data from Morpho GraphQL API
 * @param options - Query options
 * @returns Query result object with type safety
 */
export const useMarketsQuery = (
  options: MarketsQueryOptions = {}
): UseQueryResult<Market[], Error> => {
  const {
    limit = 100,
    skip = 0,
    whitelistedOnly = true, // Default to true to filter spam markets
    orderBy = "SupplyAssetsUsd",
    orderDirection = "Desc",
  } = options;

  const { chainId } = useChain(); // Get chainId from context

  // Comprehensive GraphQL query for markets data
  const query = `
    query GetMarkets($first: Int!, $skip: Int!, $where: MarketFilters!, $orderBy: MarketOrderBy!, $orderDirection: OrderDirection!) {
      markets(
        first: $first
        skip: $skip
        orderBy: $orderBy
        orderDirection: $orderDirection
        where: $where
      ) {
        pageInfo {
          count
          countTotal
        }
        items {
          uniqueKey
          whitelisted
          lltv
          oracleAddress
          irmAddress
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
          state {
            borrowApy
            supplyApy
            netBorrowApy
            netSupplyApy
            borrowAssets
            borrowAssetsUsd
            supplyAssets
            supplyAssetsUsd
            collateralAssets
            collateralAssetsUsd
            liquidityAssets
            liquidityAssetsUsd
            utilization
            fee
            rewards {
              asset {
                address
                symbol
                decimals
              }
              supplyApr
              borrowApr
            }
          }
          oracle {
            address
            type
          }
          oracleInfo {
            type
          }
          supplyingVaults {
            address
            symbol
            metadata {
              description
            }
          }
          warnings {
            type
            level
          }
        }
      }
    }
  `;

  return useQuery<Market[], Error>({
    queryKey: [
      "morpho-markets",
      { limit, skip, chainId, whitelistedOnly, orderBy, orderDirection },
    ],
    queryFn: async (): Promise<Market[]> => {
      try {
        // Build where clause based on options
        const whereClause: any = {
          chainId_in: chainId,
        };

        // Add whitelisted filter - null gets all markets, true gets only whitelisted
        if (whitelistedOnly) {
          whereClause.whitelisted = true;
        } else {
          whereClause.whitelisted = null;
        }

        const response: AxiosResponse<GraphQLResponse<MarketsQueryResponse>> =
          await axios({
            url: MORPHO_API_URL,
            method: "POST",
            data: {
              query,
              variables: {
                first: limit,
                skip: skip,
                where: whereClause,
                orderBy,
                orderDirection,
              },
            },
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            timeout: 10000, // 10 second timeout
          });

        // Check for GraphQL errors
        if (response.data.errors && response.data.errors.length > 0) {
          throw new Error(`GraphQL Error: ${response.data.errors[0].message}`);
        }

        // Check if data exists
        if (!response.data.data || !response.data.data.markets) {
          throw new Error("No markets data received from API");
        }

        console.log("MARKETS::", response.data.data.markets);

        return response.data.data.markets.items;
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

export default useMarketsQuery;
