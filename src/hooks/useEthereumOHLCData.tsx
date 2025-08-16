import { BACKEND_URL } from "@/utils/constants";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, useCallback } from "react";

// Types
export interface EthereumOHLCPoint {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  volumeUSD: number;
  poolCount: number;
}

export interface EthereumOHLCResponse {
  status: string;
  data: {
    chart: EthereumOHLCPoint[];
    metadata: {
      token: {
        address: string;
        name: string;
        symbol: string;
        decimals: string;
      };
      totalValueLockedUSD: number;
      volumeUSD: number;
      poolCount: number;
      txCount: number;
      priceUSD: number;
      currency: string;
      dataSource: string;
      chain: string;
      dexId: string;
      note?: string;
    };
  };
  source: string;
  cached: boolean;
  tokenAddress: string;
  resolution: string;
  count: number;
  dataSource: string;
  chain: string;
  note?: string;
}

export interface UseEthereumOHLCDataParams {
  tokenAddress: string;
  resolution?: "hour" | "day";
  days?: number;
  force?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export interface UseEthereumOHLCDataReturn {
  data: EthereumOHLCResponse | null;
  isLoading: boolean;
  error: string | null;
  isSupported: boolean;
  refetch: () => void;
  clearCache: () => Promise<void>;
  lastFetched: Date | null;
}

// Backend API base URL - adjust this to your backend URL
const API_BASE_URL = BACKEND_URL;

// Utility functions
export const ethereumOHLCUtils = {
  /**
   * Format price with appropriate decimal places
   */
  formatPrice: (price: number | string): string => {
    const num = typeof price === "string" ? parseFloat(price) : price;
    if (!Number.isFinite(num) || num === 0) return "0.00";

    if (num >= 1000) {
      return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
    } else if (num >= 1) {
      return num.toFixed(4);
    } else if (num >= 0.01) {
      return num.toFixed(6);
    } else {
      return num.toFixed(8);
    }
  },

  /**
   * Format volume in compact notation
   */
  formatVolume: (volume: number | string): string => {
    const num = typeof volume === "string" ? parseFloat(volume) : volume;
    if (!Number.isFinite(num)) return "0";

    if (num >= 1e9) {
      return `${(num / 1e9).toFixed(2)}B`;
    } else if (num >= 1e6) {
      return `${(num / 1e6).toFixed(2)}M`;
    } else if (num >= 1e3) {
      return `${(num / 1e3).toFixed(2)}K`;
    }
    return num.toFixed(2);
  },

  /**
   * Validate Ethereum address format
   */
  isValidAddress: (address: string): boolean => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  },

  /**
   * Get cache key for query
   */
  getCacheKey: (
    tokenAddress: string,
    resolution: string,
    days: number
  ): string => {
    return `ethereum-ohlc-${tokenAddress.toLowerCase()}-${resolution}-${days}`;
  },

  /**
   * Check if token is supported (basic validation)
   */
  isTokenSupported: (tokenAddress: string): boolean => {
    return ethereumOHLCUtils.isValidAddress(tokenAddress);
  },
};

/**
 * Fetch OHLC data from backend API
 */
async function fetchEthereumOHLCData({
  tokenAddress,
  resolution = "hour",
  days = 30,
  force = false,
}: UseEthereumOHLCDataParams): Promise<EthereumOHLCResponse> {
  if (!ethereumOHLCUtils.isValidAddress(tokenAddress)) {
    throw new Error("Invalid Ethereum token address format");
  }

  const params = new URLSearchParams({
    tokenAddress: tokenAddress.toLowerCase(),
    resolution,
    days: days.toString(),
    ...(force && { force: "true" }),
  });

  const url = `${API_BASE_URL}/api/ohlc/ethereum/token?${params}`;

  console.log(`[Ethereum OHLC] Fetching data from: ${url}`);

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error(`[Ethereum OHLC] API Error:`, {
      status: response.status,
      statusText: response.statusText,
      errorData,
    });

    if (response.status === 404) {
      throw new Error(errorData.msg || "Token not found on Ethereum");
    } else if (response.status === 429) {
      throw new Error("Rate limited. Please try again later.");
    } else if (response.status === 422) {
      throw new Error(errorData.msg || "Invalid token address format");
    } else {
      throw new Error(
        errorData.msg || `HTTP ${response.status}: ${response.statusText}`
      );
    }
  }

  const data = await response.json();

  console.log(`[Ethereum OHLC] Successfully fetched data:`, {
    tokenAddress,
    resolution,
    days,
    dataPoints: data.data?.chart?.length || 0,
    cached: data.cached,
  });

  return data;
}

