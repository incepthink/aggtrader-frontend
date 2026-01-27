'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { WebSocketClient } from '@katanaperps/katana-perps-sdk';
import { useAccount } from 'wagmi';
import {
  KatanaPerpsOrder,
  KatanaPerpsOrderFill,
  OrderStatus,
  OrderType,
  OrderSide,
  TimeInForce,
  SelfTradePrevention,
  TriggerType,
} from './useKatanaPerpsOrders';

/**
 * Fetch WebSocket authentication token from our API
 */
async function fetchWsAuthToken(wallet: string): Promise<string> {
  const response = await fetch('/api/kuma/ws-auth-token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ wallet }),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch WebSocket auth token');
  }

  const data = await response.json();
  return data.token;
}


/**
 * Order update types from WebSocket
 */
export type OrderUpdateType =
  | 'new'
  | 'canceled'
  | 'fill'
  | 'partial'
  | 'triggered'
  | 'activated'
  | 'expired'
  | 'rejected';

/**
 * Raw fill data from WebSocket (short field names)
 */
interface RawFillData {
  i: string; // fillId
  p: string; // price
  q: string; // quantity
  Q: string; // quoteQuantity
  t: number; // time
  s: string; // makerSide
  u: number; // sequence
  f: string; // fee
  l: string; // liquidity (maker/taker)
  a?: string; // action (open/close)
  P?: string; // positionSide (long/short)
  y?: string; // orderType
  T: string; // txId
  S: string; // txStatus
}

/**
 * Raw order data from WebSocket (short field names)
 */
interface RawOrderData {
  m: string; // market
  i: string; // orderId
  c?: string; // clientOrderId
  w: string; // wallet
  t: number; // executionTime
  T: number; // time (initial processing)
  x: OrderUpdateType; // update type
  X: OrderStatus; // status
  u?: number; // sequence (order book update)
  ec?: string; // errorCode
  em?: string; // errorMessage
  o: OrderType; // type
  s: OrderSide; // side
  q: string; // originalQuantity
  z: string; // executedQuantity
  Z?: string; // cumulativeQuoteQuantity
  v?: string; // avgExecutionPrice
  p?: string; // price
  P?: string; // triggerPrice
  tt?: TriggerType; // triggerType
  r: boolean; // reduceOnly
  f?: TimeInForce; // timeInForce
  V: SelfTradePrevention; // selfTradePrevention
  dk?: string; // delegatedKey
  F?: RawFillData[]; // fills
}

/**
 * WebSocket order event
 */
interface OrderWebSocketEvent {
  type: 'orders';
  data: RawOrderData;
}

/**
 * Transform raw fill data to KatanaPerpsOrderFill format
 */
function transformFillData(raw: RawFillData): KatanaPerpsOrderFill {
  return {
    fillId: raw.i,
    price: raw.p,
    quantity: raw.q,
    quoteQuantity: raw.Q,
    time: raw.t,
    makerSide: raw.s as OrderSide,
    sequence: raw.u,
    fee: raw.f,
    feeAsset: 'USD', // Default, may need to be fetched from elsewhere
    gas: '0', // Not provided in WebSocket
    liquidity: raw.l as 'maker' | 'taker',
    txId: raw.T,
    txStatus: raw.S as 'pending' | 'mined' | 'failed',
  };
}

/**
 * Transform raw WebSocket order data to KatanaPerpsOrder format
 */
function transformOrderData(raw: RawOrderData): KatanaPerpsOrder & {
  updateType: OrderUpdateType;
  executionTime: number;
} {
  return {
    market: raw.m,
    orderId: raw.i,
    clientOrderId: raw.c,
    wallet: raw.w,
    time: raw.T,
    status: raw.X,
    errorCode: raw.ec,
    errorMessage: raw.em,
    type: raw.o,
    side: raw.s,
    originalQuantity: raw.q,
    executedQuantity: raw.z,
    cumulativeQuoteQuantity: raw.Z || '0',
    avgExecutionPrice: raw.v,
    price: raw.p,
    triggerPrice: raw.P,
    triggerType: raw.tt,
    reduceOnly: raw.r,
    timeInForce: raw.f,
    selfTradePrevention: raw.V,
    delegatedKey: raw.dk,
    fills: raw.F?.map(transformFillData),
    // Extra fields for tracking
    updateType: raw.x,
    executionTime: raw.t,
  };
}

