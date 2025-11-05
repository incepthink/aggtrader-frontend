// hooks/sushiswap/useKatanaPools.ts

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { BACKEND_URL } from '@/utils/constants';

interface Pool {
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

interface PoolsResponse {
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

export function useKatanaPools() {
  const fetchPools = async (): Promise<PoolsResponse> => {
    const url = `${BACKEND_URL}/platform/pools/katana`;
    console.log('[useKatanaPools] Fetching from:', url);
    
    const { data } = await axios.get<PoolsResponse>(url);
    console.log('[useKatanaPools] Response:', {
      pools: data.data.pools.length,
      chain: data.chain,
      cached: data.cached,
    });
    
    return data;
  };

  return useQuery({
    queryKey: ['katana-pools'],
    queryFn: fetchPools,
    staleTime: 60000, // 1 minute
    refetchInterval: 300000, // 5 minutes
  });
}