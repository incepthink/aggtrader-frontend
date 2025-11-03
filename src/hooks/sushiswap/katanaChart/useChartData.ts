// hooks/sushiswap/katanaChart/useChartData.ts

import { useMemo, useRef } from 'react';
import { useKatanaCandleOHLC } from '@/hooks/sushiswap/katanaChart/useKatanaCandleOHLC';
import { usePriceBackend } from '@/hooks/sushiswap/usePriceBackend';
import { CandlestickData, UTCTimestamp } from 'lightweight-charts';
import { TimeframeOption, TimeframeMetrics } from '@/components/spot/chart/katana/chartHeader/types';

interface UseChartDataReturn {
  ohlcData: any;
  chartData: any[];
  currentPrice: number | null;
  priceChange: { percentage: number; absolute: number };
  high: number | null;
  low: number | null;
  isLoading: boolean;
  ohlcLoading: boolean;
  priceLoading: boolean;
  error: string | null;
  priceHasError: boolean;
  priceErrorData: any;
  isSupported: boolean;
  refetchAll: () => void;
  refetchOHLC: () => void;
  refetchPrice: () => void;
  currentTimeframe: TimeframeOption;
  changeTimeframe: (timeframe: TimeframeOption) => void;
  isProcessingTimeframe: boolean;
  timeframeMetrics: TimeframeMetrics | null;
}

