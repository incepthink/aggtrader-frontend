// src/components/common/spot/pools/types.ts
export interface Pool {
  id: string;
  address: string;
  name: string;
  token0Address: string;
  token1Address: string;
  token0Symbol: string;
  token1Symbol: string;
  token0Name: string;
  token1Name: string;
  token0LogoUri: string | null;
  token1LogoUri: string | null;
  swapFee: number;
  protocol: 'SUSHISWAP_V3';
  chainId: number;
  liquidityUSD: number;
  volumeUSD1d: number;
  volumeUSD1w: number;
  txCount1d: number;
  liquidityUSDChange1d: number;
  volumeUSDChange1d: number;
  volumeUSDChange1w: number;
  totalApr1d: number;
}

export interface PoolsResponse {
  status: string;
  data: {
    pools: Pool[];
    count: number;
  };
  chain: string;
  timestamp: number;
  cached?: boolean;
  cacheAge?: number;
  filtered?: {
    totalFromSubgraph: number;
    afterFiltering: number;
    tradableTokensCount: number;
  };
}