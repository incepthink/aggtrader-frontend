"use client";

import React, {
  useEffect,
  useRef,
  useMemo,
  useState,
  useCallback,
} from "react";
import { useEthereumPoolOHLC } from "../../hooks/useEthereumPoolOHLC";
import { usePriceBackend } from "../../hooks/sushiswap/usePriceBackend";
import { useSpotStore } from "@/store/spotStore";
import {
  createChart,
  IChartApi,
  UTCTimestamp,
  CandlestickData,
} from "lightweight-charts";
import { CircularProgress, Button, ButtonGroup } from "@mui/material";
import { Refresh } from "@mui/icons-material";

export function formatCompact(input: number | string, maxDecimals = 2): string {
  let n = typeof input === "string" ? parseFloat(input) : input;
  if (!Number.isFinite(n)) return "–";

  const sign = n < 0 ? "-" : "";
  n = Math.abs(n);

  const units = [
    { v: 1e12, s: "T" },
    { v: 1e9, s: "B" },
    { v: 1e6, s: "M" },
    { v: 1e3, s: "K" },
  ];

  for (const { v, s } of units) {
    if (n >= v) {
      return sign + trimZeros((n / v).toFixed(maxDecimals)) + s;
    }
  }

  // For values < 1000, show up to maxDecimals but trim trailing zeros
  return sign + trimZeros(n.toFixed(maxDecimals));
}

function trimZeros(x: string): string {
  return x.replace(/\.0+$|(\.\d*?[1-9])0+$/, "$1");
}

function formatPrice(price: number): string {
  if (price === 0) return "0.00";
  if (price < 0.01) return price.toFixed(6);
  if (price < 1) return price.toFixed(4);
  if (price < 100) return price.toFixed(2);
  return formatCompact(price);
}

