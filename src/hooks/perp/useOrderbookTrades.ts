'use client';

import { useEffect } from 'react';
import { KatanaPerpsTradeEventData } from '@katanaperps/katana-perps-sdk';
import {
  usePerpOrderbookStore,
  subscribeOrderbook,
  OrderbookSlice,
  OrderbookConnection,
} from '@/store/perpOrderbookStore';

const EMPTY_TRADES: KatanaPerpsTradeEventData[] = [];

function useOrderbookSubscription(market: string): void {
  useEffect(() => {
    return subscribeOrderbook(market);
  }, [market]);
}

export function useOrderbookSnapshot(
  market: string = 'BTC-USD',
): OrderbookSlice | null {
  useOrderbookSubscription(market);
  return usePerpOrderbookStore((s) => s.snapshots[market] ?? null);
}

export function useOrderbookTrades(
  market: string = 'BTC-USD',
): KatanaPerpsTradeEventData[] {
  useOrderbookSubscription(market);
  return usePerpOrderbookStore((s) => s.trades[market] ?? EMPTY_TRADES);
}

export function useOrderbookConnection(
  market: string = 'BTC-USD',
): OrderbookConnection {
  useOrderbookSubscription(market);
  const isConnected = usePerpOrderbookStore(
    (s) => s.connections[market]?.isConnected ?? false,
  );
  const error = usePerpOrderbookStore(
    (s) => s.connections[market]?.error ?? null,
  );
  return { isConnected, error };
}
