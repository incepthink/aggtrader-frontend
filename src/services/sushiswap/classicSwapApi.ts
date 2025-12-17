import axios from "axios";
import { type Address } from "viem";
import { BACKEND_URL } from "@/utils/constants";

// Token information for swap operations
export interface SwapTokenInfo {
  address: Address;
  decimals: number;
}

// Quote request body
export interface QuoteRequest {
  tokenIn: SwapTokenInfo;
  tokenOut: SwapTokenInfo;
  amount: string; // Human-readable amount (e.g., "1.5")
  slippage: number; // Percentage (e.g., 0.5 for 0.5%)
}

// Execute request body
export interface ExecuteRequest extends QuoteRequest {
  userAddress: Address;
}

// Backend response for quote
export interface QuoteBackendResponse {
  message: string;
  data: {
    amountOut: string;
    priceImpact: string;
    swapPrice: string;
    amountIn: string;
    tokenFrom: Address;
    tokenTo: Address;
    status: string;
    routerAddress: Address;
  };
}

// Backend response for swap execution
export interface SwapBackendResponse {
  message: string;
  data: {
    to: Address;
    data: string; // hex string
    value: string;
    priceImpact: number
  };
}

// Cache structure
interface CachedQuote {
  data: QuoteBackendResponse;
  timestamp: number;
}

const quoteCache = new Map<string, CachedQuote>();
const CACHE_TTL = 30000; // 30 seconds

// Generate cache key from request parameters
function getCacheKey(
  tokenIn: Address,
  tokenOut: Address,
  amount: string,
  slippage: number
): string {
  return `${tokenIn.toLowerCase()}-${tokenOut.toLowerCase()}-${amount}-${slippage}`;
}

// Check if cached data is still valid
function isCacheValid(cachedData: CachedQuote): boolean {
  return Date.now() - cachedData.timestamp < CACHE_TTL;
}

// Fetch quote from backend with caching
export async function fetchQuoteFromBackend(
  params: QuoteRequest
): Promise<QuoteBackendResponse> {
  const cacheKey = getCacheKey(
    params.tokenIn.address,
    params.tokenOut.address,
    params.amount,
    params.slippage
  );

  // Check cache first
  const cached = quoteCache.get(cacheKey);
  if (cached && isCacheValid(cached)) {
    console.log("Returning cached quote for:", cacheKey);
    return cached.data;
  }

  try {
    console.log("Fetching quote from backend:", params);
    const response = await axios.post<QuoteBackendResponse>(
      `${BACKEND_URL}/transaction/classic-swap/quote`,
      params,
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 10000, // 10 second timeout
      }
    );

    // Cache the successful response
    quoteCache.set(cacheKey, {
      data: response.data,
      timestamp: Date.now(),
    });

    // Clean up old cache entries (simple cleanup strategy)
    if (quoteCache.size > 100) {
      const firstKey = quoteCache.keys().next().value;
      if (firstKey) {
        quoteCache.delete(firstKey);
      }
    }

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to fetch quote from backend";
      console.error("Quote API error:", errorMessage);
      throw new Error(errorMessage);
    }
    throw error;
  }
}

// Fetch swap transaction data from backend (no caching for execution)
export async function fetchSwapFromBackend(
  params: ExecuteRequest
): Promise<SwapBackendResponse> {
  try {
    console.log("Fetching swap data from backend:", params);
    const response = await axios.post<SwapBackendResponse>(
      `${BACKEND_URL}/transaction/classic-swap/execute`,
      params,
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 15000, // 15 second timeout
      }
    );

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to fetch swap data from backend";
      console.error("Swap API error:", errorMessage);
      throw new Error(errorMessage);
    }
    throw error;
  }
}
