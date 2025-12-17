import axios from "axios";
import { BACKEND_URL } from "@/utils/constants";
import type { Order } from "@orbs-network/twap-sdk";

// Enriched order with calculated fees
interface EnrichedOrder extends Order {
  fees_usd?: number;
}

interface LimitOrderSyncData {
  walletAddress: string;
  chainId: number;
  orders: EnrichedOrder[];
}

interface SyncResponse {
  message: string;
  summary: {
    processed: number;
    new: number;
    duplicates: number;
  };
}

/**
 * Calculate fees in USD for a limit order
 * TWAP fee is fixed at 0.25% (0.0025)
 * @param order - TWAP order
 * @returns Calculated fees in USD
 */
function calculateOrderFeesUsd(order: Order): number {
  // Use tradeDollarValueIn as the USD volume
  const usdVolume = parseFloat(order.tradeDollarValueIn || "0");

  // TWAP charges 0.25% fee
  const TWAP_FEE_PERCENTAGE = 0.0025;

  return usdVolume * TWAP_FEE_PERCENTAGE;
}

/**
 * Sync limit orders with the backend for tracking
 * Call this when the page loads after user connects their wallet
 * @param data - Wallet address, chain ID, and orders from TwapSDK
 * @returns Promise<SyncResponse | null>
 */
export async function syncLimitOrders(
  data: LimitOrderSyncData
): Promise<SyncResponse | null> {
  try {
    // Enrich orders with calculated fees_usd
    const enrichedOrders: EnrichedOrder[] = data.orders.map((order) => ({
      ...order,
      fees_usd: calculateOrderFeesUsd(order),
    }));

    const enrichedData = {
      ...data,
      orders: enrichedOrders,
    };

    const response = await axios.post<SyncResponse>(
      `${BACKEND_URL}/tracking/sushiswap/limit-orders/sync`,
      enrichedData,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    console.log(
      "✅ Limit orders synced successfully:",
      response.data.summary
    );
    return response.data;
  } catch (error) {
    // Don't throw - we don't want tracking failures to affect the user experience
    console.error("❌ Failed to sync limit orders:", error);
    if (axios.isAxiosError(error)) {
      console.error("Response data:", error.response?.data);
      console.error("Response status:", error.response?.status);
    }
    return null;
  }
}