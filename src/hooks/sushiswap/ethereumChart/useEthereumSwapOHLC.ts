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
  pair: {
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
    pair: {
      id: string;
      address: string;
      token0: any;
      token1: any;
      reserveUSD: number;
      volumeUSD: number;
      reserve0: number;
      reserve1: number;
      token0Price: number;
      token1Price: number;
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
  pairId: string;
  pairReserveUSD: string;
  chain: string;
}

interface UseEthereumSwapOHLCProps {
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
    reserveUSD: number;
    volumeUSD: number;
    pairCount: number;
    txCount: number;
    priceUSD: number;
    currency: string;
    dataSource: string;
    chain: string;
    dexId: string;
    pairToken0?: string;
    pairToken1?: string;
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

// OHLC Utils for Ethereum
export const ethereumOHLCUtils = {
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

  console.log(`[Ethereum OHLC] Generating OHLC from ${swaps.length} swaps with ${timeframeMinutes}min timeframe`);

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

  console.log(`[Ethereum OHLC] Grouped swaps into ${groupedSwaps.size} time windows`);

  // Sort time windows to process in chronological order
  const sortedWindows = Array.from(groupedSwaps.entries()).sort((a, b) => a[0] - b[0]);

  // Convert each window to OHLC with price continuity
  const ohlcData: CandlestickData[] = [];
  let previousClose: number | null = null;

  for (const [windowStart, windowSwaps] of sortedWindows) {
    // Sort swaps by timestamp within the window
    windowSwaps.sort((a, b) => a.timestamp - b.timestamp);

    const prices = windowSwaps
      .map(swap => swap.tokenPriceUSD)
      .filter(price => price > 0);

    if (prices.length === 0) continue;

    // Determine open price with continuity logic
    let openPrice: number;
    if (previousClose === null) {
      // First candle: use actual first trade price
      openPrice = prices[0];
    } else {
      // Subsequent candles: open at previous candle's close for continuity
      openPrice = previousClose;
    }

    const closePrice = prices[prices.length - 1]; // Last price in window
    const highPrice = Math.max(...prices);       // Highest price in window
    const lowPrice = Math.min(...prices);        // Lowest price in window

    // Ensure high includes the open price (in case open > all trade prices)
    const adjustedHigh = Math.max(highPrice, openPrice);
    // Ensure low includes the open price (in case open < all trade prices)  
    const adjustedLow = Math.min(lowPrice, openPrice);

    const ohlcPoint: CandlestickData = {
      time: Math.floor(windowStart / 1000) as UTCTimestamp, // Convert to seconds
      open: openPrice,
      high: adjustedHigh,
      low: adjustedLow,
      close: closePrice,
    };

    ohlcData.push(ohlcPoint);
    
    // Update previous close for next iteration
    previousClose = closePrice;
  }

  // Sort by timestamp (should already be sorted, but ensure it)
  ohlcData.sort((a, b) => (a.time as number) - (b.time as number));

  console.log(`[Ethereum OHLC] Generated ${ohlcData.length} OHLC points with price continuity`);
  
  if (ohlcData.length > 0) {
    console.log('[Ethereum OHLC] First OHLC point:', ohlcData[0]);
    console.log('[Ethereum OHLC] Last OHLC point:', ohlcData[ohlcData.length - 1]);
  }

  return ohlcData;
}

/**
 * Calculate timeframe-specific metrics (price change, volume change)
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

  console.log(`[Ethereum Metrics] Calculating for timeframe: ${timeframe}`);

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
  
  console.log(`[Ethereum Metrics] Using recent data:`, {
    totalOHLCPoints: ohlcData.length,
    periodsToInclude,
    recentOHLCCount: recentOHLCData.length,
    timeframeMinutes,
    firstRecentTime: recentOHLCData[0] ? new Date((recentOHLCData[0].time as number) * 1000).toISOString() : 'none',
    lastRecentTime: recentOHLCData[recentOHLCData.length - 1] ? new Date((recentOHLCData[recentOHLCData.length - 1].time as number) * 1000).toISOString() : 'none'
  });

  // For volume calculations, focus on just the LAST timeframe period
  const lastOHLC = recentOHLCData[recentOHLCData.length - 1];
  const lastPeriodStart = (lastOHLC?.time as number) * 1000;
  const lastPeriodEnd = lastPeriodStart + timeframeMs;
  
  // Filter swaps for just the most recent single timeframe period
  const lastPeriodSwaps = swaps.filter(swap => 
    swap.timestamp >= lastPeriodStart && swap.timestamp < lastPeriodEnd
  );

  console.log(`[Ethereum Metrics] Filtered swaps for most recent ${timeframe} period:`, {
    originalCount: swaps.length,
    lastPeriodCount: lastPeriodSwaps.length,
    lastPeriodTimeRange: {
      start: new Date(lastPeriodStart).toISOString(),
      end: new Date(lastPeriodEnd).toISOString(),
      durationMinutes: timeframeMinutes
    }
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
  let previousPeriodSwaps: SwapData[] | null = null;

  if (recentOHLCData.length >= 2) {
    // Get the previous OHLC period
    const previousOHLC = recentOHLCData[recentOHLCData.length - 2];
    
    // Calculate time range for the previous timeframe period
    const previousPeriodStart = (previousOHLC.time as number) * 1000;
    const previousPeriodEnd = previousPeriodStart + timeframeMs;
    
    // Filter swaps for the previous timeframe period
    previousPeriodSwaps = swaps.filter(swap => 
      swap.timestamp >= previousPeriodStart && swap.timestamp < previousPeriodEnd
    );
    
    const previousPeriodVolume = previousPeriodSwaps.reduce((sum, swap) => sum + swap.tokenVolumeUSD, 0);
    
    volumeAbsolute = totalVolume - previousPeriodVolume;
    volumePercentage = previousPeriodVolume > 0 ? (volumeAbsolute / previousPeriodVolume) * 100 : 0;
    
    console.log(`[Ethereum Metrics] Volume comparison for single ${timeframe} periods:`, {
      timeframeMs,
      currentPeriod: { 
        start: new Date(lastPeriodStart).toISOString(), 
        end: new Date(lastPeriodEnd).toISOString(), 
        volume: totalVolume,
        swaps: lastPeriodSwaps.length
      },
      previousPeriod: { 
        start: new Date(previousPeriodStart).toISOString(), 
        end: new Date(previousPeriodEnd).toISOString(), 
        volume: previousPeriodVolume,
        swaps: previousPeriodSwaps.length
      },
      change: { absolute: volumeAbsolute, percentage: volumePercentage }
    });
  }

  // Volume-weighted average price from last period swaps
  let totalWeightedPrice = 0;
  let totalVolumeForAvg = 0;
  
  for (const swap of lastPeriodSwaps) {
    if (swap.tokenVolumeUSD > 0) {
      totalWeightedPrice += swap.tokenPriceUSD * swap.tokenVolumeUSD;
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

  console.log(`[Ethereum Metrics] Final result for ${timeframe}:`, {
    periodsIncluded: periodsToInclude,
    priceChange: result.priceChange,
    volumeChange: result.volumeChange,
    totalVolume: result.totalVolume,
    avgPrice: result.avgPrice,
    dataPoints: { 
      lastPeriodSwaps: lastPeriodSwaps.length, 
      recentOHLC: recentOHLCData.length,
      previousPeriodSwaps: previousPeriodSwaps?.length || 0,
      timeframeMinutes: timeframeMinutes
    }
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

  console.log(`[Ethereum OHLC] Filled gaps: ${ohlcData.length} -> ${filled.length} OHLC points`);
  return filled;
}

/**
 * Hook to fetch Ethereum swap data and convert to OHLC with dynamic timeframe support
 */
export function useEthereumSwapOHLC({
  tokenAddress,
  resolution = 'hour',
  days = 30,
  autoRefresh = false,
  refreshInterval = 300000, // 5 minutes
  enabled = true,
}: UseEthereumSwapOHLCProps) {
  const [rawSwapData, setRawSwapData] = useState<SwapResponse | null>(null);
  const [data, setData] = useState<OHLCData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState<boolean>(true);
  const [isProcessingTimeframe, setIsProcessingTimeframe] = useState<boolean>(false);
  const [currentTimeframe, setCurrentTimeframe] = useState<TimeframeOption>('1h');

  console.log('useEthereumSwapOHLC:', { tokenAddress, resolution, days, enabled });

  // Fetch function for raw swap data
  const fetchSwapData = useCallback(async () => {
    if (!enabled || !tokenAddress) {
      console.log('Fetch disabled or no token address');
      return;
    }

    console.log('[Ethereum] Fetching swap data for token:', tokenAddress);
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        tokenAddress: tokenAddress,
        days: days.toString(),
        force: "true"
      });

      const response = await fetch(`${BACKEND_URL}/api/ohlc/ethereum/pool?${params}`, {
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

      console.log('[Ethereum] Swap data fetched successfully:', {
        swapsCount: result.data.swaps.length,
        pairReserveUSD: result.pairReserveUSD,
        token: result.data.metadata.token.symbol,
        source: result.source,
      });

      setRawSwapData(result.data);
      setIsSupported(true);
    } catch (err: any) {
      console.error('[Ethereum] Error fetching swap data:', err);
      setError(err.message || 'Failed to fetch Ethereum swap data');
      setIsSupported(false);
      setRawSwapData(null);
    } finally {
      setIsLoading(false);
    }
  }, [tokenAddress, days, enabled]);

  // Process OHLC data from raw swaps when timeframe changes
  const processOHLCData = useCallback(async (timeframe: TimeframeOption) => {
    if (!rawSwapData?.swaps) {
      console.log('[Ethereum] No raw swap data available for processing');
      return;
    }

    console.log(`[Ethereum] Processing OHLC data for timeframe: ${timeframe}`);
    setIsProcessingTimeframe(true);

    // Add small delay to show spinner for user feedback
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      console.log("[Ethereum] RAW SWAP DATA:", rawSwapData);
      
      const timeframeMinutes = getTimeframeMinutes(timeframe);
      const ohlcChart = generateOHLCFromSwaps(rawSwapData.swaps, timeframeMinutes);
      
      // Fill gaps for better chart continuity (optional)
      const shouldFillGaps = false;
      const filledChart = shouldFillGaps ? fillOHLCGaps(ohlcChart, timeframeMinutes) : ohlcChart;

      // Calculate timeframe-specific metrics
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
          reserveUSD: rawSwapData.metadata.pair.reserveUSD,
          volumeUSD: rawSwapData.metadata.pair.volumeUSD,
          pairCount: 1,
          pairToken0: rawSwapData.metadata.pair.token0,
          pairToken1: rawSwapData.metadata.pair.token1,
          txCount: rawSwapData.metadata.totalSwaps,
          priceUSD: lastPrice,
          currency: 'USD',
          dataSource: 'subgraph-swaps-v2',
          chain: 'ethereum',
          dexId: 'ethereum-sushiswap-v2',
        },
        timeframeMetrics: {
          ...timeframeMetrics,
          timeframe,
        },
      };

      setData(ohlcData);
      setCurrentTimeframe(timeframe);
    } catch (err: any) {
      console.error('[Ethereum] Error processing OHLC data:', err);
      setError(err.message || 'Failed to process Ethereum OHLC data');
    } finally {
      setIsProcessingTimeframe(false);
    }
  }, [rawSwapData]);

  // Reset data when token changes
  useEffect(() => {
    if (enabled && tokenAddress) {
      console.log('[Ethereum] Token address changed, resetting data and fetching...');
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
      console.log('[Ethereum] Auto refreshing swap data...');
      fetchSwapData();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, enabled, refreshInterval, fetchSwapData]);

  // Manual refetch function
  const refetch = useCallback(() => {
    console.log('[Ethereum] Manual refetch requested');
    return fetchSwapData();
  }, [fetchSwapData]);

  // Change timeframe function
  const changeTimeframe = useCallback((timeframe: TimeframeOption) => {
    if (timeframe !== currentTimeframe && !isProcessingTimeframe && rawSwapData) {
      console.log(`[Ethereum] Changing timeframe to: ${timeframe}`);
      processOHLCData(timeframe);
    }
  }, [currentTimeframe, isProcessingTimeframe, processOHLCData, rawSwapData]);

  return {
    data,
    isLoading,
    error,
    refetch,
    isSupported,
    // Timeframe functionality
    currentTimeframe,
    changeTimeframe,
    isProcessingTimeframe,
  };
}

// Export the hook as default
export default useEthereumSwapOHLC;