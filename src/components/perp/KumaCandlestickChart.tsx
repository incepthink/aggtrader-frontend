'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Box, Typography } from '@mui/material';
import { CandleInterval } from '@katanaperps/katana-perps-sdk';
import { useKumaCandleWebSocket } from '@/hooks/perp/useKumaCandleWebSocket';
import ChartContainer from '@/components/spot/chart/ChartContainer';
import TimeframeSelector, {
  TimeframeOption,
} from '@/components/spot/chart/TimeframeSelector';

interface KumaCandlestickChartProps {
  market?: string;
  initialInterval?: CandleInterval;
}

// Map TimeframeOption to CandleInterval (Kuma SDK only supports up to 1d)
const timeframeToInterval: Partial<Record<TimeframeOption, CandleInterval>> = {
  '5m': CandleInterval.FIVE_MINUTES,
  '15m': CandleInterval.FIFTEEN_MINUTES,
  '30m': CandleInterval.THIRTY_MINUTES,
  '1h': CandleInterval.ONE_HOUR,
  '4h': CandleInterval.FOUR_HOURS,
  '1d': CandleInterval.ONE_DAY,
  // Note: '1w' is not supported by Kuma SDK
};

// Map CandleInterval to TimeframeOption
// Note: ONE_MINUTE is not included as it's not a standard TimeframeOption
const intervalToTimeframe: Partial<Record<CandleInterval, TimeframeOption>> = {
  [CandleInterval.FIVE_MINUTES]: '5m',
  [CandleInterval.FIFTEEN_MINUTES]: '15m',
  [CandleInterval.THIRTY_MINUTES]: '30m',
  [CandleInterval.ONE_HOUR]: '1h',
  [CandleInterval.FOUR_HOURS]: '4h',
  [CandleInterval.ONE_DAY]: '1d',
};

