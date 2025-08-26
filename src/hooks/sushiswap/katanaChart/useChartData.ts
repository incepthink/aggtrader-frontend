import { useMemo, useRef } from 'react';
// CHANGE THIS LINE: Replace the import
import { useKatanaSqrtPriceOHLC, TimeframeOption } from '@/hooks/sushiswap/katanaChart/useKatanaSqrtPriceOHLC'; // Updated import
import { usePriceBackend } from '@/hooks/sushiswap/usePriceBackend';
import { CandlestickData, UTCTimestamp } from 'lightweight-charts';
import useKatanaSwapOHLC from './useKatanaSwapOHLC';

interface UseChartDataProps {
  tokenAddress: string | null;
  chainId: number;
  resolution: 'hour' | 'day';
  isKatanaChain: boolean;
}

// Extended return type to include timeframe functionality
interface UseChartDataReturn {
  // Data
  ohlcData: any;
  chartData: CandlestickData[];
  currentPrice: number | null;
  priceChange: { percentage: number; absolute: number };
  high: number;
  low: number;
  
  // Loading states
  isLoading: boolean;
  ohlcLoading: boolean;
  priceLoading: boolean;
  
  // Error states
  error: string | null;
  priceHasError: boolean;
  priceErrorData: any;
  isSupported: boolean;
  
  // Actions
  refetchAll: () => void;
  refetchOHLC: () => void;
  refetchPrice: () => void;
  
  // New timeframe functionality
  currentTimeframe: TimeframeOption;
  changeTimeframe: (timeframe: TimeframeOption) => void;
  isProcessingTimeframe: boolean;
  
  // New timeframe metrics
  timeframeMetrics: {
    priceChange: { absolute: number; percentage: number };
    volumeChange: { absolute: number; percentage: number };
    totalVolume: number;
    avgPrice: number;
    timeframe: TimeframeOption;
  } | null;
}

export const useChartData = ({
  tokenAddress,
  chainId,
  resolution,
  isKatanaChain,
}: UseChartDataProps): UseChartDataReturn => {
  // Track processed data to prevent unnecessary re-processing
  const lastProcessedData = useRef<any>(null);
  const lastProcessedCount = useRef<number>(0);

  // Debug logging
  console.log('useChartData:', { tokenAddress, chainId, resolution, isKatanaChain });

  if (tokenAddress === "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee") {
    tokenAddress = "0xee7d8bcfb72bc1880d0cf19822eb0a2e6577ab62"
  }

  // CHANGE THIS LINE: Replace the hook call
  // Katana SqrtPrice OHLC Data Hook (NEW - uses accurate pool pricing)
  const {
    data: ohlcData,
    isLoading: ohlcLoading,
    error: ohlcError,
    refetch: refetchOHLC,
    isSupported,
    currentTimeframe,
    changeTimeframe,
    isProcessingTimeframe,
  } = useKatanaSwapOHLC({
    tokenAddress: tokenAddress || '',
    resolution,
    days: 365,
    autoRefresh: isKatanaChain,
    refreshInterval: 300000,
    enabled: isKatanaChain && !!tokenAddress,
  });

  // Debug OHLC data
  console.log('OHLC Data from sqrt prices:', { ohlcData, ohlcLoading, ohlcError, isSupported });

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

  // Debug price data
  console.log('Price Data:', { currentPrice, priceLoading, priceHasError });
  
  // If we have pool price from sqrt data, log comparison
  // if (ohlcData?.metadata?.currentPoolPrice && currentPrice) {
  //   console.log('Price comparison:', {
  //     sushiApiPrice: currentPrice,
  //     poolPrice: ohlcData.metadata.currentPoolPrice,
  //     difference: Math.abs(currentPrice - ohlcData.metadata.currentPoolPrice),
  //     percentageDiff: Math.abs(currentPrice - ohlcData.metadata.currentPoolPrice) / currentPrice * 100
  //   });
  // }

  // Process OHLC data for chart with memoization
  const chartData = useMemo((): CandlestickData[] => {
    console.log('Processing chart data...', { ohlcData, isKatanaChain });
    
    if (!ohlcData?.chart || !isKatanaChain) {
      console.log('No OHLC data or not Katana chain');
      lastProcessedData.current = null;
      lastProcessedCount.current = 0;
      return [];
    }

    // Check if we already processed this exact data
    if (
      lastProcessedData.current === ohlcData && 
      lastProcessedCount.current === ohlcData.chart.length
    ) {
      console.log('Data unchanged, skipping processing');
      return lastProcessedData.current.processedChart || [];
    }

    try {
      // The sqrt price hook already returns properly formatted CandlestickData with accurate pricing
      const processed = ohlcData.chart.filter((point) => {
        const isValid = (
          point.time &&
          point.open > 0 &&
          point.high > 0 &&
          point.low > 0 &&
          point.close > 0 &&
          !isNaN(point.open) &&
          !isNaN(point.high) &&
          !isNaN(point.low) &&
          !isNaN(point.close)
        );
        if (!isValid) {
          console.log('Invalid OHLC point:', point);
        }
        return isValid;
      });

      console.log('Processed sqrt price chart data:', processed.length, 'points');
      if (processed.length > 0) {
        console.log('First sqrt price point:', processed[0]);
        console.log('Last sqrt price point:', processed[processed.length - 1]);
        console.log('Price range:', {
          min: Math.min(...processed.map(p => p.low)),
          max: Math.max(...processed.map(p => p.high)),
          latest: processed[processed.length - 1].close
        });
      }

      // Cache the processed data
      lastProcessedData.current = { ...ohlcData, processedChart: processed };
      lastProcessedCount.current = ohlcData.chart.length;

      return processed;
    } catch (err) {
      console.error('Error processing sqrt price chart data:', err);
      throw new Error(`Data processing error: ${err}`);
    }
  }, [ohlcData, isKatanaChain]);

  // Calculate price change
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
    console.log('Refetching all sqrt price data...');
    // Clear cache when refetching
    lastProcessedData.current = null;
    lastProcessedCount.current = 0;
    refetchOHLC();
    refetchPrice();
  };

  return {
    // Data
    ohlcData,
    chartData,
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
    
    // New timeframe functionality
    currentTimeframe,
    changeTimeframe,
    isProcessingTimeframe,
    
    // New timeframe metrics
    timeframeMetrics: ohlcData?.timeframeMetrics || null,
  };
};