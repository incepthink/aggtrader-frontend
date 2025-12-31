'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import {
  WebSocketClient,
  KumaOrderBookLevel2Event,
  KumaTradeEvent,
  KumaTradeEventData,
  RestResponseGetOrderBookLevel2,
  OrderBookPriceLevel,
  RestPublicClient,
} from '@kumabid/kuma-sdk';

export function useOrderbookTrades(market: string = 'BTC-USD') {
  const [isConnected, setIsConnected] = useState(false);
  const [orderbookData, setOrderbookData] =
    useState<RestResponseGetOrderBookLevel2 | null>(null);
  const [trades, setTrades] = useState<KumaTradeEventData[]>([]);
  const [error, setError] = useState<string | null>(null);

  const wsClientRef = useRef<WebSocketClient | null>(null);

  // Maintain orderbook state using Maps for efficient updates
  const bidsMapRef = useRef<Map<string, OrderBookPriceLevel>>(new Map());
  const asksMapRef = useRef<Map<string, OrderBookPriceLevel>>(new Map());
  const lastPriceRef = useRef<string | null>(null);
  const markPriceRef = useRef<string | null>(null);
  const indexPriceRef = useRef<string | null>(null);
  const mergeOrderbookUpdateRef = useRef<((update: KumaOrderBookLevel2Event['data']) => void) | null>(null);

  // Merge orderbook updates
  const mergeOrderbookUpdate = useCallback((update: KumaOrderBookLevel2Event['data']) => {
    // Update price data
    if (update.lastPrice !== undefined) lastPriceRef.current = update.lastPrice;
    if (update.markPrice !== undefined) markPriceRef.current = update.markPrice;
    if (update.indexPrice !== undefined) indexPriceRef.current = update.indexPrice;

    // Update bids
    if (update.bids && update.bids.length > 0) {
      update.bids.forEach((bid) => {
        const [price, size] = bid;
        if (parseFloat(size) === 0) {
          // Remove price level if size is 0
          bidsMapRef.current.delete(price);
        } else {
          // Add or update price level
          bidsMapRef.current.set(price, bid);
        }
      });
    }

    // Update asks
    if (update.asks && update.asks.length > 0) {
      update.asks.forEach((ask) => {
        const [price, size] = ask;
        if (parseFloat(size) === 0) {
          // Remove price level if size is 0
          asksMapRef.current.delete(price);
        } else {
          // Add or update price level
          asksMapRef.current.set(price, ask);
        }
      });
    }

    // Convert Maps to sorted arrays
    // Bids: highest price first (descending)
    const bidsArray = Array.from(bidsMapRef.current.values())
      .sort((a, b) => parseFloat(b[0]) - parseFloat(a[0]))
      .slice(0, 30); // Keep top 30 levels

    // Asks: lowest price first (ascending)
    const asksArray = Array.from(asksMapRef.current.values())
      .sort((a, b) => parseFloat(a[0]) - parseFloat(b[0]))
      .slice(0, 30); // Keep top 30 levels

    // CRITICAL MEMORY LEAK FIX: Clear and rebuild Maps with only the top 30 levels
    // Without this, Maps grow indefinitely as new price levels are added
    if (bidsMapRef.current.size > 30) {
      bidsMapRef.current.clear();
      bidsArray.forEach((bid) => {
        bidsMapRef.current.set(bid[0], bid);
      });
    }

    if (asksMapRef.current.size > 30) {
      asksMapRef.current.clear();
      asksArray.forEach((ask) => {
        asksMapRef.current.set(ask[0], ask);
      });
    }

    // Create orderbook snapshot
    const orderbook: RestResponseGetOrderBookLevel2 = {
      sequence: update.sequence,
      bids: bidsArray,
      asks: asksArray,
      lastPrice: lastPriceRef.current,
      markPrice: markPriceRef.current,
      indexPrice: indexPriceRef.current,
    };

    setOrderbookData(orderbook);
  }, []);

  // MEMORY LEAK FIX: Update ref to prevent WebSocket reconnections
  useEffect(() => {
    mergeOrderbookUpdateRef.current = mergeOrderbookUpdate;
  }, [mergeOrderbookUpdate]);

  useEffect(() => {
    // Reset state when market changes
    bidsMapRef.current.clear();
    asksMapRef.current.clear();
    lastPriceRef.current = null;
    markPriceRef.current = null;
    indexPriceRef.current = null;
    setOrderbookData(null);
    setTrades([]); // Reset trades

    // Fetch initial trades from REST API
    const fetchInitialTrades = async () => {
      try {
        const restClient = new RestPublicClient();
        const tradesResponse = await restClient.getTrades({
          market,
          limit: 50, // Fetch last 50 trades
        });

        // Convert REST trades to WebSocket trade format
        // REST API doesn't include market in response, so we add it from the request param
        const initialTrades: KumaTradeEventData[] = tradesResponse.map((trade, index) => ({
          ...trade,
          market, // Add market from the request parameter
        }));

        setTrades(initialTrades);
      } catch (error) {
        // Silently fail - trades will populate from WebSocket
        // Network errors are common on page load and don't affect functionality
      }
    };

    // Fetch initial trades with slight delay to avoid race conditions
    const fetchTimer = setTimeout(() => {
      fetchInitialTrades();
    }, 100);

    // Create WebSocket client instance
    const wsClient = new WebSocketClient();
    wsClientRef.current = wsClient;

    // Handle connection event
    wsClient.onConnect(() => {
      setIsConnected(true);
      setError(null);

      // Subscribe to level 2 orderbook and trades
      wsClient.subscribePublic(
        [{ name: 'l2orderbook' }, { name: 'trades' }],
        [market]
      );
    });

    // Handle incoming messages
    wsClient.onMessage((event) => {
      if (event.type === 'l2orderbook') {
        const orderbookEvent = event as KumaOrderBookLevel2Event;
        if (orderbookEvent.data.market === market) {
          // MEMORY LEAK FIX: Use ref to avoid WebSocket reconnections
          mergeOrderbookUpdateRef.current?.(orderbookEvent.data);
        }
      } else if (event.type === 'trades') {
        const tradeEvent = event as KumaTradeEvent;
        if (tradeEvent.data.market === market) {
          // Add new trade to the beginning and keep last 100 trades
          // Check for duplicates based on fillId
          setTrades((prevTrades) => {
            const isDuplicate = prevTrades.some(
              (trade) => trade.fillId === tradeEvent.data.fillId
            );
            if (isDuplicate) {
              return prevTrades;
            }
            return [tradeEvent.data, ...prevTrades].slice(0, 100);
          });
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
      clearTimeout(fetchTimer);
      if (wsClient.isConnected) {
        wsClient.disconnect();
      }
    };
  }, [market]); // MEMORY LEAK FIX: Removed mergeOrderbookUpdate to prevent reconnections

  return {
    isConnected,
    orderbookData,
    trades,
    error,
    wsClient: wsClientRef.current,
  };
}
