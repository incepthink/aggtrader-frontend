import axios from "axios";
import { type Address } from "viem";
import { BACKEND_URL } from "@/utils/constants";

// Token information for Yearn operations
export interface YearnTokenInfo {
  address: Address;
  decimals: number;
}

// Deposit request body
export interface DepositRequest {
  vaultAddress: Address;
  tokenAddress: Address;
  amount: string; // Human-readable amount (e.g., "100.5")
  decimals: number;
  receiverAddress: Address;
  userAddress: Address;
  chainId: number;
}

// Withdraw request body
export interface WithdrawRequest {
  vaultAddress: Address;
  shares: string; // Human-readable shares amount
  decimals: number;
  receiverAddress: Address;
  ownerAddress: Address;
  maxLoss?: string; // Optional, default "1" (0.01%)
  chainId: number;
}

// Backend response for deposit
export interface DepositBackendResponse {
  message: string;
  data: {
    approval?: {
      to: Address;
      data: string;
      value: string;
    };
    deposit: {
      to: Address;
      data: string;
      value: string;
    };
  };
}

// Backend response for withdraw
export interface WithdrawBackendResponse {
  message: string;
  data: {
    to: Address;
    data: string;
    value: string;
  };
}

/**
 * Fetch deposit transaction data from backend
 * @param params - Deposit parameters
 * @returns Prepared deposit transaction (and approval if needed)
 */
export async function fetchDepositFromBackend(
  params: DepositRequest
): Promise<DepositBackendResponse> {
  try {
    console.log("Fetching deposit transaction from backend:", params);

    const response = await axios.post<DepositBackendResponse>(
      `${BACKEND_URL}/transaction/yearn/deposit/prepare`,
      params,
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 15000, // 15 second timeout
      }
    );

    console.log("Deposit transaction prepared:", response.data);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to prepare deposit transaction";
      console.error("Deposit API error:", errorMessage);
      throw new Error(errorMessage);
    }
    throw error;
  }
}

/**
 * Fetch withdraw transaction data from backend
 * @param params - Withdraw parameters
 * @returns Prepared withdraw transaction
 */
export async function fetchWithdrawFromBackend(
  params: WithdrawRequest
): Promise<WithdrawBackendResponse> {
  try {
    console.log("Fetching withdraw transaction from backend:", params);

    const response = await axios.post<WithdrawBackendResponse>(
      `${BACKEND_URL}/transaction/yearn/withdraw/prepare`,
      params,
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 15000, // 15 second timeout
      }
    );

    console.log("Withdraw transaction prepared:", response.data);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to prepare withdraw transaction";
      console.error("Withdraw API error:", errorMessage);
      throw new Error(errorMessage);
    }
    throw error;
  }
}