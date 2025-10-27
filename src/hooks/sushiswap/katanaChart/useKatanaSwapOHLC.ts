import { useState, useEffect, useCallback } from 'react';
import { CandlestickData, UTCTimestamp } from 'lightweight-charts';
import { BACKEND_URL } from '@/utils/constants';

// Types
export type TimeframeOption = '1m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1d' | '1w';

interface SwapData {
  id: string;
  timestamp: number;
  tokenPriceUSD: number;
  tokenVolumeUSD: number;
  totalVolumeUSD: number;
  pool: {
    id: string;
    token0: any;
    token1: any;
  };
}

interface SwapResponse {
  swaps: SwapData[];
  metadata: {
    token: {
      address: string;
      name: string;
      symbol: string;
      decimals: string;
    };
    pool: {
      id: string;
      address: string;
      token0: any;
      token1: any;
      feeTier: string;
      totalValueLockedUSD: number;
      volumeUSD: number;
    };
    isToken0: boolean;
    quoteToken: any;
    totalSwaps: number;
    timeRange: {
      start: number;
      end: number;
      days: number;
    };
    chain: string;
    dexId: string;
  };
}

interface ApiResponse {
  status: string;
  data: SwapResponse;
  source: string;
  cached: boolean;
  tokenAddress: string;
  count: number;
  poolId: string;
  poolTVL: string;
  chain: string;
}

interface UseKatanaSwapOHLCProps {
  tokenAddress: string;
  resolution: 'hour' | 'day';
  days: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
  enabled?: boolean;
}

interface OHLCData {
  chart: CandlestickData[];
  metadata: {
    totalValueLockedUSD: number;
    volumeUSD: number;
    poolCount: number;
    txCount: number;
    priceUSD: number;
    currency: string;
    dataSource: string;
    chain: string;
    dexId: string;
    poolToken0?: string;
    poolToken1?: string;
  };
  // New timeframe-specific metrics
  timeframeMetrics: {
    priceChange: {
      absolute: number;
      percentage: number;
    };
    volumeChange: {
      absolute: number;
      percentage: number;
    };
    totalVolume: number;
    avgPrice: number;
    timeframe: TimeframeOption;
  };
}

// OHLC Utils (matching the original structure)
export const katanaOHLCUtils = {
  formatPrice: (price: number): string => {
    if (price === 0) return '0.00';
    if (price < 0.01) return price.toFixed(6);
    if (price < 1) return price.toFixed(4);
    if (price < 100) return price.toFixed(2);
    return price.toFixed(2);
  },
};

/**
 * Convert timeframe string to minutes
 */
function getTimeframeMinutes(timeframe: TimeframeOption): number {
  switch (timeframe) {
    case '1m':
      return 1;
    case '5m':
      return 5;
    case '15m':
      return 15;
    case '30m':
      return 30;
    case '1h':
      return 60;
    case '4h':
      return 240;
    case '1d':
      return 1440; // 24 * 60
    case '1w':
      return 10080; // 7 * 24 * 60
    default:
      return 60;
  }
}

/**
 * Group swaps by time windows and generate OHLC with price continuity
 */
function generateOHLCFromSwaps(swaps: SwapData[], timeframeMinutes: number): CandlestickData[] {
  if (!swaps || swaps.length === 0) {
    console.log('No swaps data to process');
    return [];
  }

  console.log(`Generating OHLC from ${swaps.length} swaps with ${timeframeMinutes}min timeframe`);

  const timeframeMs = timeframeMinutes * 60 * 1000;
  const groupedSwaps = new Map<number, SwapData[]>();

  // Group swaps by time windows
  for (const swap of swaps) {
    const windowStart = Math.floor(swap.timestamp / timeframeMs) * timeframeMs;
    
    if (!groupedSwaps.has(windowStart)) {
      groupedSwaps.set(windowStart, []);
    }
    groupedSwaps.get(windowStart)!.push(swap);
  }

  console.log(`Grouped swaps into ${groupedSwaps.size} time windows`);

  // Sort time windows to process in chronological order
  const sortedWindows = Array.from(groupedSwaps.entries()).sort((a, b) => a[0] - b[0]);

  // Convert each window to OHLC - NO PRICE CONTINUITY (like DexScreener)
  const ohlcData: CandlestickData[] = [];

  for (const [windowStart, windowSwaps] of sortedWindows) {
    // Sort swaps by timestamp within the window
    windowSwaps.sort((a, b) => a.timestamp - b.timestamp);

    const prices = windowSwaps
      .map(swap => swap.tokenPriceUSD)
      .filter(price => price > 0);

    if (prices.length === 0) continue;

    // Use ACTUAL first trade as open (not previous close)
    const openPrice = prices[0];              // First trade in window
    const closePrice = prices[prices.length - 1]; // Last trade in window
    const highPrice = Math.max(...prices);       // Highest price in window
    const lowPrice = Math.min(...prices);        // Lowest price in window

    const ohlcPoint: CandlestickData = {
      time: Math.floor(windowStart / 1000) as UTCTimestamp, // Convert to seconds
      open: openPrice,
      high: highPrice,
      low: lowPrice,
      close: closePrice,
    };

    ohlcData.push(ohlcPoint);
  }

  // Sort by timestamp (should already be sorted, but ensure it)
  ohlcData.sort((a, b) => (a.time as number) - (b.time as number));

  console.log(`Generated ${ohlcData.length} OHLC points (no artificial continuity)`);
  
  if (ohlcData.length > 0) {
    console.log('First OHLC point:', ohlcData[0]);
    console.log('Last OHLC point:', ohlcData[ohlcData.length - 1]);
  }

  return ohlcData;
}

