import { BACKEND_URL } from "@/utils/constants";

export interface PrepareLimitOrderRequest {
  srcToken: string; // Source token address (use 0xeeee...ee for native RON)
  dstToken: string; // Destination token address
  srcAmount: string; // Total source amount in Wei (BigInt as string)
  dstMinAmount: string; // Minimum destination amount in Wei (BigInt as string)
  srcChunkAmount: string; // Amount per chunk in Wei (BigInt as string)
  deadline: number; // Unix timestamp when order expires
  fillDelay: {
    unit: "Seconds" | "Minutes" | "Hours" | "Days";
    value: number; // Time between each chunk execution
  };
}

export interface PrepareLimitOrderResponse {
  message: string;
  data: {
    to: string; // TWAP contract address to send transaction to
    data: string; // Encoded transaction data
    value: string; // RON value to send (usually "0")
  };
}

/**
 * Prepares a SushiSwap limit order transaction using Orbs TWAP protocol on Katana chain.
 * This allows users to execute time-weighted average price orders that split large trades
 * into smaller chunks over time.
 */
export async function prepareLimitOrder(
  request: PrepareLimitOrderRequest
): Promise<PrepareLimitOrderResponse> {
  const response = await fetch(
    `${BACKEND_URL}/transaction/twap/limit-order/prepare`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || `Failed to prepare limit order: ${response.statusText}`
    );
  }

  return response.json();
}