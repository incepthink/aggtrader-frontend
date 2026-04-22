'use client';

import { create } from 'zustand';
import {
  WebSocketClient,
  KatanaPerpsOrderBookLevel2Event,
  KatanaPerpsTradeEvent,
  KatanaPerpsTradeEventData,
  OrderBookPriceLevel,
} from '@katanaperps/katana-perps-sdk';

export type OrderbookSlice = {
  bids: OrderBookPriceLevel[];
  asks: OrderBookPriceLevel[];
  lastPrice: string | null;
  markPrice: string | null;
  indexPrice: string | null;
};

export type OrderbookConnection = {
  isConnected: boolean;
  error: string | null;
};

type Store = {
  snapshots: Record<string, OrderbookSlice | null>;
  trades: Record<string, KatanaPerpsTradeEventData[]>;
  connections: Record<string, OrderbookConnection>;
  _setSnapshot: (market: string, slice: OrderbookSlice | null) => void;
  _setTrades: (market: string, trades: KatanaPerpsTradeEventData[]) => void;
  _patchConnection: (market: string, patch: Partial<OrderbookConnection>) => void;
};

export const usePerpOrderbookStore = create<Store>((set) => ({
  snapshots: {},
  trades: {},
  connections: {},
  _setSnapshot: (market, slice) =>
    set((state) => ({
      snapshots: { ...state.snapshots, [market]: slice },
    })),
  _setTrades: (market, trades) =>
    set((state) => ({
      trades: { ...state.trades, [market]: trades },
    })),
  _patchConnection: (market, patch) =>
    set((state) => {
      const prev = state.connections[market] ?? { isConnected: false, error: null };
      const next: OrderbookConnection = { ...prev, ...patch };
      if (next.isConnected === prev.isConnected && next.error === prev.error) {
        return state;
      }
      return {
        connections: { ...state.connections, [market]: next },
      };
    }),
}));

const ROWS = 30;
const STABILITY_DEPTH = 10;
const DISPOSE_GRACE_MS = 200;

type Controller = {
  wsClient: WebSocketClient | null;
  bidsMap: Map<string, OrderBookPriceLevel>;
  asksMap: Map<string, OrderBookPriceLevel>;
  lastPrice: string | null;
  markPrice: string | null;
  indexPrice: string | null;
  lastCommittedBids: OrderBookPriceLevel[];
  lastCommittedAsks: OrderBookPriceLevel[];
  lastCommittedSlice: OrderbookSlice | null;
  refCount: number;
  rafId: number | null;
  disposeTimer: ReturnType<typeof setTimeout> | null;
  dirty: boolean;
  disposed: boolean;
  abort: AbortController | null;
};

const controllers = new Map<string, Controller>();

function createController(): Controller {
  return {
    wsClient: null,
    bidsMap: new Map(),
    asksMap: new Map(),
    lastPrice: null,
    markPrice: null,
    indexPrice: null,
    lastCommittedBids: [],
    lastCommittedAsks: [],
    lastCommittedSlice: null,
    refCount: 0,
    rafId: null,
    disposeTimer: null,
    dirty: false,
    disposed: false,
    abort: null,
  };
}

function topEqual(
  a: OrderBookPriceLevel[],
  b: OrderBookPriceLevel[],
  depth: number,
): boolean {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  const n = Math.min(depth, a.length);
  for (let i = 0; i < n; i++) {
    if (a[i][0] !== b[i][0] || a[i][1] !== b[i][1]) return false;
  }
  // Past the top-of-book, cheap length-equal check is already done above.
  return true;
}

