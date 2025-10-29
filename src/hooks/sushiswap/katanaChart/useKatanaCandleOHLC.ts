import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { TimeframeOption } from '@/components/spot/chart/katana/chartHeader/types';
import { BACKEND_URL } from '@/utils/constants';

interface Candle {
  timestamp: number; // milliseconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface CandleResponse {
  status: string;
  data: {
    candles: Candle[];
    metadata: {
      token: any;
      pool: any;
      poolToken0: any;
      poolToken1: any;
      isToken0: boolean;
      totalCandles: number;
      timeframe: string;
      timeRange: {
        start: number;
        end: number;
        days: number;
      };
      totalValueLockedUSD?: number;
      volumeUSD?: number;
    };
  };
  count: number;
  poolId: string;
  chain: string;
}

interface UseKatanaCandleOHLCProps {
  tokenAddress: string;
  timeframe?: TimeframeOption;
  days: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
  enabled?: boolean;
}

export function useKatanaCandleOHLC({
  tokenAddress,
  timeframe: initialTimeframe = '1h',
  days,
  autoRefresh = false,
  refreshInterval = 300000,
  enabled = true,
}: UseKatanaCandleOHLCProps) {
  const [timeframe, setTimeframe] = useState<TimeframeOption>(initialTimeframe);
  const [isProcessingTimeframe, setIsProcessingTimeframe] = useState(false);

  const fetchCandles = async (): Promise<CandleResponse> => {
    const url = `${BACKEND_URL}/api/ohlc/katana/pool?tokenAddress=${tokenAddress}&days=${days}&timeframe=${timeframe}`;
    
    console.log('[useKatanaCandleOHLC] Fetching from:', url);
    
    const { data } = await axios.get<CandleResponse>(url);
    
    console.log('[useKatanaCandleOHLC] Response:', {
      candles: data.data.candles.length,
      timeframe: data.data.metadata.timeframe,
      poolId: data.poolId,
    });
    
    return data;
  };

  const query = useQuery({
    queryKey: ['katana-candles', tokenAddress, days, timeframe],
    queryFn: fetchCandles,
    enabled: enabled && !!tokenAddress,
    refetchInterval: autoRefresh ? refreshInterval : false,
    staleTime: refreshInterval,
  });

  const changeTimeframe = async (newTimeframe: TimeframeOption) => {
    if (newTimeframe === timeframe) return;
    
    setIsProcessingTimeframe(true);
    setTimeframe(newTimeframe);
    
    // Wait a bit for the query to refetch
    setTimeout(() => {
      setIsProcessingTimeframe(false);
    }, 500);
  };

  return {
    data: query.data?.data || null,
    candles: query.data?.data.candles || [],
    isLoading: query.isLoading,
    error: query.error ? String(query.error) : null,
    refetch: query.refetch,
    isSupported: true,
    currentTimeframe: timeframe,
    changeTimeframe,
    isProcessingTimeframe: isProcessingTimeframe || query.isFetching,
  };
}