/**
 * Calculate timeframe-specific metrics (price change, volume change) - FIXED VERSION
 * Now properly filters to ONLY the selected timeframe window from NOW backwards
 */
function calculateTimeframeMetrics(
  swaps: SwapData[], 
  ohlcData: CandlestickData[],
  timeframe: TimeframeOption
): {
  priceChange: {
    absolute: number;
    percentage: number;
  };
  volumeChange: {
    absolute: number;
    percentage: number;
  };
  totalVolume: number;
  avgPrice: number;
} {
  if (!swaps || swaps.length === 0 || !ohlcData || ohlcData.length === 0) {
    return {
      priceChange: { absolute: 0, percentage: 0 },
      volumeChange: { absolute: 0, percentage: 0 },
      totalVolume: 0,
      avgPrice: 0,
    };
  }

  console.log(`[Metrics] Calculating for timeframe: ${timeframe}`);

  // Get timeframe duration in milliseconds
  const timeframeMinutes = getTimeframeMinutes(timeframe);
  const timeframeMs = timeframeMinutes * 60 * 1000;

  // Get the most recent candle's timestamp
  const lastCandle = ohlcData[ohlcData.length - 1];
  const currentTime = (lastCandle.time as number) * 1000; // Convert to milliseconds

  // Calculate the start time for the selected timeframe window
  const timeframeStartTime = currentTime - timeframeMs;

  console.log(`[Metrics] Timeframe window:`, {
    timeframe,
    currentTime: new Date(currentTime).toISOString(),
    timeframeStartTime: new Date(timeframeStartTime).toISOString(),
    durationMs: timeframeMs,
  });

  // Filter OHLC data to ONLY the selected timeframe period
  const timeframeOHLC = ohlcData.filter(candle => {
    const candleTime = (candle.time as number) * 1000;
    return candleTime >= timeframeStartTime && candleTime <= currentTime;
  });

  console.log(`[Metrics] Filtered OHLC:`, {
    totalCandles: ohlcData.length,
    timeframeCandles: timeframeOHLC.length,
  });

  if (timeframeOHLC.length === 0) {
    console.warn('[Metrics] No OHLC data in timeframe window');
    return {
      priceChange: { absolute: 0, percentage: 0 },
      volumeChange: { absolute: 0, percentage: 0 },
      totalVolume: 0,
      avgPrice: lastCandle.close,
    };
  }

  // --- PRICE CHANGE CALCULATION ---
  const firstCandle = timeframeOHLC[0];
  const lastCandleInWindow = timeframeOHLC[timeframeOHLC.length - 1];
  
  const startPrice = firstCandle.open;
  const endPrice = lastCandleInWindow.close;
  
  const priceAbsolute = endPrice - startPrice;
  const pricePercentage = startPrice > 0 ? (priceAbsolute / startPrice) * 100 : 0;

  console.log(`[Metrics] Price change:`, {
    startPrice,
    endPrice,
    absolute: priceAbsolute,
    percentage: pricePercentage,
  });

  // --- VOLUME CALCULATION ---
  // Filter swaps to ONLY the current timeframe period
  const currentPeriodSwaps = swaps.filter(swap => 
    swap.timestamp >= timeframeStartTime && swap.timestamp <= currentTime
  );

  const currentVolume = currentPeriodSwaps.reduce((sum, swap) => sum + swap.tokenVolumeUSD, 0);

  console.log(`[Metrics] Current period volume:`, {
    swaps: currentPeriodSwaps.length,
    volume: currentVolume,
  });

  // --- VOLUME CHANGE CALCULATION ---
  // Compare with the PREVIOUS timeframe period
  const previousPeriodStartTime = timeframeStartTime - timeframeMs;
  const previousPeriodEndTime = timeframeStartTime;

  const previousPeriodSwaps = swaps.filter(swap => 
    swap.timestamp >= previousPeriodStartTime && swap.timestamp < previousPeriodEndTime
  );

  const previousVolume = previousPeriodSwaps.reduce((sum, swap) => sum + swap.tokenVolumeUSD, 0);

  const volumeAbsolute = currentVolume - previousVolume;
  const volumePercentage = previousVolume > 0 ? (volumeAbsolute / previousVolume) * 100 : 0;

  console.log(`[Metrics] Volume change:`, {
    previousPeriod: {
      start: new Date(previousPeriodStartTime).toISOString(),
      end: new Date(previousPeriodEndTime).toISOString(),
      swaps: previousPeriodSwaps.length,
      volume: previousVolume,
    },
    currentPeriod: {
      start: new Date(timeframeStartTime).toISOString(),
      end: new Date(currentTime).toISOString(),
      swaps: currentPeriodSwaps.length,
      volume: currentVolume,
    },
    change: {
      absolute: volumeAbsolute,
      percentage: volumePercentage,
    },
  });

  // --- AVERAGE PRICE CALCULATION ---
  let totalWeightedPrice = 0;
  let totalVolumeForAvg = 0;
  
  for (const swap of currentPeriodSwaps) {
    if (swap.tokenVolumeUSD > 0) {
      totalWeightedPrice += swap.tokenPriceUSD * swap.tokenVolumeUSD;
      totalVolumeForAvg += swap.tokenVolumeUSD;
    }
  }
  
  const avgPrice = totalVolumeForAvg > 0 ? totalWeightedPrice / totalVolumeForAvg : endPrice;

  const result = {
    priceChange: {
      absolute: priceAbsolute,
      percentage: pricePercentage,
    },
    volumeChange: {
      absolute: volumeAbsolute,
      percentage: volumePercentage,
    },
    totalVolume: currentVolume,
    avgPrice: avgPrice,
  };

  console.log(`[Metrics] Final result:`, result);

  return result;
}

