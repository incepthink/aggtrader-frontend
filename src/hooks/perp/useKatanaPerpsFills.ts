"use client";

import { useQuery } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import { usePerpBalanceStore } from "@/store/perpBalanceStore";

/**
 * Fill types for trade history
 * Based on @katanaperps/katana-perps-sdk KatanaPerpsFill interface
 */
export type OrderSide = "buy" | "sell";
export type FillType = "market" | "limit" | "liquidation" | "deleverage" | "closure";
export type FillAction = "open" | "close" | "closeAndOpen";
export type PositionSide = "long" | "short" | "none";
export type LiquidityProvider = "maker" | "taker";
export type ChainTransactionStatus = "pending" | "mined" | "failed";

export interface KatanaPerpsFill {
  /** Exchange-assigned order identifier, omitted for liquidations */
  orderId?: string;
  /** Client-provided ID of order, if present */
  clientOrderId?: string;
  /** Base-quote pair e.g. 'ETH-USD' */
  market: string;
  /** Orders side, `buy` or `sell` */
  side: OrderSide;
  /** Internal ID of fill */
  fillId: string;
  /** Executed price of fill in quote terms */
  price: string;
  /** Executed quantity of fill in base terms */
  quantity: string;
  /** Executed quantity of trade in quote terms */
  quoteQuantity: string;
  /** Realized PnL - only from the fill's closure, not for the position overall */
  realizedPnL?: string;
  /** Fill timestamp */
  time: number;
  /** Maker side of the fill, `buy` or `sell` - omitted for liquidation actions */
  makerSide?: OrderSide;
  /** Fill sequence number - omitted for liquidation actions */
  sequence?: number;
  /** Fee amount collected on the fill in quote terms */
  fee?: string;
  /** Whether the fill increases or decreases the notional value of the position */
  action: FillAction;
  /** Resulting position side */
  position: PositionSide;
  /** Index price of the market at transaction time */
  indexPrice?: string;
  /** Whether the fill is the maker or taker */
  liquidity?: LiquidityProvider;
  /** Fill type */
  type: FillType;
  /** Transaction id of the trade settlement transaction or null if not yet assigned */
  txId: string | null;
  /** Status of the trade settlement transaction */
  txStatus: ChainTransactionStatus;
  /** When true, the order is a liquidation acquisition only fill */
  isLiquidationAcquisition?: true;
}

interface UseKatanaPerpsFillsOptions {
  market?: string;
  limit?: number;
  start?: number;
  end?: number;
  enabled?: boolean;
}

/**
 * Hook to fetch user's trade history (fills) from Katana Perps
 */
export function useKatanaPerpsFills(options: UseKatanaPerpsFillsOptions = {}) {
  const { address, isConnected } = useAccount();
  const { market, limit = 50, start, end, enabled = true } = options;

  // Use global store for isAssociated to share state across components
  const isAssociated = usePerpBalanceStore((state) => state.isAssociated);

  return useQuery<KatanaPerpsFill[]>({
    queryKey: ["katana-perps-fills", address, market, limit, start, end],
    queryFn: async () => {
      if (!address) throw new Error("Wallet not connected");

      const params = new URLSearchParams();
      params.set("wallet", address);
      params.set("limit", String(limit));
      if (market) params.set("market", market);
      if (start) params.set("start", String(start));
      if (end) params.set("end", String(end));

      const response = await fetch(`/api/kuma/fills?${params.toString()}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch fills");
      }

      return response.json();
    },
    enabled: enabled && isConnected && !!address && isAssociated,
    staleTime: 30000, // 30 seconds
    gcTime: 300000, // 5 minutes
    refetchInterval: 60000, // Refetch every minute
    select: (data) => [...data].sort((a, b) => b.time - a.time),
  });
}

/**
 * Helper to format fill data for display
 */
export function formatFillForDisplay(fill: KatanaPerpsFill) {
  const date = new Date(fill.time);
  const formattedDate = date.toISOString().replace("T", " ").slice(0, 16);

  const price = parseFloat(fill.price);
  const quantity = parseFloat(fill.quantity);
  const quoteQuantity = parseFloat(fill.quoteQuantity);
  const realizedPnL = fill.realizedPnL ? parseFloat(fill.realizedPnL) : 0;
  const fee = fill.fee ? parseFloat(fill.fee) : 0;

  // Extract base asset from market (e.g., "BTC-USD" -> "BTC")
  const baseAsset = fill.market.split("-")[0];

  return {
    date: formattedDate,
    market: fill.market,
    side: fill.side,
    price: price.toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }),
    quantity: `${quantity.toFixed(4)} ${baseAsset}`,
    value: `$${quoteQuantity.toFixed(2)}`,
    fee: `$${fee.toFixed(2)}`,
    type: fill.type.charAt(0).toUpperCase() + fill.type.slice(1),
    liquidity: fill.liquidity
      ? fill.liquidity.charAt(0).toUpperCase() + fill.liquidity.slice(1)
      : "-",
    realizedPnL: realizedPnL,
    realizedPnLFormatted:
      realizedPnL >= 0 ? `$${realizedPnL.toFixed(2)}` : `-$${Math.abs(realizedPnL).toFixed(2)}`,
    status: fill.txStatus,
    statusFormatted:
      fill.txStatus === "mined"
        ? "Complete"
        : fill.txStatus.charAt(0).toUpperCase() + fill.txStatus.slice(1),
  };
}