function flushCommit(market: string, c: Controller) {
  if (c.disposed) return;

  const bidsArray = Array.from(c.bidsMap.values())
    .sort((a, b) => parseFloat(b[0]) - parseFloat(a[0]))
    .slice(0, ROWS);
  const asksArray = Array.from(c.asksMap.values())
    .sort((a, b) => parseFloat(a[0]) - parseFloat(b[0]))
    .slice(0, ROWS);

  const bidsStable = topEqual(c.lastCommittedBids, bidsArray, STABILITY_DEPTH);
  const asksStable = topEqual(c.lastCommittedAsks, asksArray, STABILITY_DEPTH);

  const bids = bidsStable ? c.lastCommittedBids : bidsArray;
  const asks = asksStable ? c.lastCommittedAsks : asksArray;
  c.lastCommittedBids = bids;
  c.lastCommittedAsks = asks;

  const prev = c.lastCommittedSlice;
  if (
    prev &&
    prev.bids === bids &&
    prev.asks === asks &&
    prev.lastPrice === c.lastPrice &&
    prev.markPrice === c.markPrice &&
    prev.indexPrice === c.indexPrice
  ) {
    return;
  }

  const next: OrderbookSlice = {
    bids,
    asks,
    lastPrice: c.lastPrice,
    markPrice: c.markPrice,
    indexPrice: c.indexPrice,
  };
  c.lastCommittedSlice = next;
  usePerpOrderbookStore.getState()._setSnapshot(market, next);
}

function scheduleCommit(market: string, c: Controller) {
  if (c.rafId !== null) return;
  if (typeof requestAnimationFrame === 'undefined') {
    // SSR / no-DOM fallback: commit synchronously
    if (c.dirty) {
      c.dirty = false;
      flushCommit(market, c);
    }
    return;
  }
  c.rafId = requestAnimationFrame(() => {
    c.rafId = null;
    if (!c.dirty) return;
    c.dirty = false;
    flushCommit(market, c);
  });
}

function mergeUpdate(
  market: string,
  c: Controller,
  update: KatanaPerpsOrderBookLevel2Event['data'],
) {
  if (update.lastPrice !== undefined) c.lastPrice = update.lastPrice;
  if (update.markPrice !== undefined) c.markPrice = update.markPrice;
  if (update.indexPrice !== undefined) c.indexPrice = update.indexPrice;

  if (update.bids && update.bids.length > 0) {
    for (const bid of update.bids) {
      const [price, size] = bid;
      if (parseFloat(size) === 0) c.bidsMap.delete(price);
      else c.bidsMap.set(price, bid);
    }
  }
  if (update.asks && update.asks.length > 0) {
    for (const ask of update.asks) {
      const [price, size] = ask;
      if (parseFloat(size) === 0) c.asksMap.delete(price);
      else c.asksMap.set(price, ask);
    }
  }

  c.dirty = true;
  scheduleCommit(market, c);
}

async function bootstrap(market: string, c: Controller) {
  const abort = c.abort;
  try {
    const [obRes, trRes] = await Promise.all([
      fetch(`/api/kuma/orderbook?market=${market}&limit=${ROWS}`, {
        signal: abort?.signal,
      }),
      fetch(`/api/kuma/trades?market=${market}&limit=50`, {
        signal: abort?.signal,
      }),
    ]);

    if (c.disposed) return;

    if (obRes.ok) {
      const orderbookResponse = await obRes.json();
      if (orderbookResponse.bids) {
        for (const bid of orderbookResponse.bids as OrderBookPriceLevel[]) {
          c.bidsMap.set(bid[0], bid);
        }
      }
      if (orderbookResponse.asks) {
        for (const ask of orderbookResponse.asks as OrderBookPriceLevel[]) {
          c.asksMap.set(ask[0], ask);
        }
      }
      if (orderbookResponse.lastPrice) c.lastPrice = orderbookResponse.lastPrice;
      if (orderbookResponse.markPrice) c.markPrice = orderbookResponse.markPrice;
      if (orderbookResponse.indexPrice) c.indexPrice = orderbookResponse.indexPrice;
      c.dirty = true;
      scheduleCommit(market, c);
    }

    if (trRes.ok) {
      const tradesResponse = await trRes.json();
      const initialTrades: KatanaPerpsTradeEventData[] = tradesResponse.map(
        (trade: any) => ({ ...trade, market }),
      );
      usePerpOrderbookStore.getState()._setTrades(market, initialTrades);
    }
  } catch (err: any) {
    if (err?.name !== 'AbortError') {
      console.error('Failed to fetch initial orderbook/trades:', err);
    }
  }
}

