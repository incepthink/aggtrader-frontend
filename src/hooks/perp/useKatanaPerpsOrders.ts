'use client';

import { useQuery } from '@tanstack/react-query';
import { useAccount } from 'wagmi';

/**
 * Order status enum values from Katana Perps SDK
 */
export type OrderStatus =
  | 'active'
  | 'canceled'
  | 'filled'
  | 'inactive'
  | 'notFound'
  | 'open'
  | 'partiallyFilled';

/**
 * Order type enum values from Katana Perps SDK
 */
export type OrderType =
  | 'market'
  | 'limit'
  | 'stopLossMarket'
  | 'stopLossLimit'
  | 'takeProfitMarket'
  | 'takeProfitLimit'
  | 'trailingStopMarket';

/**
 * Order side enum values from Katana Perps SDK
 */
export type OrderSide = 'buy' | 'sell';

/**
 * Time in force enum values from Katana Perps SDK
 */
export type TimeInForce = 'gtc' | 'gtx' | 'ioc' | 'fok';

/**
 * Self-trade prevention enum values from Katana Perps SDK
 */
export type SelfTradePrevention = 'dc' | 'co' | 'cn' | 'cb';

/**
 * Trigger type enum values from Katana Perps SDK
 */
export type TriggerType = 'last' | 'index';

/**
 * Order fill data from Katana Perps API
 */
export interface KatanaPerpsOrderFill {
  fillId: string;
  price: string;
  quantity: string;
  quoteQuantity: string;
  time: number;
  makerSide: OrderSide;
  sequence: number;
  fee: string;
  feeAsset: string;
  gas: string;
  liquidity: 'maker' | 'taker';
  txId: string;
  txStatus: 'pending' | 'mined' | 'failed';
}

/**
 * Order data from Katana Perps API
 * Matches KatanaPerpsOrder from @katanaperps/katana-perps-sdk
 */
export interface KatanaPerpsOrder {
  /** Market symbol as base-quote pair e.g. 'ETH-USD' */
  market: string;
  /** Exchange-assigned order identifier */
  orderId: string;
  /** Client-specified order identifier (if provided) */
  clientOrderId?: string;
  /** Address of the wallet which placed the order */
  wallet: string;
  /** Timestamp of initial order processing by the matching engine */
  time: number;
  /** Current order status */
  status: OrderStatus;
  /** Error short code explaining forced cancelation condition */
  errorCode?: string;
  /** Error description explaining forced cancelation condition */
  errorMessage?: string;
  /** Order type */
  type: OrderType;
  /** Order side, buy or sell */
  side: OrderSide;
  /** Original quantity specified by the order in base terms */
  originalQuantity: string;
  /** Quantity that has been executed in base terms */
  executedQuantity: string;
  /** Cumulative quantity that has been spent (buy orders) or received (sell orders) in quote terms */
  cumulativeQuoteQuantity: string;
  /** Weighted average price of fills associated with the order; only present with fills */
  avgExecutionPrice?: string;
  /** Original price specified by the order in quote terms, omitted for all market orders */
  price?: string;
  /** Stop loss or take profit price / activation price for trailing stops */
  triggerPrice?: string;
  /** Price type for triggerPrice, last or index */
  triggerType?: TriggerType;
  /** Callback rate for trailing stop orders */
  callbackRate?: string;
  /** Reduce only orders are only accepted opposite open positions */
  reduceOnly: boolean;
  /** Time in force policy */
  timeInForce?: TimeInForce;
  /** Self-trade prevention policy */
  selfTradePrevention: SelfTradePrevention;
  /** Delegated key, if present */
  delegatedKey?: string;
  /** Array of order fill objects */
  fills?: KatanaPerpsOrderFill[];
}

/**
 * Options for fetching orders
 */
export interface FetchOrdersOptions {
  wallet: string;
  closed?: boolean;
  market?: string;
  limit?: number;
}

/**
 * Fetch orders from the API
 */
async function fetchOrders(options: FetchOrdersOptions): Promise<KatanaPerpsOrder[]> {
  const { wallet, closed = false, market, limit } = options;

  let url = `/api/kuma/orders?wallet=${wallet}`;

  if (closed) {
    url += `&closed=true`;
  }

  if (market) {
    url += `&market=${encodeURIComponent(market)}`;
  }

  if (limit) {
    url += `&limit=${limit}`;
  }

  const response = await fetch(url);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch orders');
  }

  return response.json();
}

/**
 * Hook to fetch user's open orders from Katana Perps
 *
 * @param options - Optional configuration for fetching orders
 * @returns Query result with orders array, loading state, and error
 */
export function useKatanaPerpsOrders(options?: { market?: string; closed?: boolean }) {
  const { address, isConnected } = useAccount();
  const { market, closed = false } = options || {};

  return useQuery({
    queryKey: ['katana-perps-orders', address, closed, market],
    queryFn: () =>
      fetchOrders({
        wallet: address!,
        closed,
        market,
      }),
    enabled: isConnected && !!address,
    staleTime: 10000, // 10 seconds - orders change frequently
    gcTime: 60000, // 1 minute
    refetchInterval: 15000, // Auto-refresh every 15 seconds
    refetchOnWindowFocus: true,
  });
}

/**
 * Helper to calculate fill percentage
 */
export function calculateFillPercentage(order: KatanaPerpsOrder): number {
  const originalQty = parseFloat(order.originalQuantity);
  const executedQty = parseFloat(order.executedQuantity);

  if (originalQty === 0) return 0;

  return (executedQty / originalQty) * 100;
}

/**
 * Helper to get remaining quantity
 */
export function getRemainingQuantity(order: KatanaPerpsOrder): string {
  const originalQty = parseFloat(order.originalQuantity);
  const executedQty = parseFloat(order.executedQuantity);
  return (originalQty - executedQty).toFixed(6);
}

/**
 * Helper to format order type for display
 */
export function formatOrderType(type: OrderType): string {
  const typeMap: Record<OrderType, string> = {
    market: 'Market',
    limit: 'Limit',
    stopLossMarket: 'Stop Loss',
    stopLossLimit: 'Stop Limit',
    takeProfitMarket: 'Take Profit',
    takeProfitLimit: 'TP Limit',
    trailingStopMarket: 'Trailing Stop',
  };
  return typeMap[type] || type;
}

/**
 * Helper to format order status for display
 */
export function formatOrderStatus(status: OrderStatus): string {
  const statusMap: Record<OrderStatus, string> = {
    active: 'Active',
    canceled: 'Canceled',
    filled: 'Filled',
    inactive: 'Inactive',
    notFound: 'Not Found',
    open: 'Open',
    partiallyFilled: 'Partial',
  };
  return statusMap[status] || status;
}

/**
 * Helper to get status color
 */
export function getStatusColor(status: OrderStatus): string {
  const colorMap: Record<OrderStatus, string> = {
    active: '#00F5E0',
    canceled: '#FF4444',
    filled: '#00FF88',
    inactive: 'rgba(255, 255, 255, 0.5)',
    notFound: '#FF4444',
    open: '#00F5E0',
    partiallyFilled: '#FFA500',
  };
  return colorMap[status] || 'rgba(255, 255, 255, 0.5)';
}

/**
 * Helper to check if an order is open (active on order book)
 */
export function isOpenOrder(order: KatanaPerpsOrder): boolean {
  return order.status === 'open' || order.status === 'active' || order.status === 'partiallyFilled';
}
