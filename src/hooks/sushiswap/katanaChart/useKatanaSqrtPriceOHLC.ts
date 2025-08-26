import { useState, useEffect, useCallback } from 'react';
import { CandlestickData, UTCTimestamp } from 'lightweight-charts';
import { BACKEND_URL } from '@/utils/constants';

// Types
export type TimeframeOption = '1m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1d' | '1w';

interface SwapDataWithSqrt {
  id: string;
  timestamp: number;
  poolPrice: number; // Calculated from sqrtPriceX96
  tokenVolumeUSD: number;
  totalVolumeUSD: number;
  sqrtPriceX96: string;
  tick: number;
}

interface SwapResponse {
  swaps: SwapDataWithSqrt[];
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
      currentPoolPrice: number;
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
  currentPoolPrice: number;
  chain: string;
}

interface UseKatanaSqrtPriceOHLCProps {
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
    currentPoolPrice: number;
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
export const katanaSqrtPriceOHLCUtils = {
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
 * Group swaps by time windows and generate OHLC using sqrtPrice-based poolPrice
 */
function generateOHLCFromSqrtPriceSwaps(swaps: SwapDataWithSqrt[], timeframeMinutes: number): CandlestickData[] {
  if (!swaps || swaps.length === 0) {
    console.log('No sqrt price swaps data to process');
    return [];
  }

  console.log(`Generating OHLC from ${swaps.length} sqrt price swaps with ${timeframeMinutes}min timeframe`);

  const timeframeMs = timeframeMinutes * 60 * 1000;
  const groupedSwaps = new Map<number, SwapDataWithSqrt[]>();

  // Group swaps by time windows
  for (const swap of swaps) {
    const windowStart = Math.floor(swap.timestamp / timeframeMs) * timeframeMs;
    
    if (!groupedSwaps.has(windowStart)) {
      groupedSwaps.set(windowStart, []);
    }
    groupedSwaps.get(windowStart)!.push(swap);
  }

  console.log(`Grouped swaps into ${groupedSwaps.size} time windows`);

  // Convert each window to OHLC
  const ohlcData: CandlestickData[] = [];

  for (const [windowStart, windowSwaps] of groupedSwaps) {
    // Sort swaps by timestamp within the window
    windowSwaps.sort((a, b) => a.timestamp - b.timestamp);

    // Use poolPrice (calculated from sqrtPriceX96) instead of tokenPriceUSD
    const prices = windowSwaps
      .map(swap => swap.poolPrice)
      .filter(price => price > 0);

    if (prices.length === 0) continue;

    const ohlcPoint: CandlestickData = {
      time: Math.floor(windowStart / 1000) as UTCTimestamp, // Convert to seconds
      open: prices[0],                    // First pool price in window
      high: Math.max(...prices),          // Highest pool price in window
      low: Math.min(...prices),           // Lowest pool price in window
      close: prices[prices.length - 1],   // Last pool price in window
    };

    ohlcData.push(ohlcPoint);
  }

  // Sort by timestamp
  ohlcData.sort((a, b) => (a.time as number) - (b.time as number));

  console.log(`Generated ${ohlcData.length} OHLC points from sqrt prices`);
  
  if (ohlcData.length > 0) {
    console.log('First OHLC point:', ohlcData[0]);
    console.log('Last OHLC point:', ohlcData[ohlcData.length - 1]);
  }

  return ohlcData;
}

/**
 * Calculate timeframe-specific metrics using poolPrice instead of tokenPriceUSD
 */
function calculateTimeframeMetrics(
  swaps: SwapDataWithSqrt[], 
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

  console.log(`[SqrtPrice Metrics] Calculating for timeframe: ${timeframe}`);

  // Get the timeframe duration in milliseconds
  const timeframeMinutes = getTimeframeMinutes(timeframe);
  const timeframeMs = timeframeMinutes * 60 * 1000;

  // Calculate how many recent periods to include based on timeframe
  let periodsToInclude: number;
  switch (timeframe) {
    case '1m':
      periodsToInclude = Math.min(60, ohlcData.length); // Last 60 minutes
      break;
    case '5m':
      periodsToInclude = Math.min(48, ohlcData.length); // Last 4 hours (48 * 5min)
      break;
    case '15m':
      periodsToInclude = Math.min(32, ohlcData.length); // Last 8 hours (32 * 15min)
      break;
    case '30m':
      periodsToInclude = Math.min(48, ohlcData.length); // Last 24 hours (48 * 30min)
      break;
    case '1h':
      periodsToInclude = Math.min(24, ohlcData.length); // Last 24 hours
      break;
    case '4h':
      periodsToInclude = Math.min(42, ohlcData.length); // Last 7 days (42 * 4h)
      break;
    case '1d':
      periodsToInclude = Math.min(30, ohlcData.length); // Last 30 days
      break;
    case '1w':
      periodsToInclude = Math.min(12, ohlcData.length); // Last 12 weeks
      break;
    default:
      periodsToInclude = Math.min(24, ohlcData.length);
  }

  // Get the most recent OHLC data for this timeframe
  const recentOHLCData = ohlcData.slice(-periodsToInclude);
  
  console.log(`[SqrtPrice Metrics] Using recent data:`, {
    totalOHLCPoints: ohlcData.length,
    periodsToInclude,
    recentOHLCCount: recentOHLCData.length,
    timeframeMinutes,
  });

  // Get the most recent single timeframe period
  const lastOHLC = recentOHLCData[recentOHLCData.length - 1];
  const lastPeriodStart = (lastOHLC?.time as number) * 1000;
  const lastPeriodEnd = lastPeriodStart + timeframeMs;
  
  // Filter swaps for just the most recent single timeframe period
  const lastPeriodSwaps = swaps.filter(swap => 
    swap.timestamp >= lastPeriodStart && swap.timestamp < lastPeriodEnd
  );

  console.log(`[SqrtPrice Metrics] Filtered swaps for most recent ${timeframe} period:`, {
    originalCount: swaps.length,
    lastPeriodCount: lastPeriodSwaps.length,
    timeframeMinutes: timeframeMinutes
  });

  // Price change calculation from recent OHLC data
  const firstPrice = recentOHLCData[0]?.open || 0;
  const lastPrice = recentOHLCData[recentOHLCData.length - 1]?.close || 0;
  
  const priceAbsolute = lastPrice - firstPrice;
  const pricePercentage = firstPrice > 0 ? (priceAbsolute / firstPrice) * 100 : 0;

  // Calculate total volume for just the most recent single timeframe period
  const totalVolume = lastPeriodSwaps.reduce((sum, swap) => sum + swap.tokenVolumeUSD, 0);

  // Volume change calculation - compare current single timeframe with previous single timeframe
  let volumeAbsolute = 0;
  let volumePercentage = 0;

  if (recentOHLCData.length >= 2) {
    const previousOHLC = recentOHLCData[recentOHLCData.length - 2];
    const previousPeriodStart = (previousOHLC.time as number) * 1000;
    const previousPeriodEnd = previousPeriodStart + timeframeMs;
    
    const previousPeriodSwaps = swaps.filter(swap => 
      swap.timestamp >= previousPeriodStart && swap.timestamp < previousPeriodEnd
    );
    
    const previousPeriodVolume = previousPeriodSwaps.reduce((sum, swap) => sum + swap.tokenVolumeUSD, 0);
    
    volumeAbsolute = totalVolume - previousPeriodVolume;
    volumePercentage = previousPeriodVolume > 0 ? (volumeAbsolute / previousPeriodVolume) * 100 : 0;
  }

  // Volume-weighted average price from last period swaps using poolPrice
  let totalWeightedPrice = 0;
  let totalVolumeForAvg = 0;
  
  for (const swap of lastPeriodSwaps) {
    if (swap.tokenVolumeUSD > 0 && swap.poolPrice > 0) {
      totalWeightedPrice += swap.poolPrice * swap.tokenVolumeUSD;
      totalVolumeForAvg += swap.tokenVolumeUSD;
    }
  }
  
  const avgPrice = totalVolumeForAvg > 0 ? totalWeightedPrice / totalVolumeForAvg : lastPrice;

  const result = {
    priceChange: {
      absolute: priceAbsolute,
      percentage: pricePercentage,
    },
    volumeChange: {
      absolute: volumeAbsolute,
      percentage: volumePercentage,
    },
    totalVolume: totalVolume,
    avgPrice: avgPrice,
  };

  console.log(`[SqrtPrice Metrics] Final result for ${timeframe}:`, {
    priceChange: result.priceChange,
    volumeChange: result.volumeChange,
    totalVolume: result.totalVolume,
    avgPrice: result.avgPrice,
  });

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
 * Hook to fetch sqrt price-based swap data and convert to OHLC with dynamic timeframe support
 */
export function useKatanaSqrtPriceOHLC({
  tokenAddress,
  resolution = 'hour',
  days = 30,
  autoRefresh = false,
  refreshInterval = 300000, // 5 minutes
  enabled = true,
}: UseKatanaSqrtPriceOHLCProps) {
  const [rawSwapData, setRawSwapData] = useState<SwapResponse | null>(null);
  const [data, setData] = useState<OHLCData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState<boolean>(true);
  const [isProcessingTimeframe, setIsProcessingTimeframe] = useState<boolean>(false);
  const [currentTimeframe, setCurrentTimeframe] = useState<TimeframeOption>('1h');

  console.log('useKatanaSqrtPriceOHLC:', { tokenAddress, resolution, days, enabled });

  // Fetch function for raw sqrt price swap data
  const fetchSwapData = useCallback(async () => {
    if (!enabled || !tokenAddress) {
      console.log('Fetch disabled or no token address');
      return;
    }

    console.log('Fetching sqrt price swap data for token:', tokenAddress);
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        tokenAddress: tokenAddress,
        days: days.toString(),
      });

      const response = await fetch(`${BACKEND_URL}/api/ohlc/katana/sqrtprice?${params}`, {
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
        throw new Error(result.data as any || 'Failed to fetch sqrt price data');
      }

      console.log('Sqrt price swap data fetched successfully:', {
        result,
        swapsCount: result.data.swaps.length,
        poolTVL: result.poolTVL,
        currentPoolPrice: result.currentPoolPrice,
        token: result.data.metadata.token.symbol,
      });

      setRawSwapData(result.data);
      setIsSupported(true);
    } catch (err: any) {
      console.error('Error fetching sqrt price swap data:', err);
      setError(err.message || 'Failed to fetch sqrt price swap data');
      setIsSupported(false);
      setRawSwapData(null);
    } finally {
      setIsLoading(false);
    }
  }, [tokenAddress, days, enabled]);

  // Process OHLC data from raw sqrt price swaps when timeframe changes
  const processOHLCData = useCallback(async (timeframe: TimeframeOption) => {
    if (!rawSwapData?.swaps) {
      console.log('No raw sqrt price swap data available for processing');
      return;
    }

    console.log(`Processing OHLC data for timeframe: ${timeframe}`);
    setIsProcessingTimeframe(true);

    // Add small delay to show spinner for user feedback
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      console.log("RAW SQRT PRICE SWAP DATA", rawSwapData);
      
      const timeframeMinutes = getTimeframeMinutes(timeframe);
      const ohlcChart = generateOHLCFromSqrtPriceSwaps(rawSwapData.swaps, timeframeMinutes);
      
      // Fill gaps for better chart continuity (but be conservative with short timeframes)
      const shouldFillGaps = timeframeMinutes >= 60; // Only fill gaps for 1h+ timeframes
      const filledChart = shouldFillGaps ? fillOHLCGaps(ohlcChart, timeframeMinutes) : ohlcChart;

      // Calculate timeframe-specific metrics using sqrt price data
      const timeframeMetrics = calculateTimeframeMetrics(
        rawSwapData.swaps, 
        filledChart, // Use the processed OHLC chart
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
          txCount: rawSwapData.metadata.totalSwaps,
          priceUSD: lastPrice,
          currency: 'USD',
          dataSource: 'subgraph-sqrt-swaps',
          chain: 'katana',
          dexId: 'katana-sushiswap',
          currentPoolPrice: rawSwapData.metadata.pool.currentPoolPrice,
        },
        timeframeMetrics: {
          ...timeframeMetrics,
          timeframe,
        },
      };

      setData(ohlcData);
      setCurrentTimeframe(timeframe);
    } catch (err: any) {
      console.error('Error processing sqrt price OHLC data:', err);
      setError(err.message || 'Failed to process sqrt price OHLC data');
    } finally {
      setIsProcessingTimeframe(false);
    }
  }, [rawSwapData]);

  // Reset data when token changes
  useEffect(() => {
    if (enabled && tokenAddress) {
      console.log('Token address changed, resetting sqrt price data and fetching...');
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
      console.log('Auto refreshing sqrt price swap data...');
      fetchSwapData();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, enabled, refreshInterval, fetchSwapData]);

  // Manual refetch function
  const refetch = useCallback(() => {
    console.log('Manual refetch requested for sqrt price data');
    return fetchSwapData();
  }, [fetchSwapData]);

  // Change timeframe function
  const changeTimeframe = useCallback((timeframe: TimeframeOption) => {
    if (timeframe !== currentTimeframe && !isProcessingTimeframe && rawSwapData) {
      console.log(`Changing timeframe to: ${timeframe} for sqrt price data`);
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
export default useKatanaSqrtPriceOHLC;