/**
 * Fill gaps in OHLC data with previous close price
 */
function fillOHLCGaps(ohlcData: CandlestickData[], timeframeMinutes: number): CandlestickData[] {
  if (ohlcData.length <= 1) return ohlcData;

  const filled: CandlestickData[] = [];
  const timeframeSeconds = timeframeMinutes * 60;

  for (let i = 0; i < ohlcData.length; i++) {
    const current = ohlcData[i];
    
    if (i > 0) {
      const previous = filled[filled.length - 1];
      const expectedTime = (previous.time as number) + timeframeSeconds;
      
      // Fill gaps between candles (but limit to prevent too many gap fills)
      let gapTime = expectedTime;
      let gapCount = 0;
      const maxGaps = 100; // Prevent excessive gap filling
      
      while (gapTime < (current.time as number) && gapCount < maxGaps) {
        filled.push({
          time: gapTime as UTCTimestamp,
          open: previous.close,
          high: previous.close,
          low: previous.close,
          close: previous.close,
        });
        gapTime += timeframeSeconds;
        gapCount++;
      }
    }
    
    filled.push(current);
  }

  console.log(`Filled gaps: ${ohlcData.length} -> ${filled.length} OHLC points`);
  return filled;
}

/**
 * Hook to fetch swap data and convert to OHLC with dynamic timeframe support
 */
