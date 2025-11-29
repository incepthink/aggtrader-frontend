import { BACKEND_URL } from "@/utils/constants";

interface ClassicSwapTrackingData {
  walletAddress: string;
  txHash: string;
  chainId?: number;
  blockNumber?: number;
  blockTimestamp?: string;
  tokenFrom: {
    address: string;
    symbol: string;
    amount: string;
  };
  tokenTo: {
    address: string;
    symbol: string;
    amount: string;
  };
  usdVolume: number;
  executionPrice: number;
  poolId?: string;
  timestamp?: string;
  status?: 'success' | 'failed' | 'pending';
}

/**
 * Track a successful classic swap transaction to the backend
 * @param data - Swap transaction data
 * @returns Promise<void>
 */
export async function trackClassicSwap(
  data: ClassicSwapTrackingData
): Promise<void> {
  try {
    const response = await fetch(
      `${BACKEND_URL}/tracking/sushiswap/classic-swap`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      throw new Error(
        `Backend tracking failed: ${response.status} ${response.statusText}`
      );
    }

    console.log("✅ Classic swap tracked successfully:", data.txHash);
  } catch (error) {
    // Don't throw - we don't want tracking failures to affect the user experience
    console.error("❌ Failed to track classic swap:", error);
    console.error("Swap data:", data);
  }
}