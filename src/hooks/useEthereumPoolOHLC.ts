// hooks/useEthereumPoolOHLC.ts
import { useState, useEffect, useCallback, useRef } from "react";
import axios, { AxiosError } from "axios";
import { BACKEND_URL } from "@/utils/constants";

// Types
interface OHLCPoint {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  volumeUSD: number;
  swapCount: number;
}

interface OHLCMetadata {
  tokenAddress: string;
  pairWith: string;
  totalSwaps: number;
  totalVolumeUSD: number;
  candleCount: number;
  currentPrice: number;
  dataSource: string;
  simple: boolean;
}

interface OHLCResponse {
  status: string;
  data: {
    chart: OHLCPoint[];
    metadata: OHLCMetadata;
  };
  source: string;
  cached: boolean;
  count: number;
}

interface UseEthereumPoolOHLCParams {
  tokenAddress: string;
  resolution?: "5m" | "15m" | "1h" | "4h" | "1d";
  days?: number;
  enabled?: boolean;
  refreshInterval?: number; // Auto-refresh interval in milliseconds
  force?: boolean; // Force refresh (skip cache)
}

interface UseEthereumPoolOHLCReturn {
  data: OHLCPoint[] | null;
  metadata: OHLCMetadata | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  clearCache: () => Promise<void>;
  lastUpdated: Date | null;
  isFromCache: boolean;
}

export function useEthereumPoolOHLC({
  tokenAddress,
  resolution = "5m",
  days = 7,
  enabled = true,
  refreshInterval,
  force = false,
}: UseEthereumPoolOHLCParams): UseEthereumPoolOHLCReturn {
  const [data, setData] = useState<OHLCPoint[] | null>(null);
  const [metadata, setMetadata] = useState<OHLCMetadata | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isFromCache, setIsFromCache] = useState<boolean>(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchOHLCData = useCallback(
    async (forceRefresh: boolean = false) => {
      // Validate token address
      if (!tokenAddress || !/^0x[a-f0-9]{40}$/i.test(tokenAddress)) {
        setError("Invalid token address format");
        return;
      }

      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller
      abortControllerRef.current = new AbortController();

      setLoading(true);
      setError(null);

      try {
        console.log(`[OHLC Hook] Fetching data for token: ${tokenAddress}`);

        const params = new URLSearchParams({
          tokenAddress: tokenAddress.toLowerCase(),
          resolution: "hour",
          days: days.toString(),
          ...(forceRefresh && { force: "true" }),
        });

        const response = await axios.get<OHLCResponse>(
          `${BACKEND_URL}/api/ohlc/ethereum/swaps?${params.toString()}`,
          {
            signal: abortControllerRef.current.signal,
            timeout: 30000, // 30 second timeout
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        console.log(`[OHLC Hook] Received ${response.data.count} candles`);

        if (response.data.status === "success") {
          setData(response.data.data.chart);
          setMetadata(response.data.data.metadata);
          setIsFromCache(response.data.cached);
          setLastUpdated(new Date());
          setError(null);
        } else {
          throw new Error("API returned error status");
        }
      } catch (err) {
        if (axios.isCancel(err)) {
          console.log("[OHLC Hook] Request cancelled");
          return; // Don't set error for cancelled requests
        }

        console.error("[OHLC Hook] Error fetching OHLC data:", err);

        const axiosError = err as AxiosError<any>;

        if (axiosError.response?.status === 404) {
          setError(
            "No USDC pair swaps found for this token. Try a more popular token or increase the time range."
          );
        } else if (axiosError.response?.status === 429) {
          setError("Rate limited. Please try again in a moment.");
        } else if (axiosError.response?.status === 422) {
          setError("Invalid token address format.");
        } else if (axiosError.code === "ECONNABORTED") {
          setError("Request timeout. Please try again.");
        } else {
          setError(
            axiosError.response?.data?.msg ||
              axiosError.message ||
              "Failed to fetch OHLC data"
          );
        }

        setData(null);
        setMetadata(null);
        setIsFromCache(false);
      } finally {
        setLoading(false);
      }
    },
    [tokenAddress, resolution, days]
  );

  const refetch = useCallback(async () => {
    await fetchOHLCData(force);
  }, [fetchOHLCData, force]);

  const clearCache = useCallback(async () => {
    if (!tokenAddress) return;

    try {
      console.log(`[OHLC Hook] Clearing cache for token: ${tokenAddress}`);

      const params = new URLSearchParams({
        tokenAddress: tokenAddress.toLowerCase(),
      });

      await axios.delete(
        `${BACKEND_URL}/api/ohlc/ethereum/token/cache?${params.toString()}`,
        { timeout: 10000 }
      );

      console.log("[OHLC Hook] Cache cleared successfully");

      // Refetch data after clearing cache
      await fetchOHLCData(true);
    } catch (err) {
      console.error("[OHLC Hook] Error clearing cache:", err);
      const axiosError = err as AxiosError<any>;
      setError(axiosError.response?.data?.msg || "Failed to clear cache");
    }
  }, [tokenAddress, fetchOHLCData]);

  // Initial data fetch
  useEffect(() => {
    if (enabled && tokenAddress) {
      fetchOHLCData(force);
    }

    // Cleanup function
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [enabled, fetchOHLCData, force]);

  // Auto-refresh setup
  useEffect(() => {
    if (refreshInterval && refreshInterval > 0 && enabled && tokenAddress) {
      console.log(
        `[OHLC Hook] Setting up auto-refresh every ${refreshInterval}ms`
      );

      intervalRef.current = setInterval(() => {
        fetchOHLCData(false); // Don't force refresh on auto-refresh
      }, refreshInterval);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    }
  }, [refreshInterval, enabled, tokenAddress, fetchOHLCData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    data,
    metadata,
    loading,
    error,
    refetch,
    clearCache,
    lastUpdated,
    isFromCache,
  };
}

// Utility hook for multiple tokens
export function useMultipleTokenOHLC(
  tokens: Array<{ address: string; resolution?: string; days?: number }>,
  enabled: boolean = true
) {
  const [results, setResults] = useState<{
    [address: string]: UseEthereumPoolOHLCReturn;
  }>({});

  useEffect(() => {
    if (!enabled) return;

    const newResults: { [address: string]: UseEthereumPoolOHLCReturn } = {};

    tokens.forEach((token) => {
      // This would need to be implemented differently for multiple simultaneous requests
      // For now, this is a placeholder structure
      newResults[token.address] = {
        data: null,
        metadata: null,
        loading: true,
        error: null,
        refetch: async () => {},
        clearCache: async () => {},
        lastUpdated: null,
        isFromCache: false,
      };
    });

    setResults(newResults);
  }, [tokens, enabled]);

  return results;
}

// Export types for external use
export type {
  OHLCPoint,
  OHLCMetadata,
  UseEthereumPoolOHLCParams,
  UseEthereumPoolOHLCReturn,
};