export function useKatanaSwapOHLC({
  tokenAddress,
  resolution = 'hour',
  days = 30,
  autoRefresh = false,
  refreshInterval = 300000, // 5 minutes
  enabled = true,
}: UseKatanaSwapOHLCProps) {
  const [rawSwapData, setRawSwapData] = useState<SwapResponse | null>(null);
  const [data, setData] = useState<OHLCData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState<boolean>(true);
  const [isProcessingTimeframe, setIsProcessingTimeframe] = useState<boolean>(false);
  const [currentTimeframe, setCurrentTimeframe] = useState<TimeframeOption>('1h');

  console.log('useKatanaSwapOHLC:', { tokenAddress, resolution, days, enabled });

  // Fetch function for raw swap data
  const fetchSwapData = useCallback(async () => {
    if (!enabled || !tokenAddress) {
      console.log('Fetch disabled or no token address');
      return;
    }

    console.log('Fetching swap data for token:', tokenAddress);
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        tokenAddress: tokenAddress,
        days: days.toString(),
        force: "true"
      });

      const response = await fetch(`${BACKEND_URL}/api/ohlc/katana/pool?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });


      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ApiResponse = await response.json();
      
      if (result.status !== 'success') {
        throw new Error(result.data as any || 'Failed to fetch swap data');
      }

      console.log('Swap data fetched successfully:', {
        swapsCount: result.data.swaps.length,
        poolTVL: result.poolTVL,
        token: result.data.metadata.token.symbol,
      });

      setRawSwapData(result.data);
      setIsSupported(true);
    } catch (err: any) {
      console.error('Error fetching swap data:', err);
      setError(err.message || 'Failed to fetch swap data');
      setIsSupported(false);
      setRawSwapData(null);
    } finally {
      setIsLoading(false);
    }
  }, [tokenAddress, days, enabled]);

  // Process OHLC data from raw swaps when timeframe changes
  const processOHLCData = useCallback(async (timeframe: TimeframeOption) => {
    if (!rawSwapData?.swaps) {
      console.log('No raw swap data available for processing');
      return;
    }

    console.log(`Processing OHLC data for timeframe: ${timeframe}`);
    setIsProcessingTimeframe(true);

    // Add small delay to show spinner for user feedback
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      console.log("RAW SWAP", rawSwapData);
      
      const timeframeMinutes = getTimeframeMinutes(timeframe);
      const ohlcChart = generateOHLCFromSwaps(rawSwapData.swaps, timeframeMinutes);
      
      // Fill gaps for better chart continuity - enable for all timeframes to ensure continuity
      const shouldFillGaps = false; // Enable gap filling for continuous charts
      const filledChart = shouldFillGaps ? fillOHLCGaps(ohlcChart, timeframeMinutes) : ohlcChart;

      // Calculate timeframe-specific metrics - NOW FIXED TO USE EXACT TIMEFRAME WINDOW
      const timeframeMetrics = calculateTimeframeMetrics(
        rawSwapData.swaps, 
        filledChart,
        timeframe
      );

      // Calculate metadata
      const lastPrice = filledChart.length > 0 ? filledChart[filledChart.length - 1].close : 0;
      
      const ohlcData: OHLCData = {
        chart: filledChart,
        metadata: {
          totalValueLockedUSD: rawSwapData.metadata.pool.totalValueLockedUSD,
          volumeUSD: rawSwapData.metadata.pool.volumeUSD,
          poolCount: 1,
          poolToken0: rawSwapData.metadata.pool.token0,
          poolToken1: rawSwapData.metadata.pool.token1,
          txCount: rawSwapData.metadata.totalSwaps,
          priceUSD: lastPrice,
          currency: 'USD',
          dataSource: 'subgraph-swaps',
          chain: 'katana',
          dexId: 'katana-sushiswap',
        },
        timeframeMetrics: {
          ...timeframeMetrics,
          timeframe,
        },
      };

      setData(ohlcData);
      setCurrentTimeframe(timeframe);
    } catch (err: any) {
      console.error('Error processing OHLC data:', err);
      setError(err.message || 'Failed to process OHLC data');
    } finally {
      setIsProcessingTimeframe(false);
    }
  }, [rawSwapData]);

  // Reset data when token changes
  useEffect(() => {
    if (enabled && tokenAddress) {
      console.log('Token address changed, resetting data and fetching...');
      setRawSwapData(null);
      setData(null);
      setError(null);
      setIsSupported(true);
      setCurrentTimeframe('1h');
    }
  }, [tokenAddress, enabled]);

  // Initial fetch
  useEffect(() => {
    fetchSwapData();
  }, [fetchSwapData]);

  // Process initial OHLC when raw data is available
  useEffect(() => {
    if (rawSwapData && !data) {
      processOHLCData('1h'); // Default timeframe
    }
  }, [rawSwapData, data, processOHLCData]);

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh || !enabled) return;

    const interval = setInterval(() => {
      console.log('Auto refreshing swap data...');
      fetchSwapData();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, enabled, refreshInterval, fetchSwapData]);

  // Manual refetch function
  const refetch = useCallback(() => {
    console.log('Manual refetch requested');
    return fetchSwapData();
  }, [fetchSwapData]);

  // Change timeframe function
  const changeTimeframe = useCallback((timeframe: TimeframeOption) => {
    if (timeframe !== currentTimeframe && !isProcessingTimeframe && rawSwapData) {
      console.log(`Changing timeframe to: ${timeframe}`);
      processOHLCData(timeframe);
    }
  }, [currentTimeframe, isProcessingTimeframe, processOHLCData, rawSwapData]);

  return {
    data,
    isLoading,
    error,
    refetch,
    isSupported,
    // New timeframe functionality
    currentTimeframe,
    changeTimeframe,
    isProcessingTimeframe,
  };
}

// Export the hook as default for backwards compatibility
export default useKatanaSwapOHLC;