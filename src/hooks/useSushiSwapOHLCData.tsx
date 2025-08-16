// hooks/useSushiSwapOHLCData.ts
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

export interface SushiSwapOHLCMetadata {
  pair: {
    address: string;
    baseToken: {
      address: string;
      name: string;
      symbol: string;
      decimals: string;
    };
    quoteToken: {
      address: string;
      name: string;
      symbol: string;
    };
    dexId: string;
    url: string;
  };
  priceUsd: number;
  currency: string;
  dataSource: string;
}

export interface SushiSwapOHLCData {
  chart: OHLCPoint[];
  metadata: SushiSwapOHLCMetadata;
}

export interface UseSushiSwapOHLCDataProps {
  tokenAddress: string;
  resolution?: "hour" | "day";
  days?: number;
  autoRefresh?: boolean;
  refreshInterval?: number; // in milliseconds
}

export interface UseSushiSwapOHLCDataReturn {
  data: SushiSwapOHLCData | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: number;
  refetch: () => Promise<void>;
  isSupported: boolean;
  dataSource: string;
}

export const useSushiSwapOHLCData = ({
  tokenAddress,
  resolution = "hour",
  days = 30,
  autoRefresh = false,
  refreshInterval = 300000, // 5 minutes
}: UseSushiSwapOHLCDataProps): UseSushiSwapOHLCDataReturn => {
  const [data, setData] = useState<SushiSwapOHLCData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number>(0);
  const [isSupported, setIsSupported] = useState(true);
  const [dataSource, setDataSource] = useState<string>("sushiswap");

  const fetchOHLCData = useCallback(async () => {
    if (!tokenAddress) return;

    // Don't fetch if already loading
    if (isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      console.log(
        `[SushiSwap OHLC] Fetching data for ${tokenAddress}, resolution: ${resolution}, days: ${days}`
      );

      const response = await axios.get(`${BACKEND_URL}/api/ohlc/sushiswap`, {
        params: {
          tokenAddress,
          resolution,
          days,
        },
        timeout: 30000, // 30 second timeout
      });

      if (response.data.status === "success") {
        setData(response.data.data);
        setLastUpdated(Date.now());
        setIsSupported(true);
        setDataSource(response.data.source || "sushiswap");

        console.log(
          `[SushiSwap OHLC] Successfully fetched ${response.data.data.chart.length} candles from SushiSwap subgraph`
        );
      } else {
        throw new Error(
          response.data.msg || "Failed to fetch SushiSwap OHLC data"
        );
      }
    } catch (err: any) {
      console.error("[SushiSwap OHLC] Fetch error:", err);

      let errorMessage = "Failed to fetch SushiSwap OHLC data";

      if (err.response?.status === 404) {
        errorMessage = "No trading data available for this token on SushiSwap";
        setIsSupported(false);
      } else if (err.response?.status === 429) {
        errorMessage = "Rate limited by SushiSwap subgraph - please wait";
      } else if (err.response?.data?.msg) {
        errorMessage = err.response.data.msg;
      } else if (err.message?.includes("timeout")) {
        errorMessage = "Request timeout - please try again";
      } else if (err.message?.includes("Network Error")) {
        errorMessage = "Network error - please check your connection";
      }

      setError(errorMessage);

      // Mark as unsupported for 404 errors
      if (err.response?.status === 404) {
        setIsSupported(false);
      }
    } finally {
      setIsLoading(false);
    }
  }, [tokenAddress, resolution, days, isLoading]);

  // Initial fetch when dependencies change
  useEffect(() => {
    if (tokenAddress) {
      // Reset state when token changes
      setData(null);
      setError(null);
      setIsSupported(true);
      setDataSource("sushiswap");
      fetchOHLCData();
    }
  }, [tokenAddress, resolution, days]);

  // Auto refresh effect
  useEffect(() => {
    if (!autoRefresh || !tokenAddress) return;

    const interval = setInterval(() => {
      console.log("[SushiSwap OHLC] Auto-refreshing data...");
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

// Utility hook for batch SushiSwap OHLC data
export const useBatchSushiSwapOHLCData = () => {
  const [batchData, setBatchData] = useState<{
    [address: string]: SushiSwapOHLCData;
  }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBatchOHLC = useCallback(
    async (
      tokenAddresses: string[],
      resolution: "hour" | "day" = "hour",
      days: number = 30
    ) => {
      if (!tokenAddresses.length) return;

      setIsLoading(true);
      setError(null);

      try {
        console.log(
          `[SushiSwap OHLC Batch] Fetching data for ${tokenAddresses.length} tokens`
        );

        const response = await axios.post(
          `${BACKEND_URL}/api/ohlc/sushiswap/batch`,
          {
            tokenAddresses,
            resolution,
            days,
          },
          {
            timeout: 60000, // 60 second timeout for batch requests
          }
        );

        if (response.data.status === "success") {
          setBatchData(response.data.data);
          console.log(
            `[SushiSwap OHLC Batch] Successfully fetched data for ${response.data.successful} tokens`
          );

          if (response.data.failed > 0) {
            console.warn(
              `[SushiSwap OHLC Batch] Failed to fetch data for ${response.data.failed} tokens:`,
              response.data.errors
            );
          }
        } else {
          throw new Error(
            response.data.msg || "Failed to fetch batch SushiSwap OHLC data"
          );
        }
      } catch (err: any) {
        console.error("[SushiSwap OHLC Batch] Fetch error:", err);
        const errorMessage =
          err.response?.data?.msg ||
          err.message ||
          "Failed to fetch batch SushiSwap OHLC data";
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

// Utility functions for SushiSwap OHLC data processing
export const sushiSwapOHLCUtils = {
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

  // Calculate total volume in USD
  getTotalVolume: (data: OHLCPoint[]): number => {
    if (!data || data.length === 0) return 0;
    return data.reduce((total, point) => total + point.volume, 0);
  },

  // Get average price (OHLC4)
  getAveragePrice: (point: OHLCPoint): number => {
    return (point.open + point.high + point.low + point.close) / 4;
  },

  // Format timestamp for display
  formatTimestamp: (timestamp: number, resolution: "hour" | "day"): string => {
    const date = new Date(timestamp);

    switch (resolution) {
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

  // Check if data is from SushiSwap subgraph
  isSushiSwapData: (metadata: SushiSwapOHLCMetadata): boolean => {
    return metadata.dataSource === "subgraph";
  },

  // Get data reliability score
  getDataReliability: (
    metadata: SushiSwapOHLCMetadata
  ): {
    score: number;
    description: string;
  } => {
    if (sushiSwapOHLCUtils.isSushiSwapData(metadata)) {
      return {
        score: 0.9, // SushiSwap subgraph data is very reliable
        description: "Real trading data from SushiSwap V3 pools",
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

  // Calculate volume-weighted average price (VWAP)
  calculateVWAP: (data: OHLCPoint[]): number => {
    if (!data || data.length === 0) return 0;

    let totalVolumePrice = 0;
    let totalVolume = 0;

    data.forEach((point) => {
      const typicalPrice = (point.high + point.low + point.close) / 3;
      totalVolumePrice += typicalPrice * point.volume;
      totalVolume += point.volume;
    });

    return totalVolume > 0 ? totalVolumePrice / totalVolume : 0;
  },

  // Get market cap estimate (if available)
  getMarketCapEstimate: (
    metadata: SushiSwapOHLCMetadata,
    totalSupply?: number
  ): number => {
    if (!totalSupply) return 0;
    return metadata.priceUsd * totalSupply;
  },

  // Check if token has sufficient liquidity
  hasGoodLiquidity: (data: OHLCPoint[]): boolean => {
    if (!data || data.length === 0) return false;

    const recentVolume = data.slice(-24); // Last 24 periods
    const avgVolume =
      sushiSwapOHLCUtils.getTotalVolume(recentVolume) / recentVolume.length;

    // Good liquidity if average volume > $1000 per period
    return avgVolume > 1000;
  },

  // Get price impact estimate
  getPriceImpact: (data: OHLCPoint[]): "low" | "medium" | "high" => {
    if (!data || data.length < 10) return "high";

    const volatility = sushiSwapOHLCUtils.calculateVolatility(data);

    if (volatility < 0.5) return "low";
    if (volatility < 1.0) return "medium";
    return "high";
  },

  // Format price with appropriate decimals
  formatPrice: (price: number): string => {
    if (price >= 1000) return price.toFixed(2);
    if (price >= 1) return price.toFixed(4);
    if (price >= 0.01) return price.toFixed(6);
    return price.toFixed(8);
  },

  // Format volume with appropriate units
  formatVolume: (volume: number): string => {
    if (volume >= 1000000) return `$${(volume / 1000000).toFixed(2)}M`;
    if (volume >= 1000) return `$${(volume / 1000).toFixed(2)}K`;
    return `$${volume.toFixed(2)}`;
  },

  // Check if trading pair is active
  isActivePair: (data: OHLCPoint[]): boolean => {
    if (!data || data.length === 0) return false;

    const recent = data.slice(-5); // Last 5 periods
    return recent.some((point) => point.volume > 0);
  },
};

// Example usage component
export const SushiSwapOHLCExample = () => {
  const { data, isLoading, error, refetch, isSupported, dataSource } =
    useSushiSwapOHLCData({
      tokenAddress: "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984", // UNI token
      resolution: "hour",
      days: 30,
      autoRefresh: true,
      refreshInterval: 300000, // 5 minutes
    });

  if (isLoading) return <div>Loading SushiSwap OHLC data...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!isSupported) return <div>Token not supported on SushiSwap</div>;
  if (!data) return <div>No data available</div>;

  const priceChange = sushiSwapOHLCUtils.getPriceChange(data.chart);
  const { high, low } = sushiSwapOHLCUtils.getHighLow(data.chart);
  const trend = sushiSwapOHLCUtils.getTrend(data.chart);

  return (
    <div>
      <h3>{data.metadata.pair.baseToken.symbol}/USDC on SushiSwap</h3>
      <p>
        Current Price: ${sushiSwapOHLCUtils.formatPrice(data.metadata.priceUsd)}
      </p>
      <p>24h Change: {priceChange.percentage.toFixed(2)}%</p>
      <p>24h High: ${sushiSwapOHLCUtils.formatPrice(high)}</p>
      <p>24h Low: ${sushiSwapOHLCUtils.formatPrice(low)}</p>
      <p>Trend: {trend}</p>
      <p>Data Points: {data.chart.length}</p>
      <p>Source: {dataSource}</p>
      <button onClick={refetch}>Refresh Data</button>
    </div>
  );
};
