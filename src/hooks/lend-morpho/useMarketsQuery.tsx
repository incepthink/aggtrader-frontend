import { useChain } from "@/context/ChainContext";
import { useQuery, UseQueryResult } from "@tanstack/react-query";
import axios, { AxiosResponse } from "axios";

const MORPHO_API_URL = "https://api.morpho.org/graphql";

export interface Asset {
  address: string;
  symbol: string;
  decimals: number;
  logoURI: string;
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
    limit = 20, // Reduced from 100 to 20 to lower complexity
    skip = 0,
    whitelistedOnly = true,
    orderBy = "SupplyAssetsUsd",
    orderDirection = "Desc",
  } = options;

  const { chainId } = useChain();

  // Optimized GraphQL query - only fetching fields used in MarketRow
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
          lltv
          loanAsset {
            symbol
            logoURI
            priceUsd
          }
          collateralAsset {
            symbol
            logoURI
          }
          state {
            borrowApy
            supplyAssetsUsd
            liquidityAssetsUsd
            rewards {
              borrowApr
              supplyApr
              asset {
                symbol
                logoURI
              }
            }
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
        const whereClause: any = {
          chainId_in: chainId,
        };

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
            timeout: 10000,
          });

        if (response.data.errors && response.data.errors.length > 0) {
          throw new Error(`GraphQL Error: ${response.data.errors[0].message}`);
        }

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
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      if (failureCount < 3) {
        const axiosError = error as any;
        if (
          axiosError?.response?.status >= 400 &&
          axiosError?.response?.status < 500
        ) {
          return false;
        }
        return true;
      }
      return false;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

export default useMarketsQuery;
