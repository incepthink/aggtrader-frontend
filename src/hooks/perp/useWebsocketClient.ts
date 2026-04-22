'use client';

import { useEffect, useState, useRef } from 'react';
import { WebSocketClient, KatanaPerpsTickerEvent, KatanaPerpsTicker } from '@katanaperps/katana-perps-sdk';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 3000;

export function useKumaWebSocket(market: string = 'BTC-USD') {
  const [isConnected, setIsConnected] = useState(false);
  const [tickerData, setTickerData] = useState<KatanaPerpsTicker | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const wsClientRef = useRef<WebSocketClient | null>(null);
  const retryCountRef = useRef(0);
  const retryTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isCancelledRef = useRef(false);

  const isLoading = tickerData === null && !error;

  useEffect(() => {
    isCancelledRef.current = false;
    retryCountRef.current = 0;
    setRetryCount(0);
    setTickerData(null);
    setError(null);
    setIsConnected(false);

    const sandbox = process.env.NEXT_PUBLIC_KATANA_PERPS_SANDBOX === 'true';
    const wsClient = new WebSocketClient({ sandbox });
    wsClientRef.current = wsClient;

    const scheduleRetry = (errMsg: string) => {
      if (isCancelledRef.current) return;
      if (retryCountRef.current >= MAX_RETRIES) return;

      retryCountRef.current += 1;
      setRetryCount(retryCountRef.current);

      retryTimerRef.current = setTimeout(() => {
        if (isCancelledRef.current) return;
        setError(null);
        connectAndSubscribe();
      }, RETRY_DELAY_MS);
    };

    wsClient.onConnect(() => {
      if (isCancelledRef.current) return;
      setIsConnected(true);
      setError(null);
    });

    wsClient.onMessage((event) => {
      if (isCancelledRef.current) return;
      if (event.type === 'tickers') {
        const tickerEvent = event as KatanaPerpsTickerEvent;
        if (tickerEvent.data.market === market) {
          setTickerData(tickerEvent.data);
          // Reset retry count on successful data
          retryCountRef.current = 0;
          setRetryCount(0);
        }
      }
    });

    wsClient.onDisconnect(() => {
      if (isCancelledRef.current) return;
      setIsConnected(false);
    });

    wsClient.onError((err) => {
      if (isCancelledRef.current) return;
      console.error('Katana Perps WebSocket error:', err);
      const msg = err.message || 'WebSocket error occurred';
      setError(msg);
      setIsConnected(false);
      scheduleRetry(msg);
    });

    const connectAndSubscribe = async () => {
      try {
        await wsClient.connect();
        if (isCancelledRef.current) return;
        wsClient.subscribePublic([{ name: 'tickers' }], [market]);
      } catch (err: any) {
        if (isCancelledRef.current) return;
        console.error('Katana Perps WebSocket connection failed:', err);
        const msg = err.message || 'WebSocket connection failed';
        setError(msg);
        setIsConnected(false);
        scheduleRetry(msg);
      }
    };

    connectAndSubscribe();

    return () => {
      isCancelledRef.current = true;
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
      if (wsClient.isConnected) {
        wsClient.disconnect();
      }
    };
  }, [market]);

  return {
    isConnected,
    tickerData,
    error,
    isLoading,
    retryCount,
    wsClient: wsClientRef.current,
  };
}