/**
 * Check if an order is considered "open" (active on the order book)
 */
function isOpenOrder(status: OrderStatus): boolean {
  return status === 'open' || status === 'active' || status === 'partiallyFilled';
}

interface UseOrdersWebSocketOptions {
  enabled?: boolean;
  /** Filter orders by market */
  market?: string;
}

/**
 * Hook for real-time orders updates via WebSocket
 * Provides live order updates including placements, fills, and cancellations
 */
export function useOrdersWebSocket(options: UseOrdersWebSocketOptions = {}) {
  const { enabled = true, market: marketFilter } = options;
  const { address, isConnected: walletConnected } = useAccount();

  const [isConnected, setIsConnected] = useState(false);
  const [orders, setOrders] = useState<Map<string, KatanaPerpsOrder & { updateType: OrderUpdateType }>>(new Map());
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<number | null>(null);

  const wsClientRef = useRef<WebSocketClient | null>(null);
  const updateOrderRef = useRef<((data: RawOrderData) => void) | null>(null);

  // Update or add order to the map
  const updateOrder = useCallback((rawData: RawOrderData) => {
    const transformedOrder = transformOrderData(rawData);
    const orderId = transformedOrder.orderId;

    setOrders((prev) => {
      const newMap = new Map(prev);

      // Check if order should be removed (closed statuses)
      if (!isOpenOrder(transformedOrder.status)) {
        // Remove closed orders from the open orders map
        newMap.delete(orderId);
      } else {
        // Update or add open orders
        const existing = newMap.get(orderId);
        if (existing) {
          // Merge with existing, preserve fills history
          const existingFills = existing.fills || [];
          const newFills = transformedOrder.fills || [];
          const mergedFills = [...existingFills];

          // Add new fills that don't exist
          for (const fill of newFills) {
            if (!mergedFills.some((f) => f.fillId === fill.fillId)) {
              mergedFills.push(fill);
            }
          }

          newMap.set(orderId, {
            ...existing,
            ...transformedOrder,
            fills: mergedFills,
          });
        } else {
          newMap.set(orderId, transformedOrder);
        }
      }

      return newMap;
    });

    setLastUpdate(Date.now());
  }, []);

  // Keep ref updated to avoid WebSocket reconnections
  useEffect(() => {
    updateOrderRef.current = updateOrder;
  }, [updateOrder]);

  // WebSocket connection
  useEffect(() => {
    if (!enabled || !walletConnected || !address) {
      // Cleanup if disabled or wallet not connected
      if (wsClientRef.current?.isConnected) {
        wsClientRef.current.disconnect();
      }
      return;
    }

    // Determine if using sandbox (Bokuto testnet) or mainnet
    const sandbox = process.env.NEXT_PUBLIC_KATANA_PERPS_SANDBOX === 'true';

    // Create WebSocket client instance with authentication for authenticated subscriptions
    // If authentication fails, we gracefully fall back to REST API
    const wsClient = new WebSocketClient({
      sandbox,
      wallet: address,
      websocketAuthTokenFetch: async () => {
        try {
          return await fetchWsAuthToken(address);
        } catch (err) {
          console.warn('[Orders WS] Auth token fetch failed, falling back to REST API');
          throw err;
        }
      },
    });
    wsClientRef.current = wsClient;

    let isCancelled = false;

    // Handle connection event
    wsClient.onConnect(() => {
      console.log('[Orders WS] Connected');
      setIsConnected(true);
      setError(null);
    });

    // Handle incoming messages
    wsClient.onMessage((event: any) => {
      if (event.type === 'error') {
        // Don't log auth errors repeatedly
        if (!event.data?.message?.includes('auth')) {
          console.error('[Orders WS] Server error:', event.data);
        }
        setError(event.data?.message || 'Server error');
        return;
      }

      if (event.type === 'orders') {
        const orderEvent = event as OrderWebSocketEvent;
        // Only process orders for the connected wallet
        if (orderEvent.data.w?.toLowerCase() === address?.toLowerCase()) {
          updateOrderRef.current?.(orderEvent.data);
        }
      }
    });

    // Handle disconnection
    wsClient.onDisconnect(() => {
      console.log('[Orders WS] Disconnected');
      setIsConnected(false);
    });

    // Handle errors - don't log auth-related errors repeatedly
    wsClient.onError((err: any) => {
      const errorMsg = err?.message || err?.error?.message || 'WebSocket error';
      if (!errorMsg.includes('auth') && !errorMsg.includes('websocketAuthTokenFetch')) {
        console.error('[Orders WS] Error:', err);
      }
      setError(errorMsg);
      setIsConnected(false);
    });

    // Connect to WebSocket and then subscribe
    // IMPORTANT: subscribeAuthenticated must be called AFTER connect() resolves
    const connectAndSubscribe = async () => {
      try {
        await wsClient.connect();

        if (isCancelled) return;

        // Subscribe to orders for the connected wallet
        // Orders is an authenticated subscription
        try {
          wsClient.subscribeAuthenticated([
            { name: 'orders' },
          ]);
        } catch (err: any) {
          // Auth subscription failed, will fall back to REST API
          console.warn('[Orders WS] Auth subscription failed:', err.message);
          setError('Auth required - using REST API');
          setIsConnected(false);
        }
      } catch (err: any) {
        // Connection failed, will use REST API fallback
        if (!isCancelled) {
          console.warn('[Orders WS] Connection failed, using REST API:', err?.message);
          setIsConnected(false);
        }
      }
    };

    connectAndSubscribe();

    // Cleanup on unmount or when dependencies change
    return () => {
      isCancelled = true;
      if (wsClient.isConnected) {
        wsClient.disconnect();
      }
    };
  }, [enabled, walletConnected, address]);

  // Clear orders when wallet changes
  useEffect(() => {
    setOrders(new Map());
    setLastUpdate(null);
  }, [address]);

  // Convert map to array and apply market filter
  let ordersArray = Array.from(orders.values());

  if (marketFilter) {
    ordersArray = ordersArray.filter((o) => o.market === marketFilter);
  }

  return {
    isConnected,
    orders: ordersArray,
    ordersMap: orders,
    error,
    lastUpdate,
    wsClient: wsClientRef.current,
  };
}