const KumaCandlestickChart: React.FC<KumaCandlestickChartProps> = ({
  market = 'BTC-USD',
  initialInterval = CandleInterval.FIVE_MINUTES,
}) => {
  // State
  const [chartReady, setChartReady] = useState(false);
  const [renderKey, setRenderKey] = useState(0);
  const [chartError, setChartError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<TimeframeOption>(
    intervalToTimeframe[initialInterval] || '5m'
  );
  const [isProcessingTimeframe, setIsProcessingTimeframe] = useState(false);

  // Derive interval from timeframe (fallback to FIVE_MINUTES if unsupported)
  const interval = timeframeToInterval[timeframe] || CandleInterval.FIVE_MINUTES;

  // Refs to prevent loops
  const lastMarket = useRef<string>(market);
  const lastInterval = useRef<CandleInterval>(interval);
  // MEMORY LEAK FIX: Track timeout for cleanup
  const processingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // Auto-retry refs
  const retryCountRef = useRef<number>(0);
  const autoRetryTimerRef = useRef<NodeJS.Timeout | null>(null);
  const MAX_AUTO_RETRIES = 3;
  const AUTO_RETRY_DELAY_MS = 3000;

  // Get candle data from WebSocket
  const { isConnected, candleData, latestCandle, error, isLoadingHistory } =
    useKumaCandleWebSocket({
      market,
      interval,
      enabled: true,
    });

  // Only force re-render when market or interval actually changes
  useEffect(() => {
    if (market !== lastMarket.current || interval !== lastInterval.current) {
      lastMarket.current = market;
      lastInterval.current = interval;
      setRenderKey((prev) => prev + 1);
      setChartError(null);
      setChartReady(false);
    }
  }, [market, interval]);

  // MEMORY LEAK FIX: Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current);
        processingTimeoutRef.current = null;
      }
      if (autoRetryTimerRef.current) {
        clearTimeout(autoRetryTimerRef.current);
        autoRetryTimerRef.current = null;
      }
    };
  }, []);

  // Auto-retry when an error occurs (up to MAX_AUTO_RETRIES times)
  useEffect(() => {
    const hasError = !!(error || chartError);
    if (!hasError) return;
    if (retryCountRef.current >= MAX_AUTO_RETRIES) return;

    if (autoRetryTimerRef.current) {
      clearTimeout(autoRetryTimerRef.current);
    }

    autoRetryTimerRef.current = setTimeout(() => {
      retryCountRef.current += 1;
      setChartError(null);
      setRenderKey((prev) => prev + 1);
      setChartReady(false);
      autoRetryTimerRef.current = null;
    }, AUTO_RETRY_DELAY_MS);

    return () => {
      if (autoRetryTimerRef.current) {
        clearTimeout(autoRetryTimerRef.current);
        autoRetryTimerRef.current = null;
      }
    };
  }, [error, chartError]);

  // Reset retry counter when data loads successfully
  useEffect(() => {
    if (candleData.length > 0 && !error && !chartError) {
      retryCountRef.current = 0;
    }
  }, [candleData.length, error, chartError]);

  // Handle timeframe change
  const handleTimeframeChange = useCallback((newTimeframe: TimeframeOption) => {
    // Only allow supported timeframes
    if (!timeframeToInterval[newTimeframe]) {
      console.warn(`Timeframe ${newTimeframe} is not supported by Kuma SDK`);
      return;
    }

    // MEMORY LEAK FIX: Clear previous timeout before creating new one
    if (processingTimeoutRef.current) {
      clearTimeout(processingTimeoutRef.current);
      processingTimeoutRef.current = null;
    }

    setIsProcessingTimeframe(true);
    setTimeframe(newTimeframe);
    // Reset processing state after a short delay
    processingTimeoutRef.current = setTimeout(() => {
      setIsProcessingTimeframe(false);
      processingTimeoutRef.current = null;
    }, 300);
  }, []);

  // Handle chart ready state
  const handleChartReady = useCallback((ready: boolean) => {
    setChartReady(ready);
  }, []);

  // Handle chart errors
  const handleChartError = useCallback((error: string) => {
    setChartError(error);
  }, []);

  // Handle retry actions
  const handleRetry = useCallback(() => {
    retryCountRef.current = 0;
    if (autoRetryTimerRef.current) {
      clearTimeout(autoRetryTimerRef.current);
      autoRetryTimerRef.current = null;
    }
    setChartError(null);
    setRenderKey((prev) => prev + 1);
    setChartReady(false);
  }, []);

  // Show error state
  if (error || chartError) {
    const attemptsLeft = MAX_AUTO_RETRIES - retryCountRef.current;
    const willAutoRetry = attemptsLeft > 0;
    return (
      <Box
        sx={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
          p: 4,
        }}
      >
        <Typography variant="h6" sx={{ color: '#FF4444' }}>
          Chart Error
        </Typography>
        <Typography variant="body2" sx={{ color: '#999', textAlign: 'center' }}>
          {error || chartError}
        </Typography>
        {willAutoRetry ? (
          <Typography variant="caption" sx={{ color: '#666' }}>
            Auto-retrying… ({retryCountRef.current + 1}/{MAX_AUTO_RETRIES})
          </Typography>
        ) : null}
        <Typography
          variant="body2"
          onClick={handleRetry}
          sx={{
            color: '#00F5E0',
            cursor: 'pointer',
            '&:hover': { textDecoration: 'underline' },
          }}
        >
          Retry now
        </Typography>
      </Box>
    );
  }

  // Show loading state
  if (isLoadingHistory || candleData.length === 0) {
    return (
      <Box
        sx={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
        }}
      >
        <Box
          sx={{
            width: 40,
            height: 40,
            border: '3px solid #00F5E0',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            '@keyframes spin': {
              '0%': { transform: 'rotate(0deg)' },
              '100%': { transform: 'rotate(360deg)' },
            },
          }}
        />
        <Typography variant="body2" sx={{ color: '#999' }}>
          {isLoadingHistory
            ? 'Loading historical data...'
            : isConnected
            ? 'Waiting for candle data...'
            : 'Connecting to market data...'}
        </Typography>
        <Typography variant="caption" sx={{ color: '#666' }}>
          {market} • {interval}
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      key={renderKey}
      sx={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        p: 2, // Add padding to show glow box border
      }}
    >
      {/* Timeframe Selector */}
      <Box
        sx={{
          position: 'absolute',
          top: 8,
          left: 8,
          right: 8,
          zIndex: 20,
        }}
      >
        <TimeframeSelector
          selectedTimeframe={timeframe}
          onTimeframeChange={handleTimeframeChange}
          isProcessingTimeframe={isProcessingTimeframe}
          variant="mobile"
        />
      </Box>

      {/* Chart Container */}
      <Box
        sx={{
          width: '100%',
          flex: 1,
          minHeight: 0,
          pt: '38px', // Add padding top to account for timeframe selector
          overflow: 'hidden',
        }}
      >
        <ChartContainer
          tokenAddress={market} // Use market as identifier
          enabled={candleData.length > 0}
          chartData={candleData}
          renderKey={renderKey}
          resolution="hour" // Generic resolution
          onChartReady={handleChartReady}
          onError={handleChartError}
          chainType="katana" // Reuse existing chain type
          currentTimeframe={timeframe}
        />
      </Box>
    </Box>
  );
};

export default KumaCandlestickChart;
