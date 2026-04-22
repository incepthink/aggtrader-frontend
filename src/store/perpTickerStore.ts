'use client';

import { create } from 'zustand';
import { KatanaPerpsTicker } from '@katanaperps/katana-perps-sdk';

export type TickerSlice = {
  close: string | null;
  indexPrice: string | null;
  percentChange: string | null;
  currentFundingRate: string | null;
  nextFundingTime: number | null;
  openInterest: string | null;
  quoteVolume: string | null;
  market: string | null;
};

type Store = {
  tickers: Record<string, TickerSlice | null>;
  _setTicker: (market: string, slice: TickerSlice) => void;
};

export const usePerpTickerStore = create<Store>((set) => ({
  tickers: {},
  _setTicker: (market, slice) =>
    set((state) => ({
      tickers: { ...state.tickers, [market]: slice },
    })),
}));

// ── RAF-batched write path ──────────────────────────────────────────────────

type Controller = {
  pending: KatanaPerpsTicker | null;
  rafId: number | null;
};

const controllers = new Map<string, Controller>();

function getController(market: string): Controller {
  let c = controllers.get(market);
  if (!c) {
    c = { pending: null, rafId: null };
    controllers.set(market, c);
  }
  return c;
}

function flushTicker(market: string, c: Controller) {
  const data = c.pending;
  c.pending = null;
  if (!data) return;

  const current = usePerpTickerStore.getState().tickers[market];
  // Skip store update when the three high-frequency fields are unchanged.
  if (
    current &&
    current.close === data.close &&
    current.indexPrice === data.indexPrice &&
    current.currentFundingRate === data.currentFundingRate
  ) {
    return;
  }

  usePerpTickerStore.getState()._setTicker(market, {
    close: data.close ?? null,
    indexPrice: data.indexPrice ?? null,
    percentChange: data.percentChange ?? null,
    currentFundingRate: data.currentFundingRate ?? null,
    nextFundingTime: data.nextFundingTime ?? null,
    openInterest: data.openInterest ?? null,
    quoteVolume: data.quoteVolume ?? null,
    market: data.market ?? null,
  });
}

function scheduleFlush(market: string, c: Controller) {
  if (c.rafId !== null) return;
  if (typeof requestAnimationFrame === 'undefined') {
    // SSR / no-DOM fallback: flush synchronously
    flushTicker(market, c);
    return;
  }
  c.rafId = requestAnimationFrame(() => {
    c.rafId = null;
    flushTicker(market, c);
  });
}

/**
 * Write a ticker update from the WebSocket handler.
 * Multiple calls within the same animation frame are coalesced — only the
 * last value before the frame fires is committed to the Zustand store.
 */
export function writeTicker(market: string, data: KatanaPerpsTicker): void {
  const c = getController(market);
  c.pending = data;
  scheduleFlush(market, c);
}