/**
 * Helper to merge WebSocket orders with REST API orders
 * WebSocket provides real-time updates for order status changes
 */
export function mergeOrders(
  restOrders: KatanaPerpsOrder[],
  wsOrders: Map<string, KatanaPerpsOrder & { updateType: OrderUpdateType }>
): KatanaPerpsOrder[] {
  const merged = new Map<string, KatanaPerpsOrder>();

  // Start with REST orders as base
  for (const order of restOrders) {
    merged.set(order.orderId, order);
  }

  // Apply WebSocket updates
  for (const [orderId, wsOrder] of wsOrders) {
    if (!isOpenOrder(wsOrder.status)) {
      // Remove closed orders
      merged.delete(orderId);
    } else {
      const existing = merged.get(orderId);
      if (existing) {
        // Merge with existing, WebSocket data takes precedence
        const existingFills = existing.fills || [];
        const wsFills = wsOrder.fills || [];
        const mergedFills = [...existingFills];

        // Add new fills
        for (const fill of wsFills) {
          if (!mergedFills.some((f) => f.fillId === fill.fillId)) {
            mergedFills.push(fill);
          }
        }

        merged.set(orderId, {
          ...existing,
          status: wsOrder.status,
          executedQuantity: wsOrder.executedQuantity,
          cumulativeQuoteQuantity: wsOrder.cumulativeQuoteQuantity,
          avgExecutionPrice: wsOrder.avgExecutionPrice,
          errorCode: wsOrder.errorCode,
          errorMessage: wsOrder.errorMessage,
          fills: mergedFills,
        });
      } else {
        // New order from WebSocket
        merged.set(orderId, wsOrder);
      }
    }
  }

  return Array.from(merged.values());
}