export function useChartData({
  tokenAddress,
  chainId,
  timeframe = '1h',
  isKatanaChain,
}: {
  tokenAddress: string | null;
  chainId: number;
  timeframe?: TimeframeOption;
  isKatanaChain: boolean;
}): UseChartDataReturn {
  const lastProcessedData = useRef<any>(null);
  const lastProcessedCount = useRef<number>(0);

  console.log('useChartData:', { tokenAddress, chainId, timeframe, isKatanaChain });

  if (tokenAddress === "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee") {
    tokenAddress = "0xee7d8bcfb72bc1880d0cf19822eb0a2e6577ab62"
  }

  // Katana Candle OHLC Data Hook (uses pre-computed candles from backend)
  const {
    data: ohlcData,
    isLoading: ohlcLoading,
    error: ohlcError,
    refetch: refetchOHLC,
    isSupported,
    currentTimeframe,
    changeTimeframe,
    isProcessingTimeframe,
  } = useKatanaCandleOHLC({
    tokenAddress: tokenAddress || '',
    timeframe,
    days: 365,
    autoRefresh: isKatanaChain,
    refreshInterval: 300000,
    enabled: isKatanaChain && !!tokenAddress,
  });

  console.log('OHLC Data from candles:', { ohlcData, ohlcLoading, ohlcError, isSupported });

  // Current price from Sushi API
  const {
    tokenPrice: currentPrice,
    isLoading: priceLoading,
    isError: priceHasError,
    error: priceErrorData,
    refetch: refetchPrice,
  } = usePriceBackend(
    tokenAddress as any,
    undefined,
    747474, // Katana chainId
    {
      enabled: isKatanaChain && !!tokenAddress,
      refetchInterval: 30000,
      staleTime: 15000,
    }
  );

  console.log('Price Data:', { currentPrice, priceLoading, priceHasError });

  // Process candle data for chart (backend returns ready candles!)
  const chartData = useMemo((): CandlestickData[] => {
  console.log('Processing chart data...', { ohlcData, isKatanaChain });
  
  if (!ohlcData?.candles || !isKatanaChain) {
    console.log('No candle data or not Katana chain');
    lastProcessedData.current = null;
    lastProcessedCount.current = 0;
    return [];
  }

  // Check if we already processed this exact data
  if (
    lastProcessedData.current === ohlcData && 
    lastProcessedCount.current === ohlcData.candles.length
  ) {
    console.log('Data unchanged, skipping processing');
    return lastProcessedData.current.processedChart || [];
  }

  try {
    // Backend returns ready-to-use CandlestickData format!
    const processed = ohlcData.candles
      .filter((candle: any) => {
        const isValid = (
          candle.timestamp &&
          candle.open > 0 &&
          candle.high > 0 &&
          candle.low > 0 &&
          candle.close > 0 &&
          !isNaN(candle.open) &&
          !isNaN(candle.high) &&
          !isNaN(candle.low) &&
          !isNaN(candle.close)
        );
        if (!isValid) {
          console.log('Invalid candle:', candle);
        }
        return isValid;
      })
      .map((candle: any) => ({
        time: Math.floor(candle.timestamp / 1000) as UTCTimestamp,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
      }))
      .sort((a, b) => (a.time as number) - (b.time as number)); // ADD THIS LINE - sort oldest to newest

    console.log('Processed candle chart data:', processed.length, 'points');
    if (processed.length > 0) {
      console.log('First candle (oldest):', processed[0]);
      console.log('Last candle (newest):', processed[processed.length - 1]);
      console.log('Price range:', {
        min: Math.min(...processed.map((p: any) => p.low)),
        max: Math.max(...processed.map((p: any) => p.high)),
        latest: processed[processed.length - 1].close
      });
    }

    // Cache the processed data
    lastProcessedData.current = { ...ohlcData, processedChart: processed };
    lastProcessedCount.current = ohlcData.candles.length;

    return processed;
  } catch (err) {
    console.error('Error processing candle chart data:', err);
    throw new Error(`Data processing error: ${err}`);
  }
}, [ohlcData, isKatanaChain]);

  // Calculate timeframe metrics from candles
  const timeframeMetrics = useMemo((): TimeframeMetrics | null => {
    if (!ohlcData?.candles || ohlcData.candles.length < 2) {
      return null;
    }

    // Sort candles by timestamp to ensure oldest first, newest last
    const candles = [...ohlcData.candles].sort((a, b) => a.timestamp - b.timestamp);
    
    const secondLastCandle = candles[candles.length - 2]; // Second to last candle
    const lastCandle = candles[candles.length - 1]; // Most recent candle

    console.log('[TimeframeMetrics] Calculation:', {
      secondLastCandle: { timestamp: secondLastCandle.timestamp, close: secondLastCandle.close },
      lastCandle: { timestamp: lastCandle.timestamp, close: lastCandle.close },
      currentPrice,
      totalCandles: candles.length,
    });

    // Price change: Compare ONLY the last two candles to show change for this specific timeframe period
    const priceAbsolute = lastCandle.close - secondLastCandle.close;
    const pricePercentage = (priceAbsolute / secondLastCandle.close) * 100;

    console.log('[TimeframeMetrics] Price change:', {
      secondLastClose: secondLastCandle.close,
      lastClose: lastCandle.close,
      absolute: priceAbsolute,
      percentage: pricePercentage,
    });

    // Volume calculation
    const totalVolume = candles.reduce((sum: number, candle: any) => sum + (candle.volume || 0), 0);
    
    // For volume change, we'll calculate first half vs second half
    const midpoint = Math.floor(candles.length / 2);
    const firstHalfVolume = candles.slice(0, midpoint).reduce((sum: number, c: any) => sum + (c.volume || 0), 0);
    const secondHalfVolume = candles.slice(midpoint).reduce((sum: number, c: any) => sum + (c.volume || 0), 0);
    const volumeAbsolute = secondHalfVolume - firstHalfVolume;
    const volumePercentage = firstHalfVolume > 0 ? (volumeAbsolute / firstHalfVolume) * 100 : 0;

    // Average price
    const avgPrice = candles.reduce((sum: number, c: any) => {
      return sum + (c.open + c.high + c.low + c.close) / 4;
    }, 0) / candles.length;

    return {
      priceChange: {
        absolute: priceAbsolute,
        percentage: pricePercentage,
      },
      volumeChange: {
        absolute: volumeAbsolute,
        percentage: volumePercentage,
      },
      totalVolume,
      avgPrice,
      timeframe: currentTimeframe,
    };
  }, [ohlcData, currentTimeframe]); // Removed currentPrice dependency since we only compare candles

  // Calculate price change (for header display - overall chart range)
  const priceChange = useMemo(() => {
    if (!currentPrice || chartData.length === 0 || !isKatanaChain) {
      return { percentage: 0, absolute: 0 };
    }

    const historicalPrice =
      chartData[0]?.close || chartData[chartData.length - 1]?.close;
    if (!historicalPrice) {
      return { percentage: 0, absolute: 0 };
    }

    const absolute = currentPrice - historicalPrice;
    const percentage = (absolute / historicalPrice) * 100;

    return { percentage, absolute };
  }, [currentPrice, chartData, isKatanaChain]);

  // Calculate high/low
  const { high, low } = useMemo(() => {
    if (chartData.length === 0) {
      return { high: 0, low: 0 };
    }

    let high = chartData[0].high;
    let low = chartData[0].low;

    for (const candle of chartData) {
      if (candle.high > high) high = candle.high;
      if (candle.low < low) low = candle.low;
    }

    return { high, low };
  }, [chartData]);

  const refetchAll = () => {
    console.log('Refetching all candle data...');
    lastProcessedData.current = null;
    lastProcessedCount.current = 0;
    refetchOHLC();
    refetchPrice();
  };

const chartDataWithCurrentPrice = useMemo((): CandlestickData[] => {
  console.log('Checking forming candle update:', {
    hasCurrentPrice: !!currentPrice,
    chartDataLength: chartData.length,
    currentPrice,
    currentTimeframe,
  });

  if (!currentPrice || chartData.length === 0) {
    console.log('No current price or no chart data, returning original');
    return chartData;
  }

  const lastCandle = chartData[chartData.length - 1];
  const lastCandleTime = (lastCandle.time as number) * 1000;
  const now = Date.now();
  
  const timeframeMs: Record<string, number> = {
    '5m': 5 * 60 * 1000,
    '15m': 15 * 60 * 1000,
    '30m': 30 * 60 * 1000,
    '1h': 60 * 60 * 1000,
    '4h': 4 * 60 * 60 * 1000,
    '1d': 24 * 60 * 60 * 1000,
    '1w': 7 * 24 * 60 * 60 * 1000,
  };
  
  const candleDuration = timeframeMs[currentTimeframe] || (5 * 60 * 1000);
  
  let isForming;
  
  if (currentTimeframe === '5m') {
    // Large buffer for 5m - up to 15 minutes to account for cron delays
    const durationWithBuffer = 15 * 60 * 1000; // 15 minutes
    isForming = (now - lastCandleTime) < durationWithBuffer;
  } else if (currentTimeframe === '1w') {
    // For weekly: check if we're within same week as last candle + 7 days
    // This allows updating any candle within the past week
    const oneWeek = 7 * 24 * 60 * 60 * 1000;
    isForming = (now - lastCandleTime) < oneWeek;
  } else {
    isForming = (now - lastCandleTime) < candleDuration;
  }
  
  console.log('Forming candle check:', {
    lastCandleTime: new Date(lastCandleTime).toISOString(),
    now: new Date(now).toISOString(),
    timeDiff: now - lastCandleTime,
    candleDuration,
    currentTimeframe,
    isForming,
    lastCandleClose: lastCandle.close,
    currentPrice,
  });

  if (!isForming) {
    console.log('Last candle not forming, returning original');
    return chartData;
  }

  const updatedData = [...chartData];
  const updatedLastCandle = { ...lastCandle };

  updatedLastCandle.close = currentPrice;
  updatedLastCandle.high = Math.max(updatedLastCandle.high, currentPrice);
  updatedLastCandle.low = Math.min(updatedLastCandle.low, currentPrice);

  updatedData[updatedData.length - 1] = updatedLastCandle;

  console.log('✓ Updated forming candle:', {
    before: lastCandle,
    after: updatedLastCandle,
  });

  return updatedData;
}, [chartData, currentPrice, currentTimeframe]);

  return {
    // Data
    ohlcData,
    chartData: chartDataWithCurrentPrice,
    currentPrice: currentPrice || null,
    priceChange,
    high,
    low,
    
    // Loading states
    isLoading: ohlcLoading || priceLoading,
    ohlcLoading,
    priceLoading,
    
    // Error states
    error: ohlcError,
    priceHasError,
    priceErrorData,
    isSupported,
    
    // Actions
    refetchAll,
    refetchOHLC,
    refetchPrice,
    
    // Timeframe functionality
    currentTimeframe,
    changeTimeframe,
    isProcessingTimeframe,
    
    // Timeframe metrics (calculated from candles)
    timeframeMetrics,
  };
}