const EthereumPoolCandlestickChart = () => {
  // State
  const [resolution, setResolution] = useState<
    "5m" | "15m" | "1h" | "4h" | "1d"
  >("5m");
  const [chartReady, setChartReady] = useState(false);
  const [renderKey, setRenderKey] = useState(0); // Force re-render key
  const [chartError, setChartError] = useState<string | null>(null);

  // Refs
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<any>(null);
  const containerObserverRef = useRef<ResizeObserver | null>(null);

  // Get token from store
  const { tokenOne, chainId } = useSpotStore();

  // Get token address with native token handling
  const getTokenAddress = (token: any) => {
    if (!token) return null;
    if (token.isNative || token.ticker === "ETH") {
      return "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"; // WETH on Ethereum
    }
    return token.address;
  };

  const tokenAddress = getTokenAddress(tokenOne);

  // Force re-render when token changes
  useEffect(() => {
    setRenderKey((prev) => prev + 1);
  }, [tokenAddress]);

  // Ethereum Pool OHLC Data Hook (USDC pairs only)
  const {
    data: ohlcData,
    metadata,
    loading: isLoading,
    error,
    refetch,
    lastUpdated,
    isFromCache,
  } = useEthereumPoolOHLC({
    tokenAddress: tokenAddress || "",
    resolution,
    days: 30,
    enabled: !!tokenAddress && chainId === 1, // Only for Ethereum
    refreshInterval: 300000, // 5 minutes
  });

  // Get current price using existing price backend (Ethereum chainId: 1)
  const {
    tokenPrice: currentPrice,
    isLoading: priceIsLoading,
    isError: priceHasError,
    error: priceErrorData,
    refetch: refetchPrice,
  } = usePriceBackend(
    tokenAddress as any, // Cast to Address type
    undefined, // No comparison token needed
    1, // Ethereum chainId
    {
      enabled: !!tokenAddress && chainId === 1,
      refetchInterval: 30000, // 30 seconds
      staleTime: 15000, // 15 seconds
    }
  );

  // Process OHLC data for chart
  const chartData = useMemo((): CandlestickData[] => {
    if (!ohlcData) {
      return [];
    }

    try {
      const processed = ohlcData
        .filter((point) => {
          return (
            point.timestamp &&
            point.open > 0 &&
            point.high > 0 &&
            point.low > 0 &&
            point.close > 0 &&
            !isNaN(point.open) &&
            !isNaN(point.high) &&
            !isNaN(point.low) &&
            !isNaN(point.close)
          );
        })
        .map((point) => ({
          time: Math.floor(point.timestamp / 1000) as UTCTimestamp,
          open: Number(point.open),
          high: Number(point.high),
          low: Number(point.low),
          close: Number(point.close),
        }))
        .sort((a, b) => a.time - b.time);

      return processed;
    } catch (err) {
      console.error("Error processing chart data:", err);
      setChartError(`Data processing error: ${err}`);
      return [];
    }
  }, [ohlcData, renderKey]); // Add renderKey to dependencies

  // Calculate price change using current price and historical data
  const priceChange = useMemo(() => {
    if (!currentPrice || chartData.length === 0) {
      return { percentage: 0, absolute: 0 };
    }

    // Use the first available price from chart data as baseline
    const historicalPrice =
      chartData[0]?.close || chartData[chartData.length - 1]?.close;
    if (!historicalPrice) {
      return { percentage: 0, absolute: 0 };
    }

    const absolute = currentPrice - historicalPrice;
    const percentage = (absolute / historicalPrice) * 100;

    return { percentage, absolute };
  }, [currentPrice, chartData]);

  const { high, low } = useMemo(() => {
    if (chartData.length === 0) {
      return { high: 0, low: 0 };
    }

    let high = chartData[0].high;
    let low = chartData[0].low;

    for (const candle of chartData) {
      if (candle.high > high) high = candle.high;
      if (candle.low < low) low = candle.low;
    }

    return { high, low };
  }, [chartData]);

  // Clean up chart function
  const cleanupChart = useCallback(() => {
    if (containerObserverRef.current) {
      containerObserverRef.current.disconnect();
      containerObserverRef.current = null;
    }

    if (chartRef.current) {
      try {
        chartRef.current.remove();
      } catch (err) {
        console.error("Error removing chart:", err);
      }
      chartRef.current = null;
      candlestickSeriesRef.current = null;
    }
    setChartReady(false);
  }, []);

  // Initialize chart function
  const initializeChart = useCallback(() => {
    if (!chartContainerRef.current || !tokenAddress) {
      return;
    }

    try {
      setChartError(null);
      cleanupChart();

      const container = chartContainerRef.current;

      // Wait for container to be properly sized
      const checkAndCreateChart = () => {
        const rect = container.getBoundingClientRect();

        if (rect.width === 0 || rect.height === 0) {
          // Container not ready, try again
          setTimeout(checkAndCreateChart, 50);
          return;
        }

        try {
          // Create chart
          const chart = createChart(container, {
            layout: {
              background: { color: "#0d1117" },
              textColor: "#DDD",
            },
            grid: {
              vertLines: { color: "#1e222d" },
              horzLines: { color: "#1e222d" },
            },
            width: Math.floor(rect.width),
            height: Math.floor(rect.height),
            timeScale: {
              timeVisible: true,
              secondsVisible: false,
              borderColor: "#1e222d",
            },
            rightPriceScale: {
              borderColor: "#2B2B43",
              textColor: "#d1d4dc",
              autoScale: true,
            },
            crosshair: {
              vertLine: {
                color: "#758696",
                width: 1,
                style: 1,
              },
              horzLine: {
                color: "#758696",
                width: 1,
                style: 1,
              },
            },
          });

          // Add candlestick series
          const candlestickSeries = chart.addCandlestickSeries({
            upColor: "#22c55e",
            downColor: "#ef4444",
            borderVisible: false,
            wickUpColor: "#22c55e",
            wickDownColor: "#ef4444",
          });

          chartRef.current = chart;
          candlestickSeriesRef.current = candlestickSeries;

          // Set up resize observer
          containerObserverRef.current = new ResizeObserver(() => {
            if (chartRef.current && chartContainerRef.current) {
              const newRect = chartContainerRef.current.getBoundingClientRect();
              chartRef.current.applyOptions({
                width: Math.floor(newRect.width),
                height: Math.floor(newRect.height),
              });
            }
          });

          containerObserverRef.current.observe(container);

          setChartReady(true);

          // Force immediate data update if we have data
          if (chartData.length > 0) {
            setTimeout(() => {
              if (candlestickSeriesRef.current && chartData.length > 0) {
                candlestickSeriesRef.current.setData(chartData);

                // Set default zoom to show recent data
                if (chartRef.current) {
                  try {
                    chartRef.current.timeScale().fitContent();
                  } catch (err) {
                    console.warn("Failed to fit content:", err);
                  }
                }
              }
            }, 100);
          }
        } catch (err) {
          console.error("Error creating chart:", err);
          setChartError(`Chart creation error: ${err}`);
        }
      };

      // Start the check
      checkAndCreateChart();
    } catch (err) {
      console.error("Error initializing chart:", err);
      setChartError(`Chart initialization error: ${err}`);
    }
  }, [tokenAddress, cleanupChart, chartData]);

  // Initialize chart when token changes or component mounts
  useEffect(() => {
    if (tokenAddress && chainId === 1) {
      // Delay initialization to ensure DOM is ready
      const timer = setTimeout(() => {
        initializeChart();
      }, 100);

      return () => {
        clearTimeout(timer);
        cleanupChart();
      };
    } else {
      cleanupChart();
    }
  }, [tokenAddress, chainId, renderKey, initializeChart, cleanupChart]);

  // Update chart data when data changes
  useEffect(() => {
    if (!chartReady || !chartRef.current || !candlestickSeriesRef.current) {
      return;
    }

    try {
      if (chartData.length === 0) {
        candlestickSeriesRef.current.setData([]);
        return;
      }

      // Set the data
      candlestickSeriesRef.current.setData(chartData);

      // Fit content
      setTimeout(() => {
        if (chartRef.current) {
          chartRef.current.timeScale().fitContent();
        }
      }, 100);
    } catch (err) {
      console.error("Error updating chart data:", err);
      setChartError(`Chart update error: ${err}`);
    }
  }, [chartData, chartReady]);

  // Force re-initialization when resolution changes
  useEffect(() => {
    if (chartReady && tokenAddress && chainId === 1) {
      const timer = setTimeout(() => {
        initializeChart();
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [resolution]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupChart();
    };
  }, [cleanupChart]);

  // Handle no token selected
  if (!tokenOne) {
    return (
      <div className="w-full h-full flex justify-center items-center">
        <div className="text-gray-400">
          Select a token to view Ethereum chart
        </div>
      </div>
    );
  }

  // Handle wrong chain
  if (chainId !== 1) {
    return (
      <div className="w-full h-full flex justify-center items-center">
        <div className="text-center">
          <div className="text-yellow-400 mb-2">
            Switch to Ethereum network to view charts
          </div>
          <div className="text-xs text-gray-500">
            Current chain: {chainId === 747474 ? "Katana" : `Chain ${chainId}`}
          </div>
        </div>
      </div>
    );
  }

  // Error states
  if (chartError) {
    return (
      <div className="w-full h-full flex justify-center items-center">
        <div className="text-center">
          <div className="text-red-400 mb-2">Chart Error: {chartError}</div>
          <Button
            onClick={() => {
              setChartError(null);
              setRenderKey((prev) => prev + 1);
            }}
            size="small"
            startIcon={<Refresh />}
            sx={{ color: "#00b4ff" }}
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full flex justify-center items-center">
        <div className="text-center">
          <div className="text-red-400 mb-2">
            {error.includes("No USDC pair")
              ? `No USDC trading pairs found for ${tokenOne.ticker}`
              : error}
          </div>
          <div className="text-xs text-gray-500 mb-2">
            This token needs USDC trading pairs on SushiSwap
          </div>
          <Button
            onClick={refetch}
            size="small"
            startIcon={<Refresh />}
            sx={{ color: "#00b4ff" }}
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // Loading state - show loading if either OHLC or price is loading
  if ((isLoading || priceIsLoading) && chartData.length === 0) {
    return (
      <div className="w-full h-full flex justify-center items-center">
        <div className="flex flex-col items-center gap-3">
          <CircularProgress size={40} sx={{ color: "#00b4ff" }} />
          <div className="text-gray-400 text-sm">
            Loading {isLoading ? "USDC pair data" : "price"} for{" "}
            {tokenOne.ticker}...
          </div>
        </div>
      </div>
    );
  }

  // No data state
  if (chartData.length === 0) {
    return (
      <div className="w-full h-full flex justify-center items-center">
        <div className="text-center">
          <div className="text-gray-400 mb-2">
            No USDC pair data available for {tokenOne.ticker}
          </div>
          <div className="text-xs text-gray-500">
            Token: {tokenAddress?.slice(0, 8)}...{tokenAddress?.slice(-6)}
          </div>
          <Button
            onClick={() => setRenderKey((prev) => prev + 1)}
            size="small"
            sx={{ color: "#00b4ff", mt: 1 }}
          >
            Force Refresh
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div key={renderKey} className="w-full h-full relative p-4">
      {/* Header */}
      <div className="absolute top-3 left-4 right-4 flex justify-between items-center z-10">
        {/* Token Info */}
        <div className="flex items-center gap-3">
          {tokenOne?.img && (
            <img
              src={tokenOne.img}
              alt={tokenOne.ticker}
              className="w-8 h-8 rounded-full"
            />
          )}
          <div>
            <p className="text-lg font-semibold text-white">
              {tokenOne.ticker}/USDC
            </p>
            <div className="flex items-center gap-2">
              <span className="text-[#00F5E0] font-semibold">
                {priceIsLoading ? (
                  <CircularProgress size={16} sx={{ color: "#00F5E0" }} />
                ) : currentPrice ? (
                  `$${formatPrice(currentPrice)}`
                ) : metadata?.currentPrice ? (
                  `$${formatPrice(metadata.currentPrice)}`
                ) : (
                  "$0.00"
                )}
              </span>
              <span
                className={`text-sm ${
                  priceChange.percentage >= 0
                    ? "text-green-400"
                    : "text-red-400"
                }`}
              >
                {priceChange.percentage >= 0 ? "+" : ""}
                {priceChange.percentage.toFixed(2)}%
              </span>
              {priceHasError && (
                <span className="text-xs text-red-400">Price Error</span>
              )}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-2">
          {/* Resolution Selector */}
          <ButtonGroup size="small" sx={{ mr: 2 }}>
            {(["5m", "15m", "1h", "4h", "1d"] as const).map((res) => (
              <Button
                key={res}
                onClick={() => setResolution(res)}
                variant={resolution === res ? "contained" : "outlined"}
                sx={{
                  color: resolution === res ? "#000" : "#00b4ff",
                  borderColor: "#00b4ff",
                  bgcolor: resolution === res ? "#00b4ff" : "transparent",
                }}
              >
                {res}
              </Button>
            ))}
          </ButtonGroup>

          {/* Metadata */}
          {metadata && (
            <div className="flex gap-4 mr-4">
              <div className="flex flex-col items-center">
                <p className="text-xs text-gray-400">SWAPS</p>
                <p className="text-white">{metadata.totalSwaps}</p>
              </div>
              <div className="flex flex-col items-center">
                <p className="text-xs text-gray-400">VOL</p>
                <p className="text-white">
                  {formatCompact(metadata.totalVolumeUSD)}
                </p>
              </div>
            </div>
          )}

          <Button
            onClick={() => {
              refetch();
              refetchPrice();
              setRenderKey((prev) => prev + 1);
            }}
            size="small"
            startIcon={<Refresh />}
            sx={{ color: "#00b4ff", borderColor: "#00b4ff" }}
            variant="outlined"
            disabled={isLoading || priceIsLoading}
          >
            {isLoading || priceIsLoading ? "..." : "Refresh"}
          </Button>
        </div>
      </div>

      {/* Chart Container */}
      <div className="w-full h-full pt-16">
        <div
          ref={chartContainerRef}
          className="w-full h-full bg-[#0d1117] rounded-lg"
          style={{
            minHeight: "400px",
            position: "relative",
          }}
        />
      </div>

      {/* Status indicator */}
      <div className="absolute bottom-3 left-4 text-xs text-gray-400 bg-black/70 px-2 py-1 rounded">
        {chartReady ? "📈" : "⏳"} Ready: {chartReady.toString()} | Data:{" "}
        {chartData.length} |{isFromCache && " 💾 Cached | "}
        {lastUpdated && `Updated: ${lastUpdated.toLocaleTimeString()}`}
      </div>

      {/* Price Stats */}
      <div className="absolute bottom-3 right-4 flex gap-4 text-xs text-gray-300 bg-black/70 px-2 py-1 rounded">
        <div className="flex flex-col items-center">
          <span className="text-gray-400">HIGH</span>
          <span className="text-green-400 font-medium">
            ${formatPrice(high)}
          </span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-gray-400">LOW</span>
          <span className="text-red-400 font-medium">${formatPrice(low)}</span>
        </div>
      </div>
    </div>
  );
};

export default EthereumPoolCandlestickChart;
