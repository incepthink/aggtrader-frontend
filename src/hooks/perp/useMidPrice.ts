'use client';

import { usePerpStore } from '@/store/perpStore';
import { useOrderbookSnapshot } from './useOrderbookTrades';

export function useMidPrice(): string | null {
  const market = usePerpStore((s) => s.selectedMarket);
  const snapshot = useOrderbookSnapshot(market);

  if (!snapshot?.asks?.length || !snapshot?.bids?.length) return null;

  const bestAsk = parseFloat(snapshot.asks[0][0]);
  const bestBid = parseFloat(snapshot.bids[0][0]);

  if (!bestAsk || !bestBid) return null;

  return ((bestAsk + bestBid) / 2).toFixed(2);
}