/**
 * Clear cache for specific token
 */
async function clearEthereumOHLCCache(tokenAddress: string): Promise<void> {
  if (!ethereumOHLCUtils.isValidAddress(tokenAddress)) {
    throw new Error("Invalid Ethereum token address format");
  }

  const params = new URLSearchParams({
    tokenAddress: tokenAddress.toLowerCase(),
  });

  const url = `${API_BASE_URL}/api/ohlc/ethereum/token/cache?${params}`;

  console.log(`[Ethereum OHLC] Clearing cache: ${url}`);

  const response = await fetch(url, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error(`[Ethereum OHLC] Cache clear error:`, {
      status: response.status,
      statusText: response.statusText,
      errorData,
    });
    throw new Error(
      errorData.msg || `Failed to clear cache: HTTP ${response.status}`
    );
  }

  console.log(
    `[Ethereum OHLC] Cache cleared successfully for: ${tokenAddress}`
  );
}

/**
 * Custom hook to fetch Ethereum token OHLC data
 */
export function useEthereumOHLCData({
  tokenAddress,
  resolution = "hour",
  days = 30,
  force = false,
  autoRefresh = false,
  refreshInterval = 300000, // 5 minutes default
}: UseEthereumOHLCDataParams): UseEthereumOHLCDataReturn {
  const [lastFetched, setLastFetched] = useState<Date | null>(null);
  const [isSupported, setIsSupported] = useState<boolean>(true);

  // Validate token address
  useEffect(() => {
    if (tokenAddress) {
      setIsSupported(ethereumOHLCUtils.isTokenSupported(tokenAddress));
    } else {
      setIsSupported(false);
    }
  }, [tokenAddress]);

  // Generate cache key
  const cacheKey = ethereumOHLCUtils.getCacheKey(
    tokenAddress,
    resolution,
    days
  );

  // React Query for data fetching
  const {
    data,
    isLoading,
    error,
    refetch: queryRefetch,
    isError,
  } = useQuery({
    queryKey: ["ethereum-ohlc", cacheKey, force],
    queryFn: () => {
      setLastFetched(new Date());
      return fetchEthereumOHLCData({
        tokenAddress,
        resolution,
        days,
        force,
      });
    },
    enabled: !!(tokenAddress && isSupported),
    staleTime: autoRefresh ? refreshInterval : 1000 * 60 * 5, // 5 minutes if not auto-refreshing
    gcTime: 1000 * 60 * 30, // 30 minutes
    refetchInterval: autoRefresh ? refreshInterval : false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: (failureCount, error) => {
      // Don't retry on 404 (token not found) or 422 (invalid format)
      if (
        error?.message?.includes("not found") ||
        error?.message?.includes("Invalid") ||
        error?.message?.includes("format")
      ) {
        return false;
      }
      // Retry up to 2 times for other errors
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Manual refetch function
  const refetch = useCallback(() => {
    console.log(
      `[Ethereum OHLC] Manual refetch triggered for: ${tokenAddress}`
    );
    setLastFetched(new Date());
    queryRefetch();
  }, [queryRefetch, tokenAddress]);

  // Clear cache function
  const clearCache = useCallback(async () => {
    try {
      await clearEthereumOHLCCache(tokenAddress);
      // Force refetch after clearing cache
      refetch();
    } catch (err) {
      console.error(`[Ethereum OHLC] Failed to clear cache:`, err);
      throw err;
    }
  }, [tokenAddress, refetch]);

  // Format error message
  const formattedError =
    isError && error
      ? error instanceof Error
        ? error.message
        : "Unknown error occurred"
      : null;

  return {
    data,
    isLoading,
    error: formattedError,
    isSupported,
    refetch,
    clearCache,
    lastFetched,
  };
}

/**
 * Hook to get multiple tokens OHLC data (if needed in future)
 */
export function useMultipleEthereumOHLCData(
  tokens: Array<{
    address: string;
    resolution?: "hour" | "day";
    days?: number;
  }>
) {
  const results = tokens.map((token) =>
    useEthereumOHLCData({
      tokenAddress: token.address,
      resolution: token.resolution || "hour",
      days: token.days || 30,
      autoRefresh: false,
    })
  );

  return {
    results,
    isLoading: results.some((result) => result.isLoading),
    hasError: results.some((result) => result.error !== null),
    allSupported: results.every((result) => result.isSupported),
  };
}

export default useEthereumOHLCData;
