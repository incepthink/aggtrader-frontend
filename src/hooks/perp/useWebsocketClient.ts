'use client';

import { useEffect, useState, useRef } from 'react';
import { WebSocketClient, KumaTickerEvent, KumaTicker } from '@kumabid/kuma-sdk';

export function useKumaWebSocket(market: string = 'BTC-USD') {
  const [isConnected, setIsConnected] = useState(false);
  const [tickerData, setTickerData] = useState<KumaTicker | null>(null);
  const [error, setError] = useState<string | null>(null);
  const wsClientRef = useRef<WebSocketClient | null>(null);

  useEffect(() => {
    // Create WebSocket client instance
    const wsClient = new WebSocketClient();
    wsClientRef.current = wsClient;

    // Handle connection event
    wsClient.onConnect(() => {
      setIsConnected(true);
      setError(null);

      // Subscribe to ticker data for the specified market
      wsClient.subscribePublic(
        [{ name: 'tickers' }],
        [market]
      );
    });

    // Handle incoming messages
    wsClient.onMessage((event) => {
      if (event.type === 'tickers') {
        const tickerEvent = event as KumaTickerEvent;
        if (tickerEvent.data.market === market) {
          setTickerData(tickerEvent.data);
        }
      }
    });

    // Handle disconnection
    wsClient.onDisconnect(() => {
      setIsConnected(false);
    });

    // Handle errors
    wsClient.onError((err) => {
      console.error('Kuma WebSocket error:', err);
      setError(err.message || 'WebSocket error occurred');
      setIsConnected(false);
    });

    // Connect to WebSocket
    wsClient.connect();

    // Cleanup on unmount
    return () => {
      if (wsClient.isConnected) {
        wsClient.disconnect();
      }
    };
  }, [market]);

  return {
    isConnected,
    tickerData,
    error,
    wsClient: wsClientRef.current,
  };
}