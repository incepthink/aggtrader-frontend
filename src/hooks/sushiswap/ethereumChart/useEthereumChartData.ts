import { useMemo, useRef } from 'react';
import { usePriceBackend } from '@/hooks/sushiswap/usePriceBackend';
import { CandlestickData, UTCTimestamp } from 'lightweight-charts';
import useEthereumSwapOHLC, { TimeframeOption } from './useEthereumSwapOHLC';

interface UseEthereumChartDataProps {
  tokenAddress: string | null;
  chainId: number;
  resolution: 'hour' | 'day';
}

// Extended return type to include timeframe functionality
interface UseEthereumChartDataReturn {
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
  
  // Chain information
  isEthereumChain: boolean;
  
  // Timeframe functionality
  currentTimeframe: TimeframeOption;
  changeTimeframe: (timeframe: TimeframeOption) => void;
  isProcessingTimeframe: boolean;
  
  // Timeframe metrics
  timeframeMetrics: {
    priceChange: { absolute: number; percentage: number };
    volumeChange: { absolute: number; percentage: number };
    totalVolume: number;
    avgPrice: number;
    timeframe: TimeframeOption;
  } | null;
}

export const useEthereumChartData = ({
  tokenAddress,
  chainId,
  resolution,
}: UseEthereumChartDataProps): UseEthereumChartDataReturn => {
  // Track processed data to prevent unnecessary re-processing
  const lastProcessedData = useRef<any>(null);
  const lastProcessedCount = useRef<number>(0);

  // Chain detection
  const isEthereumChain = chainId === 1;

  console.log('useEthereumChartData:', { tokenAddress, chainId, resolution, isEthereumChain });

  // Handle ETH placeholder address
  if (tokenAddress === "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee") {
    tokenAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
  }

  // Ethereum OHLC Data Hook
  const {
    data: ohlcData,
    isLoading: ohlcLoading,
    error: ohlcError,
    refetch: refetchOHLC,
    isSupported,
    currentTimeframe,
    changeTimeframe,
    isProcessingTimeframe,
  } = useEthereumSwapOHLC({
    tokenAddress: tokenAddress || '',
    resolution,
    days: 365,
    autoRefresh: isEthereumChain,
    refreshInterval: 300000,
    enabled: isEthereumChain && !!tokenAddress,
  });

  console.log('[ETHEREUM] OHLC Data:', { ohlcData, ohlcLoading, ohlcError, isSupported });

  // Current price from Sushi API for Ethereum
  const {
    tokenPrice: currentPrice,
    isLoading: priceLoading,
    isError: priceHasError,
    error: priceErrorData,
    refetch: refetchPrice,
  } = usePriceBackend(
    tokenAddress as any,
    undefined,
    1, // Ethereum mainnet chainId
    {
      enabled: isEthereumChain && !!tokenAddress,
      refetchInterval: 30000,
      staleTime: 15000,
    }
  );

  console.log('[ETHEREUM] Price Data:', { currentPrice, priceLoading, priceHasError });

  // Process OHLC data for chart with memoization
  const chartData = useMemo((): CandlestickData[] => {
    console.log('[ETHEREUM] Processing chart data...', { ohlcData, isEthereumChain });
    
    if (!ohlcData?.chart || !isEthereumChain) {
      console.log('[ETHEREUM] No OHLC data or not Ethereum chain');
      lastProcessedData.current = null;
      lastProcessedCount.current = 0;
      return [];
    }

    // Check if we already processed this exact data
    if (
      lastProcessedData.current === ohlcData && 
      lastProcessedCount.current === ohlcData.chart.length
    ) {
      console.log('[ETHEREUM] Data unchanged, skipping processing');
      return lastProcessedData.current.processedChart || [];
    }

    try {
      // The ethereum hook already returns properly formatted CandlestickData
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
          console.log('[ETHEREUM] Invalid OHLC point:', point);
        }
        return isValid;
      });

      console.log('[ETHEREUM] Processed chart data:', processed.length, 'points');
      if (processed.length > 0) {
        console.log('[ETHEREUM] First point:', processed[0]);
        console.log('[ETHEREUM] Last point:', processed[processed.length - 1]);
        console.log('[ETHEREUM] Price range:', {
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
      console.error('[ETHEREUM] Error processing chart data:', err);
      throw new Error(`Data processing error: ${err}`);
    }
  }, [ohlcData, isEthereumChain]);

  // Calculate price change
  const priceChange = useMemo(() => {
    if (!currentPrice || chartData.length === 0 || !isEthereumChain) {
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
  }, [currentPrice, chartData, isEthereumChain]);

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
    console.log('[ETHEREUM] Refetching all data...');
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
    
    // Chain information
    isEthereumChain,
    
    // Timeframe functionality
    currentTimeframe,
    changeTimeframe,
    isProcessingTimeframe,
    
    // Timeframe metrics
    timeframeMetrics: ohlcData?.timeframeMetrics || null,
  };
};