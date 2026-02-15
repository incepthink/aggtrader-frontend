"use client";

import { useQuery } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import { usePerpBalanceStore } from "@/store/perpBalanceStore";

/**
 * Funding payment types for funding history
 * Based on Katana Perps API documentation
 */
export interface KatanaPerpsFundingPayment {
  /** Base-quote pair e.g. 'ETH-USD' */
  market: string;
  /** Funding payment quantity (positive = received, negative = paid) */
  paymentQuantity: string;
  /** Position quantity at time of payment */
  positionQuantity: string;
  /** Funding rate at time of payment */
  fundingRate: string;
  /** Index price at time of payment */
  indexPrice: string;
  /** Timestamp of the funding payment */
  time: number;
}

interface UseKatanaPerpsFundingPaymentsOptions {
  market?: string;
  limit?: number;
  start?: number;
  end?: number;
  enabled?: boolean;
}

/**
 * Hook to fetch user's funding payment history from Katana Perps
 */
export function useKatanaPerpsFundingPayments(options: UseKatanaPerpsFundingPaymentsOptions = {}) {
  const { address, isConnected } = useAccount();
  const { market, limit = 50, start, end, enabled = true } = options;

  // Use global store for isAssociated to share state across components
  const isAssociated = usePerpBalanceStore((state) => state.isAssociated);

  return useQuery<KatanaPerpsFundingPayment[]>({
    queryKey: ["katana-perps-funding-payments", address, market, limit, start, end],
    queryFn: async () => {
      if (!address) throw new Error("Wallet not connected");

      const params = new URLSearchParams();
      params.set("wallet", address);
      params.set("limit", String(limit));
      if (market) params.set("market", market);
      if (start) params.set("start", String(start));
      if (end) params.set("end", String(end));

      const response = await fetch(`/api/kuma/funding-payments?${params.toString()}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch funding payments");
      }

      return response.json();
    },
    enabled: enabled && isConnected && !!address && isAssociated,
    staleTime: 30000, // 30 seconds
    gcTime: 300000, // 5 minutes
    refetchInterval: 60000, // Refetch every minute
  });
}

/**
 * Helper to format funding payment data for display
 */
export function formatFundingPaymentForDisplay(payment: KatanaPerpsFundingPayment) {
  const date = new Date(payment.time);
  const formattedDate = date.toISOString().replace("T", " ").slice(0, 16);

  const paymentQuantity = parseFloat(payment.paymentQuantity);
  const positionQuantity = parseFloat(payment.positionQuantity);
  const fundingRate = parseFloat(payment.fundingRate);
  const indexPrice = parseFloat(payment.indexPrice);

  // Extract base asset from market (e.g., "BTC-USD" -> "BTC")
  const baseAsset = payment.market.split("-")[0];

  return {
    date: formattedDate,
    market: payment.market,
    fundingRate: `${(fundingRate * 100).toFixed(4)}%`,
    fundingRateRaw: fundingRate,
    position: `${positionQuantity.toFixed(4)} ${baseAsset}`,
    positionRaw: positionQuantity,
    indexPrice: `$${indexPrice.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`,
    indexPriceRaw: indexPrice,
    fundingFee: paymentQuantity >= 0
      ? `$${paymentQuantity.toFixed(8)}`
      : `-$${Math.abs(paymentQuantity).toFixed(8)}`,
    fundingFeeRaw: paymentQuantity,
  };
}
