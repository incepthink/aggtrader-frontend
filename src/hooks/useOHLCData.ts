// hooks/useOHLCData.ts
import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { BACKEND_URL } from "@/utils/constants";

export interface OHLCPoint {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface OHLCMetadata {
  pair: {
    address: string;
    baseToken: {
      address: string;
      name: string;
      symbol: string;
    };
    quoteToken: {
      address: string;
      name: string;
      symbol: string;
    };
    dexId: string;
    url: string;
  };
  liquidity: {
    usd: number;
    base: number;
    quote: number;
  };
  volume24h: number;
  fdv: number;
  marketCap: number;
  priceUsd: number;
  currency: string;
  dataSource: string;
}

export interface OHLCData {
  chart: OHLCPoint[];
  metadata: OHLCMetadata;
}

export interface UseOHLCDataProps {
  tokenAddress: string;
  resolution?: "minute" | "hour" | "day";
  limit?: number;
  autoRefresh?: boolean;
  refreshInterval?: number; // in milliseconds
}

export interface UseOHLCDataReturn {
  data: OHLCData | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: number;
  refetch: () => Promise<void>;
  isSupported: boolean;
  dataSource: string;
}

export const useOHLCData = ({
  tokenAddress,
  resolution = "hour",
  limit = 1000,
  autoRefresh = false,
  refreshInterval = 300000, // 5 minutes
}: UseOHLCDataProps): UseOHLCDataReturn => {
  const [data, setData] = useState<OHLCData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number>(0);
  const [isSupported, setIsSupported] = useState(true);
  const [dataSource, setDataSource] = useState<string>("1inch");

  const fetchOHLCData = useCallback(async () => {
    if (!tokenAddress) return;

    // Don't fetch if already loading
    if (isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      console.log(
        `[OHLC] Fetching 1inch charts data for ${tokenAddress}, resolution: ${resolution}, limit: ${limit}`
      );

      const response = await axios.get(`${BACKEND_URL}/api/ohlc`, {
        params: {
          tokenAddress,
          resolution,
          limit,
        },
        timeout: 30000, // 30 second timeout
      });

      if (response.data.status === "success") {
        setData(response.data.data);
        setLastUpdated(Date.now());
        setIsSupported(true);
        setDataSource(response.data.source || "1inch");

        console.log(
          `[OHLC] Successfully fetched ${response.data.data.chart.length} candles from 1inch charts API`
        );
      } else {
        throw new Error(response.data.msg || "Failed to fetch OHLC data");
      }
    } catch (err: any) {
      console.error("[OHLC] Fetch error:", err);

      let errorMessage = "Failed to fetch OHLC data";

      if (err.response?.status === 404) {
        errorMessage = "No trading data available for this token pair";
        setIsSupported(false);
      } else if (err.response?.status === 401) {
        errorMessage = "1inch API authentication required";
        setIsSupported(false);
      } else if (err.response?.status === 429) {
        errorMessage = "Rate limited by 1inch API - please wait";
      } else if (err.response?.data?.msg) {
        errorMessage = err.response.data.msg;
      } else if (err.message?.includes("timeout")) {
        errorMessage = "Request timeout - please try again";
      } else if (err.message?.includes("Network Error")) {
        errorMessage = "Network error - please check your connection";
      }

      setError(errorMessage);

      // Mark as unsupported for 404 and 401 errors
      if (err.response?.status === 404 || err.response?.status === 401) {
        setIsSupported(false);
      }
    } finally {
      setIsLoading(false);
    }
  }, [tokenAddress, resolution, limit, isLoading]);

  // Initial fetch when dependencies change
  useEffect(() => {
    if (tokenAddress) {
      // Reset state when token changes
      setData(null);
      setError(null);
      setIsSupported(true);
      setDataSource("1inch");
      fetchOHLCData();
    }
  }, [tokenAddress, resolution, limit]);

  // Auto refresh effect
  useEffect(() => {
    if (!autoRefresh || !tokenAddress) return;

    const interval = setInterval(() => {
      console.log("[OHLC] Auto-refreshing 1inch charts data...");
      fetchOHLCData();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchOHLCData, tokenAddress]);

  // Manual refetch function
  const refetch = useCallback(async () => {
    await fetchOHLCData();
  }, [fetchOHLCData]);

  return {
    data,
    isLoading,
    error,
    lastUpdated,
    refetch,
    isSupported,
    dataSource,
  };
};

// Utility hook for batch OHLC data
export const useBatchOHLCData = () => {
  const [batchData, setBatchData] = useState<{ [address: string]: OHLCData }>(
    {}
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBatchOHLC = useCallback(
    async (
      tokenAddresses: string[],
      resolution: "minute" | "hour" | "day" = "hour",
      limit: number = 1000
    ) => {
      if (!tokenAddresses.length) return;

      setIsLoading(true);
      setError(null);

      try {
        console.log(
          `[OHLC Batch] Fetching 1inch charts data for ${tokenAddresses.length} tokens`
        );

        const response = await axios.post(
          `${BACKEND_URL}/api/ohlc/batch`,
          {
            tokenAddresses,
            resolution,
            limit,
          },
          {
            timeout: 60000, // 60 second timeout for batch requests
          }
        );

        if (response.data.status === "success") {
          setBatchData(response.data.data);
          console.log(
            `[OHLC Batch] Successfully fetched data for ${response.data.successful} tokens from 1inch charts`
          );

          if (response.data.failed > 0) {
            console.warn(
              `[OHLC Batch] Failed to fetch data for ${response.data.failed} tokens:`,
              response.data.errors
            );
          }
        } else {
          throw new Error(
            response.data.msg || "Failed to fetch batch OHLC data from 1inch"
          );
        }
      } catch (err: any) {
        console.error("[OHLC Batch] Fetch error:", err);
        const errorMessage =
          err.response?.data?.msg ||
          err.message ||
          "Failed to fetch batch OHLC data from 1inch";
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return {
    batchData,
    isLoading,
    error,
    fetchBatchOHLC,
  };
};

// Utility functions for OHLC data processing
export const ohlcUtils = {
  // Get price change between first and last candle
  getPriceChange: (
    data: OHLCPoint[]
  ): { absolute: number; percentage: number } => {
    if (!data || data.length < 2) return { absolute: 0, percentage: 0 };

    const first = data[0].close;
    const last = data[data.length - 1].close;
    const absolute = last - first;
    const percentage = (absolute / first) * 100;

    return { absolute, percentage };
  },

  // Get highest and lowest prices in the dataset
  getHighLow: (data: OHLCPoint[]): { high: number; low: number } => {
    if (!data || data.length === 0) return { high: 0, low: 0 };

    let high = data[0].high;
    let low = data[0].low;

    data.forEach((point) => {
      if (point.high > high) high = point.high;
      if (point.low < low) low = point.low;
    });

    return { high, low };
  },

  // Calculate total volume (note: 1inch charts don't provide volume)
  getTotalVolume: (data: OHLCPoint[]): number => {
    if (!data || data.length === 0) return 0;
    return data.reduce((total, point) => total + point.volume, 0);
  },

  // Get average price (OHLC4)
  getAveragePrice: (point: OHLCPoint): number => {
    return (point.open + point.high + point.low + point.close) / 4;
  },

  // Format timestamp for display
  formatTimestamp: (
    timestamp: number,
    resolution: "minute" | "hour" | "day"
  ): string => {
    const date = new Date(timestamp);

    switch (resolution) {
      case "minute":
        return date.toLocaleTimeString(undefined, {
          hour: "2-digit",
          minute: "2-digit",
        });
      case "hour":
        return date.toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          hour: "2-digit",
        });
      case "day":
        return date.toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        });
      default:
        return date.toLocaleDateString();
    }
  },

  // Check if data is from 1inch charts API
  isOneInchData: (metadata: OHLCMetadata): boolean => {
    return metadata.dataSource === "api";
  },

  // Get data reliability score
  getDataReliability: (
    metadata: OHLCMetadata
  ): {
    score: number;
    description: string;
  } => {
    if (ohlcUtils.isOneInchData(metadata)) {
      return {
        score: 0.95, // 1inch charts are highly reliable
        description: "Real aggregated price data from 1inch",
      };
    }
    return {
      score: 0.7,
      description: "Estimated data",
    };
  },

  // Calculate volatility from OHLC data
  calculateVolatility: (data: OHLCPoint[]): number => {
    if (!data || data.length < 2) return 0;

    const returns = data.slice(1).map((point, index) => {
      const prevClose = data[index].close;
      return Math.log(point.close / prevClose);
    });

    const mean = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const variance =
      returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) /
      returns.length;

    return Math.sqrt(variance) * Math.sqrt(252); // Annualized volatility
  },

  // Get trend direction
  getTrend: (data: OHLCPoint[]): "bullish" | "bearish" | "sideways" => {
    if (!data || data.length < 10) return "sideways";

    const firstHalf = data.slice(0, Math.floor(data.length / 2));
    const secondHalf = data.slice(Math.floor(data.length / 2));

    const firstAvg =
      firstHalf.reduce((sum, point) => sum + point.close, 0) / firstHalf.length;
    const secondAvg =
      secondHalf.reduce((sum, point) => sum + point.close, 0) /
      secondHalf.length;

    const change = (secondAvg - firstAvg) / firstAvg;

    if (change > 0.02) return "bullish"; // >2% increase
    if (change < -0.02) return "bearish"; // >2% decrease
    return "sideways";
  },
};
