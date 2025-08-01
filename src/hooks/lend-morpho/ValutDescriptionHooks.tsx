import { useChain } from "@/context/ChainContext";
import { useQuery, UseQueryResult } from "@tanstack/react-query";
import axios, { AxiosResponse } from "axios";

const MORPHO_API_URL = "https://api.morpho.org/graphql";

// Type definitions for vault detail
export interface Asset {
  id: string;
  address: string;
  symbol: string;
  name: string;
  decimals: number;
}

export interface AssetYield {
  apr: number;
}

export interface VaultAsset extends Asset {
  yield: AssetYield;
}

export interface Curator {
  image: string;
  name: string;
  url: string;
}

export interface VaultMetadata {
  description: string;
  forumLink: string;
  image: string;
  curators: Curator[];
}

export interface Allocator {
  address: string;
}

export interface RewardAsset {
  address: string;
  symbol: string;
  name: string;
}

export interface Reward {
  asset: RewardAsset;
  supplyApr: number;
  yearlySupplyTokens: number;
}

export interface MarketReward {
  asset: RewardAsset;
  supplyApr: number;
  borrowApr: number;
}

export interface MarketState {
  supplyAssets: string;
  borrowAssets: string;
  borrowApy: number;
  supplyApy: number;
  utilization: number;
  rewards: MarketReward[];
}

export interface LoanAsset {
  name: string;
  symbol: string;
  address: string;
}

export interface CollateralAsset {
  name: string;
  symbol: string;
  address: string;
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
  supplyQueueIndex: number;
  withdrawQueueIndex: number;
  supplyCap: string;
  supplyAssets: string;
  supplyAssetsUsd: number;
  market: Market;
}

export interface Warning {
  type: string;
  level: "YELLOW" | "RED";
}

export interface VaultState {
  // Key Metrics
  totalAssets: string;
  totalAssetsUsd: number;
  totalSupply: string;
  sharePrice: string;
  sharePriceUsd: number;

  // APY Data
  apy: number;
  netApy: number;
  netApyWithoutRewards: number;
  dailyApy: number;
  dailyNetApy: number;
  weeklyApy: number;
  weeklyNetApy: number;
  monthlyApy: number;
  monthlyNetApy: number;

  // Governance
  owner: string;
  curator: string;
  guardian: string;
  timelock: string;
  fee: number;

  // Rewards & Allocations
  rewards: Reward[];
  allocation: Allocation[];
}

export interface VaultDetail {
  address: string;
  name: string;
  symbol: string;
  whitelisted: boolean;
  asset: VaultAsset;
  metadata: VaultMetadata;
  allocators: Allocator[];
  state: VaultState;
  warnings: Warning[];
}

export interface HistoricalDataPoint {
  x: number; // timestamp
  y: number; // value
}

export interface HistoricalState {
  apy: HistoricalDataPoint[];
  netApy: HistoricalDataPoint[];
  totalAssetsUsd: HistoricalDataPoint[];
}

export interface VaultWithHistory extends VaultDetail {
  historicalState?: HistoricalState;
}

export interface VaultPosition {
  user: {
    address: string;
  };
  state: {
    shares: string;
    assets: string;
    assetsUsd: number;
  };
}