function connect(market: string, c: Controller) {
  const sandbox = process.env.NEXT_PUBLIC_KATANA_PERPS_SANDBOX === 'true';
  const wsClient = new WebSocketClient({ sandbox });
  c.wsClient = wsClient;

  wsClient.onConnect(() => {
    usePerpOrderbookStore
      .getState()
      ._patchConnection(market, { isConnected: true, error: null });
  });
  wsClient.onDisconnect(() => {
    usePerpOrderbookStore
      .getState()
      ._patchConnection(market, { isConnected: false });
  });
  wsClient.onError((err) => {
    console.error('Kuma WebSocket error:', err);
    usePerpOrderbookStore.getState()._patchConnection(market, {
      isConnected: false,
      error: err.message || 'WebSocket error occurred',
    });
  });
  wsClient.onMessage((event) => {
    if (event.type === 'l2orderbook') {
      const ev = event as KatanaPerpsOrderBookLevel2Event;
      if (ev.data.market === market) mergeUpdate(market, c, ev.data);
    } else if (event.type === 'trades') {
      const ev = event as KatanaPerpsTradeEvent;
      if (ev.data.market !== market) return;
      const store = usePerpOrderbookStore.getState();
      const prev = store.trades[market] ?? [];
      if (prev.some((t) => t.fillId === ev.data.fillId)) return;
      store._setTrades(market, [ev.data, ...prev].slice(0, 100));
    }
  });

  (async () => {
    try {
      await wsClient.connect();
      if (c.disposed) return;
      wsClient.subscribePublic(
        [{ name: 'l2orderbook' }, { name: 'trades' }],
        [market],
      );
    } catch (err: any) {
      if (c.disposed) return;
      console.error('Kuma WebSocket connection failed:', err);
      usePerpOrderbookStore.getState()._patchConnection(market, {
        isConnected: false,
        error: err.message || 'WebSocket connection failed',
      });
    }
  })();
}

function disposeController(market: string, c: Controller) {
  c.disposed = true;
  if (c.rafId !== null && typeof cancelAnimationFrame !== 'undefined') {
    cancelAnimationFrame(c.rafId);
  }
  c.rafId = null;
  if (c.disposeTimer) {
    clearTimeout(c.disposeTimer);
    c.disposeTimer = null;
  }
  c.abort?.abort();
  c.abort = null;
  if (c.wsClient?.isConnected) {
    try {
      c.wsClient.disconnect();
    } catch (err) {
      console.error('Error disconnecting Kuma WebSocket:', err);
    }
  }
  c.wsClient = null;
  controllers.delete(market);

  const store = usePerpOrderbookStore.getState();
  store._setSnapshot(market, null);
  store._setTrades(market, []);
  store._patchConnection(market, { isConnected: false, error: null });
}

export function subscribeOrderbook(market: string): () => void {
  let c = controllers.get(market);
  if (!c) {
    c = createController();
    controllers.set(market, c);
  }

  // Cancel any pending disposal so dev-mode strict-mode remounts don't thrash.
  if (c.disposeTimer) {
    clearTimeout(c.disposeTimer);
    c.disposeTimer = null;
  }

  if (c.refCount === 0 && !c.wsClient) {
    c.abort = new AbortController();
    bootstrap(market, c);
    connect(market, c);
  }
  c.refCount++;

  return () => {
    const ctrl = controllers.get(market);
    if (!ctrl) return;
    ctrl.refCount--;
    if (ctrl.refCount <= 0) {
      ctrl.disposeTimer = setTimeout(() => {
        if (ctrl.refCount <= 0) disposeController(market, ctrl);
      }, DISPOSE_GRACE_MS);
    }
  };
}
