'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import {
  WebSocketClient,
  KatanaPerpsCandleEvent,
  KatanaPerpsCandleEventData,
  CandleInterval,
} from '@katanaperps/katana-perps-sdk';
import { CandlestickData, UTCTimestamp } from 'lightweight-charts';

export interface UseKumaCandleWebSocketOptions {
  market: string;
  interval: CandleInterval;
  enabled?: boolean;
}

interface HistoricalCandleData {
  start: number;
  open: string;
  high: string;
  low: string;
  close: string;
}

export function useKumaCandleWebSocket({
  market = 'BTC-USD',
  interval = CandleInterval.FIVE_MINUTES,
  enabled = true,
}: UseKumaCandleWebSocketOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [candleData, setCandleData] = useState<CandlestickData[]>([]);
  const [latestCandle, setLatestCandle] = useState<KatanaPerpsCandleEventData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const wsClientRef = useRef<WebSocketClient | null>(null);
  const candleMapRef = useRef<Map<number, CandlestickData>>(new Map());
  const updateCandleDataRef = useRef<((data: KatanaPerpsCandleEventData) => void) | null>(null);

  // Transform Kuma candle to Lightweight Charts format
  const transformCandle = useCallback((kumaCandleData: KatanaPerpsCandleEventData): CandlestickData => {
    // Ensure timestamp is in seconds (Lightweight Charts uses seconds)
    let timestamp = kumaCandleData.start;
    if (timestamp > 10000000000) {
      timestamp = Math.floor(timestamp / 1000);
    }

    return {
      time: timestamp as UTCTimestamp,
      open: parseFloat(kumaCandleData.open),
      high: parseFloat(kumaCandleData.high),
      low: parseFloat(kumaCandleData.low),
      close: parseFloat(kumaCandleData.close),
    };
  }, []);

  // Update or add candle to the map
  const updateCandleData = useCallback(
    (kumaCandleData: KatanaPerpsCandleEventData) => {
      const transformedCandle = transformCandle(kumaCandleData);
      const timestamp = kumaCandleData.start;

      // Update the map
      candleMapRef.current.set(timestamp, transformedCandle);

      // MEMORY LEAK FIX: Limit candles to prevent unbounded growth
      // Keep only the most recent 500 candles
      const MAX_CANDLES = 500;
      if (candleMapRef.current.size > MAX_CANDLES) {
        const sortedKeys = Array.from(candleMapRef.current.keys()).sort((a, b) => a - b);
        const keysToDelete = sortedKeys.slice(0, sortedKeys.length - MAX_CANDLES);
        keysToDelete.forEach(key => candleMapRef.current.delete(key));
      }

      // Convert map to sorted array
      const sortedCandles = Array.from(candleMapRef.current.values()).sort(
        (a, b) => (a.time as number) - (b.time as number)
      );

      setCandleData(sortedCandles);
      setLatestCandle(kumaCandleData);
    },
    [transformCandle]
  );

  // MEMORY LEAK FIX: Update ref to prevent WebSocket reconnections
  useEffect(() => {
    updateCandleDataRef.current = updateCandleData;
  }, [updateCandleData]);

  // Fetch historical candles on mount or when market/interval changes
  useEffect(() => {
    if (!enabled) return;

    const fetchHistoricalCandles = async () => {
      setIsLoadingHistory(true);
      try {
        // Use Next.js API route as proxy to avoid CORS issues
        const response = await fetch(
          `/api/kuma/candles?market=${market}&interval=${interval}&limit=100`
        );

        if (!response.ok) {
          throw new Error(`API responded with status: ${response.status}`);
        }

        const historicalCandles: HistoricalCandleData[] = await response.json();

        // Transform and populate the candle map
        historicalCandles.forEach((candle) => {
          // Ensure timestamp is in seconds (Lightweight Charts uses seconds)
          // If timestamp is > 10000000000, it's in milliseconds, convert to seconds
          let timestamp = candle.start;
          if (timestamp > 10000000000) {
            timestamp = Math.floor(timestamp / 1000);
          }

          const transformedCandle: CandlestickData = {
            time: timestamp as UTCTimestamp,
            open: parseFloat(candle.open),
            high: parseFloat(candle.high),
            low: parseFloat(candle.low),
            close: parseFloat(candle.close),
          };
          candleMapRef.current.set(timestamp, transformedCandle);
        });

        // Update state with sorted candles
        const sortedCandles = Array.from(candleMapRef.current.values()).sort(
          (a, b) => (a.time as number) - (b.time as number)
        );
        setCandleData(sortedCandles);
        setIsLoadingHistory(false);
      } catch (err) {
        console.error('[Kuma Candles] Error fetching historical candles:', err);
        setError(`Failed to load historical data: ${err}`);
        setIsLoadingHistory(false);
      }
    };

    fetchHistoricalCandles();
  }, [market, interval, enabled]);

  // WebSocket connection for real-time updates
  useEffect(() => {
    if (!enabled) {
      // Cleanup if disabled
      if (wsClientRef.current?.isConnected) {
        wsClientRef.current.disconnect();
      }
      return;
    }

    const wsClient = new WebSocketClient({ sandbox: process.env.NEXT_PUBLIC_KATANA_PERPS_SANDBOX === 'true' });
    wsClientRef.current = wsClient;

    // Handle connection event
    wsClient.onConnect(() => {
      setIsConnected(true);
      setError(null);

      // Subscribe to candle data for the specified market and interval
      wsClient.subscribePublic([
        {
          name: 'candles',
          interval: interval,
          markets: [market], // Markets must be in the subscription object for candles
        },
      ]);
    });

    // Handle incoming messages
    wsClient.onMessage((event) => {
      if (event.type === 'error') {
        console.error('[Kuma Candles] Server error:', event.data);
        setError(event.data.message || 'Server error');
        return;
      }

      if (event.type === 'candles') {
        const candleEvent = event as KatanaPerpsCandleEvent;

        // Only process candles for the subscribed market and interval
        if (
          candleEvent.data.market === market &&
          candleEvent.data.interval === interval
        ) {
          // MEMORY LEAK FIX: Use ref to avoid WebSocket reconnections
          updateCandleDataRef.current?.(candleEvent.data);
        }
      }
    });

    // Handle disconnection
    wsClient.onDisconnect(() => {
      setIsConnected(false);
    });

    // Handle errors
    wsClient.onError((err) => {
      console.error('[Kuma Candles] WebSocket error:', err);
      setError(err.message || 'WebSocket error occurred');
      setIsConnected(false);
    });

    // Connect to WebSocket
    wsClient.connect();

    // Cleanup on unmount or when dependencies change
    return () => {
      if (wsClient.isConnected) {
        wsClient.disconnect();
      }
    };
  }, [market, interval, enabled]); // MEMORY LEAK FIX: Removed updateCandleData to prevent reconnections

  // Clear candle data when market or interval changes
  useEffect(() => {
    candleMapRef.current.clear();
    setCandleData([]);
    setLatestCandle(null);
  }, [market, interval]);

  return {
    isConnected,
    candleData,
    latestCandle,
    error,
    isLoadingHistory,
    wsClient: wsClientRef.current,
  };
}
