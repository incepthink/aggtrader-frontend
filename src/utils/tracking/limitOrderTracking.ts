import axios from "axios";
import { BACKEND_URL } from "@/utils/constants";
import type { Order } from "@orbs-network/twap-sdk";

interface LimitOrderSyncData {
  walletAddress: string;
  chainId: number;
  orders: Order[];
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
 * Sync limit orders with the backend for tracking
 * Call this when the page loads after user connects their wallet
 * @param data - Wallet address, chain ID, and orders from TwapSDK
 * @returns Promise<SyncResponse | null>
 */
export async function syncLimitOrders(
  data: LimitOrderSyncData
): Promise<SyncResponse | null> {
  try {
    const response = await axios.post<SyncResponse>(
      `${BACKEND_URL}/tracking/sushiswap/limit-orders/sync`,
      data,
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