export interface Transaction {
  hash: string;
  timestamp: number;
  type: string;
  blockNumber: number;
  user: {
    address: string;
  };
  data?: {
    shares?: string;
    assets?: string;
    vault?: {
      address: string;
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

export interface VaultDetailQueryResponse {
  vaultByAddress: VaultDetail;
}

export interface VaultHistoricalQueryResponse {
  vaultByAddress: {
    address: string;
    historicalState: HistoricalState;
  };
}

export interface VaultPositionsQueryResponse {
  vaultPositions: {
    items: VaultPosition[];
  };
}

export interface VaultTransactionsQueryResponse {
  transactions: {
    items: Transaction[];
  };
}

export interface TimeseriesOptions {
  startTimestamp: number;
  endTimestamp: number;
  interval: "DAY" | "HOUR" | "WEEK" | "MONTH";
}

/**
 * Hook to fetch detailed vault information
 */
export const useVaultDetail = (
  address: string
): UseQueryResult<VaultDetail, Error> => {
  const { chainId } = useChain(); // Get chainId from context

  const query = `
    query GetVaultDetails($address: String!, $chainId: Int!) {
      vaultByAddress(address: $address, chainId: $chainId) {
        address
        name
        symbol
        whitelisted
        asset {
          id
          address
          symbol
          name
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
          totalAssets
          totalAssetsUsd
          totalSupply
          sharePrice
          sharePriceUsd
          apy
          netApy
          netApyWithoutRewards
          dailyApy
          dailyNetApy
          weeklyApy
          weeklyNetApy
          monthlyApy
          monthlyNetApy
          owner
          curator
          guardian
          timelock
          fee
          rewards {
            asset {
              address
              symbol
              name
            }
            supplyApr
            yearlySupplyTokens
          }
          allocation {
            supplyQueueIndex
            withdrawQueueIndex
            supplyCap
            supplyAssets
            supplyAssetsUsd
            market {
              uniqueKey
              loanAsset {
                name
                symbol
                address
              }
              collateralAsset {
                name
                symbol
                address
              }
              oracleAddress
              irmAddress
              lltv
              state {
                supplyAssets
                borrowAssets
                borrowApy
                supplyApy
                utilization
                rewards {
                  asset {
                    address
                    symbol
                  }
                  supplyApr
                  borrowApr
                }
              }
            }
          }
        }
        warnings {
          type
          level
        }
      }
    }
  `;

  return useQuery<VaultDetail, Error>({
    queryKey: ["vault-detail", address, chainId],
    queryFn: async (): Promise<VaultDetail> => {
      try {
        const response: AxiosResponse<
          GraphQLResponse<VaultDetailQueryResponse>
        > = await axios({
          url: MORPHO_API_URL,
          method: "POST",
          data: {
            query,
            variables: {
              address,
              chainId,
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

        if (!response.data.data?.vaultByAddress) {
          throw new Error("Vault not found");
        }

        return response.data.data.vaultByAddress;
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
    enabled: !!address,
    staleTime: 30 * 1000, // 30 seconds for real-time data
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
};

/**
 * Hook to fetch historical vault performance data
 */
export const useVaultHistorical = (
  address: string,
  options: TimeseriesOptions
): UseQueryResult<HistoricalState, Error> => {
  const { chainId } = useChain(); // Get chainId from context

  const query = `
    query GetVaultHistoricalAPY($address: String!, $chainId: Int!, $options: TimeseriesOptions) {
      vaultByAddress(address: $address, chainId: $chainId) {
        address
        historicalState {
          apy(options: $options) {
            x
            y
          }
          netApy(options: $options) {
            x
            y
          }
          totalAssetsUsd(options: $options) {
            x
            y
          }
        }
      }
    }
  `;

  return useQuery<HistoricalState, Error>({
    queryKey: ["vault-historical", address, chainId, options],
    queryFn: async (): Promise<HistoricalState> => {
      try {
        const response: AxiosResponse<
          GraphQLResponse<VaultHistoricalQueryResponse>
        > = await axios({
          url: MORPHO_API_URL,
          method: "POST",
          data: {
            query,
            variables: {
              address,
              chainId,
              options,
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

        return (
          response.data.data?.vaultByAddress?.historicalState || {
            apy: [],
            netApy: [],
            totalAssetsUsd: [],
          }
        );
      } catch (error) {
        if (axios.isAxiosError(error)) {
          if (error.response) {
            throw new Error(
              `API Error: ${error.response.status} - ${error.response.statusText}`
            );
          }
        }
        throw error;
      }
    },
    enabled: !!address && !!options,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
};

/**
 * Hook to fetch vault depositors/positions
 */
export const useVaultPositions = (
  vaultAddress: string,
  limit: number = 10
): UseQueryResult<VaultPosition[], Error> => {
  const query = `
    query GetVaultDepositors($vaultAddress: String!, $limit: Int!) {
      vaultPositions(
        first: $limit
        orderBy: Shares
        orderDirection: Desc
        where: { vaultAddress_in: [$vaultAddress] }
      ) {
        items {
          user {
            address
          }
          state {
            shares
            assets
            assetsUsd
          }
        }
      }
    }
  `;

  return useQuery<VaultPosition[], Error>({
    queryKey: ["vault-positions", vaultAddress, limit],
    queryFn: async (): Promise<VaultPosition[]> => {
      try {
        const response: AxiosResponse<
          GraphQLResponse<VaultPositionsQueryResponse>
        > = await axios({
          url: MORPHO_API_URL,
          method: "POST",
          data: {
            query,
            variables: {
              vaultAddress,
              limit,
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

        return response.data.data?.vaultPositions?.items || [];
      } catch (error) {
        if (axios.isAxiosError(error)) {
          if (error.response) {
            throw new Error(
              `API Error: ${error.response.status} - ${error.response.statusText}`
            );
          }
        }
        throw error;
      }
    },
    enabled: !!vaultAddress,
    staleTime: 60 * 1000, // 1 minute
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

/**
 * Hook to fetch vault transaction history
 */
export const useVaultTransactions = (
  vaultAddress: string,
  limit: number = 50
): UseQueryResult<Transaction[], Error> => {
  const query = `
    query GetVaultTransactions($vaultAddress: String!, $limit: Int!) {
      transactions(
        first: $limit
        orderBy: Timestamp
        orderDirection: Desc
        where: { vaultAddress_in: [$vaultAddress] }
      ) {
        items {
          hash
          timestamp
          type
          blockNumber
          user {
            address
          }
          data {
            ... on VaultTransactionData {
              shares
              assets
              vault {
                address
              }
            }
          }
        }
      }
    }
  `;

  return useQuery<Transaction[], Error>({
    queryKey: ["vault-transactions", vaultAddress, limit],
    queryFn: async (): Promise<Transaction[]> => {
      try {
        const response: AxiosResponse<
          GraphQLResponse<VaultTransactionsQueryResponse>
        > = await axios({
          url: MORPHO_API_URL,
          method: "POST",
          data: {
            query,
            variables: {
              vaultAddress,
              limit,
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

        return response.data.data?.transactions?.items || [];
      } catch (error) {
        if (axios.isAxiosError(error)) {
          if (error.response) {
            throw new Error(
              `API Error: ${error.response.status} - ${error.response.statusText}`
            );
          }
        }
        throw error;
      }
    },
    enabled: !!vaultAddress,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};

export default useVaultDetail;
