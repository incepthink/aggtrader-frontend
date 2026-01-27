'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { WebSocketClient } from '@katanaperps/katana-perps-sdk';
import { useAccount } from 'wagmi';
import { KatanaPerpsPosition } from './useKatanaPerpsPositions';

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
 * Raw position data from WebSocket (short field names)
 */
interface RawPositionData {
  w: string; // wallet
  m: string; // market
  X: string; // status (open or closed)
  q: string; // quantity
  mq: string; // maximumQuantity
  np: string; // entryPrice
  xp: string; // exitPrice
  rn: string; // realizedPnL
  f: string; // totalFunding
  to: string; // totalOpen
  tc: string; // totalClose
  of: string; // openedByFillId
  lf: string; // lastFillId
  qb: string; // quoteBalance
  t: number; // time
}

/**
 * WebSocket position event
 */
interface PositionWebSocketEvent {
  type: 'positions';
  data: RawPositionData;
}

/**
 * Transform raw WebSocket position data to KatanaPerpsPosition format
 */
function transformPositionData(raw: RawPositionData): Partial<KatanaPerpsPosition> & {
  market: string;
  quantity: string;
  status: 'open' | 'closed';
} {
  return {
    market: raw.m,
    quantity: raw.q,
    maximumQuantity: raw.mq,
    entryPrice: raw.np,
    exitPrice: raw.xp,
    realizedPnL: raw.rn,
    totalFunding: raw.f,
    totalOpen: raw.to,
    totalClose: raw.tc,
    openedByFillId: raw.of,
    lastFillId: raw.lf,
    time: raw.t,
    // Fields not provided by WebSocket - need to be fetched or calculated
    markPrice: '0',
    indexPrice: '0',
    liquidationPrice: '0',
    value: '0',
    unrealizedPnL: '0',
    marginRequirement: '0',
    leverage: '0',
    adlQuintile: 0,
    // Status field for tracking
    status: raw.X as 'open' | 'closed',
  };
}

interface UsePositionsWebSocketOptions {
  enabled?: boolean;
}

/**
 * Hook for real-time positions updates via WebSocket
 * Provides live position updates and merges them with initial data
 */
export function usePositionsWebSocket(options: UsePositionsWebSocketOptions = {}) {
  const { enabled = true } = options;
  const { address, isConnected: walletConnected } = useAccount();

  const [isConnected, setIsConnected] = useState(false);
  const [positions, setPositions] = useState<Map<string, Partial<KatanaPerpsPosition> & { status: 'open' | 'closed' }>>(new Map());
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<number | null>(null);

  const wsClientRef = useRef<WebSocketClient | null>(null);
  const updatePositionRef = useRef<((data: RawPositionData) => void) | null>(null);

  // Update or add position to the map
  const updatePosition = useCallback((rawData: RawPositionData) => {
    const transformedPosition = transformPositionData(rawData);
    const market = transformedPosition.market;

    setPositions((prev) => {
      const newMap = new Map(prev);

      if (transformedPosition.status === 'closed') {
        // Remove closed positions
        newMap.delete(market);
      } else {
        // Update or add open positions
        const existing = newMap.get(market);
        newMap.set(market, {
          ...existing,
          ...transformedPosition,
        });
      }

      return newMap;
    });

    setLastUpdate(Date.now());
  }, []);

  // Keep ref updated to avoid WebSocket reconnections
  useEffect(() => {
    updatePositionRef.current = updatePosition;
  }, [updatePosition]);

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
          console.warn('[Positions WS] Auth token fetch failed, falling back to REST API');
          throw err;
        }
      },
    });
    wsClientRef.current = wsClient;

    let isCancelled = false;

    // Handle connection event
    wsClient.onConnect(() => {
      console.log('[Positions WS] Connected');
      setIsConnected(true);
      setError(null);
    });

    // Handle incoming messages
    wsClient.onMessage((event: any) => {
      if (event.type === 'error') {
        // Don't log auth errors repeatedly
        if (!event.data?.message?.includes('auth')) {
          console.error('[Positions WS] Server error:', event.data);
        }
        setError(event.data?.message || 'Server error');
        return;
      }

      if (event.type === 'positions') {
        const positionEvent = event as PositionWebSocketEvent;
        // Only process positions for the connected wallet
        if (positionEvent.data.w?.toLowerCase() === address?.toLowerCase()) {
          updatePositionRef.current?.(positionEvent.data);
        }
      }
    });

    // Handle disconnection
    wsClient.onDisconnect(() => {
      console.log('[Positions WS] Disconnected');
      setIsConnected(false);
    });

    // Handle errors - don't log auth-related errors repeatedly
    wsClient.onError((err: any) => {
      const errorMsg = err?.message || err?.error?.message || 'WebSocket error';
      if (!errorMsg.includes('auth') && !errorMsg.includes('websocketAuthTokenFetch')) {
        console.error('[Positions WS] Error:', err);
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

        // Subscribe to positions for the connected wallet
        // Positions is an authenticated subscription
        try {
          wsClient.subscribeAuthenticated([
            { name: 'positions' },
          ]);
        } catch (err: any) {
          // Auth subscription failed, will fall back to REST API
          console.warn('[Positions WS] Auth subscription failed:', err.message);
          setError('Auth required - using REST API');
          setIsConnected(false);
        }
      } catch (err: any) {
        // Connection failed, will use REST API fallback
        if (!isCancelled) {
          console.warn('[Positions WS] Connection failed, using REST API:', err?.message);
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

  // Clear positions when wallet changes
  useEffect(() => {
    setPositions(new Map());
    setLastUpdate(null);
  }, [address]);

  // Convert map to array for consumption
  const positionsArray = Array.from(positions.values()).filter(
    (p) => p.status === 'open'
  );

  return {
    isConnected,
    positions: positionsArray,
    positionsMap: positions,
    error,
    lastUpdate,
    wsClient: wsClientRef.current,
  };
}

/**
 * Helper to merge WebSocket positions with REST API positions
 * WebSocket provides real-time updates but may miss some computed fields
 */
export function mergePositions(
  restPositions: KatanaPerpsPosition[],
  wsPositions: Map<string, Partial<KatanaPerpsPosition> & { status: 'open' | 'closed' }>
): KatanaPerpsPosition[] {
  const merged = new Map<string, KatanaPerpsPosition>();

  // Start with REST positions as base
  for (const position of restPositions) {
    merged.set(position.market, position);
  }

  // Apply WebSocket updates
  for (const [market, wsPosition] of wsPositions) {
    if (wsPosition.status === 'closed') {
      // Remove closed positions
      merged.delete(market);
    } else {
      const existing = merged.get(market);
      if (existing) {
        // Merge with existing, WebSocket data takes precedence for real-time fields
        merged.set(market, {
          ...existing,
          quantity: wsPosition.quantity ?? existing.quantity,
          entryPrice: wsPosition.entryPrice ?? existing.entryPrice,
          realizedPnL: wsPosition.realizedPnL ?? existing.realizedPnL,
          totalFunding: wsPosition.totalFunding ?? existing.totalFunding,
          totalOpen: wsPosition.totalOpen ?? existing.totalOpen,
          totalClose: wsPosition.totalClose ?? existing.totalClose,
          time: wsPosition.time ?? existing.time,
        });
      }
    }
  }

  return Array.from(merged.values());
}
