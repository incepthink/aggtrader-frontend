"use client";

import React, {
  useEffect,
  useRef,
  useMemo,
  useState,
  useCallback,
} from "react";
import { useSpotStore } from "@/store/spotStore";
import { useBinancePrices } from "@/hooks/useBinancePrices";
import { useOHLCData } from "@/hooks/useOHLCData";
import type { PortfolioToken } from "@/hooks/usePortfolioDetailed";
import {
  createChart,
  IChartApi,
  ColorType,
  UTCTimestamp,
  CandlestickData,
  Time,
} from "lightweight-charts";
import {
  CircularProgress,
  useMediaQuery,
  useTheme,
  Button,
  ButtonGroup,
} from "@mui/material";
import {
  TrendingUp,
  TrendingDown,
  Refresh,
  Timeline,
} from "@mui/icons-material";

// Utility functions
function formatUSDCompact(value: number) {
  if (value === null || value === undefined || isNaN(value)) return "$0.00";

  const abs = Math.abs(value);
  let formatted;

  if (abs >= 1_000_000_000) {
    formatted = (value / 1_000_000_000).toFixed(2) + "B";
  } else if (abs >= 1_000_000) {
    formatted = (value / 1_000_000).toFixed(2) + "M";
  } else if (abs >= 1_000) {
    formatted = (value / 1_000).toFixed(2) + "K";
  } else {
    formatted = value.toFixed(2);
  }

  return `$${formatted}`;
}

function formatPrice(value: number) {
  if (value === null || value === undefined || isNaN(value)) return "$0.00";

  if (value >= 1000) {
    return `$${value.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  } else if (value >= 1) {
    return `$${value.toFixed(2)}`;
  } else {
    return `$${value.toFixed(4)}`;
  }
}

// Create portfolio token for Binance prices
const createTokenFromSpotToken = (spotToken: any): PortfolioToken | null => {
  if (!spotToken) return null;

  return {
    symbol: spotToken.ticker,
    contract_address: spotToken.address,
    chain_id: 1,
    amount: 1,
    name: spotToken.name,
    price_to_usd: 0,
    value_usd: 0,
    abs_profit_usd: 0,
    roi: 0,
    status: "active",
  };
};

const LightweightOHLCChart = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const showInternalHeader = useMediaQuery(theme.breakpoints.up("md"));

  const tokenOne = useSpotStore((state) => state.tokenOne);

  // State to track chart readiness
  const [chartReady, setChartReady] = useState(false);

  // Chart refs
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<any>(null);

  // State for chart controls
  const [resolution, setResolution] = useState<"hour" | "day">("hour");

  // OHLC Data Hook
  const {
    data: ohlcData,
    isLoading: isLoadingOHLC,
    error: ohlcError,
    lastUpdated,
    refetch,
    isSupported,
  } = useOHLCData({
    tokenAddress: tokenOne?.address || "",
    resolution,
    limit: resolution === "hour" ? 168 : 30,
    autoRefresh: true,
    refreshInterval: 300000,
  });

  // Binance prices for header
  const tokensForPrice = useMemo((): PortfolioToken[] => {
    const token = createTokenFromSpotToken(tokenOne);
    return token ? [token] : [];
  }, [tokenOne]);

  const { getTokenPrice, isLoading: isPriceLoading } =
    useBinancePrices(tokensForPrice);

  const currentPrice = useMemo(() => {
    if (!tokenOne || tokensForPrice.length === 0) return null;
    return getTokenPrice(tokensForPrice[0]);
  }, [tokenOne, tokensForPrice, getTokenPrice]);

  // Process OHLC data for lightweight charts
  const chartData = useMemo((): CandlestickData[] => {
    if (!ohlcData?.chart) return [];

    return ohlcData.chart.map((point) => ({
      time: Math.floor(point.timestamp / 1000) as UTCTimestamp,
      open: point.open,
      high: point.high,
      low: point.low,
      close: point.close,
    }));
  }, [ohlcData]);

  // Calculate price statistics
  const priceStats = useMemo(() => {
    if (!chartData.length) return null;

    const prices = chartData.map((d) => d.close);
    const first = prices[0];
    const last = prices[prices.length - 1];
    const high = Math.max(...chartData.map((d) => d.high));
    const low = Math.min(...chartData.map((d) => d.low));

    const absolute = last - first;
    const percentage = (absolute / first) * 100;

    const startDate = new Date((chartData[0].time as number) * 1000);
    const endDate = new Date(
      (chartData[chartData.length - 1].time as number) * 1000
    );

    return {
      priceChange: { absolute, percentage },
      high,
      low,
      currentPrice: last,
      dateRange: {
        start: startDate,
        end: endDate,
        formatted: `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
      },
    };
  }, [chartData]);

  // Chart container callback ref
  const chartContainerCallback = useCallback((node: HTMLDivElement | null) => {
    if (node && !chartRef.current) {
      console.log(
        "[Chart] Container ref callback triggered, initializing chart..."
      );
      initializeChart(node);
    }
  }, []);

  const initializeChart = useCallback((container: HTMLDivElement) => {
    try {
      console.log("[Chart] Creating chart...");

      const chart = createChart(container, {
        layout: {
          background: { color: "#0d1117" },
          textColor: "#DDD",
        },
        grid: {
          vertLines: { color: "#1e222d" },
          horzLines: { color: "#1e222d" },
        },
        width: container.clientWidth,
        height: container.clientHeight,
        timeScale: {
          timeVisible: true,
          secondsVisible: false,
          borderColor: "#1e222d",
          barSpacing: 8,
          minBarSpacing: 4,
          rightOffset: 12,
          fixLeftEdge: false,
          fixRightEdge: false,
        },
        rightPriceScale: {
          scaleMargins: {
            top: 0.1,
            bottom: 0.1,
          },
          borderVisible: true,
          borderColor: "#2B2B43",
          textColor: "#d1d4dc",
          autoScale: true,
          alignLabels: true,
          visible: true,
          ticksVisible: true,
        },
        crosshair: {
          mode: 1,
          vertLine: {
            color: "#758696",
            width: 1,
            style: 1,
            labelBackgroundColor: "#131722",
            labelVisible: true,
          },
          horzLine: {
            color: "#758696",
            width: 1,
            style: 1,
            labelBackgroundColor: "#131722",
            labelVisible: true,
          },
        },
        handleScroll: {
          mouseWheel: true,
          pressedMouseMove: true,
          horzTouchDrag: true,
          vertTouchDrag: true,
        },
        handleScale: {
          axisPressedMouseMove: true,
          mouseWheel: true,
          pinch: true,
        },
      });

      const candlestickSeries = chart.addCandlestickSeries({
        upColor: "#22c55e",
        downColor: "#ef4444",
        borderVisible: false,
        wickUpColor: "#22c55e",
        wickDownColor: "#ef4444",
        wickVisible: true,
        priceFormat: {
          type: "price",
          precision: 6,
          minMove: 0.000001,
        },
      });

      chartRef.current = chart;
      candlestickSeriesRef.current = candlestickSeries;

      console.log("[Chart] Chart created successfully");
      setChartReady(true);

      // Handle resize
      const handleResize = () => {
        if (chart && container) {
          chart.applyOptions({
            width: container.clientWidth,
            height: container.clientHeight,
          });
        }
      };

      window.addEventListener("resize", handleResize);

      // Store cleanup function
      const cleanup = () => {
        console.log("[Chart] Cleaning up chart...");
        window.removeEventListener("resize", handleResize);
        setChartReady(false);
        if (chartRef.current) {
          chartRef.current.remove();
          chartRef.current = null;
          candlestickSeriesRef.current = null;
        }
      };

      // Return cleanup function
      return cleanup;
    } catch (error) {
      console.error("[Chart] Error creating chart:", error);
    }
  }, []);

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (chartRef.current) {
        console.log("[Chart] Component unmounting, cleaning up...");
        chartRef.current.remove();
        chartRef.current = null;
        candlestickSeriesRef.current = null;
        setChartReady(false);
      }
    };
  }, []);

  // Update chart data when OHLC data changes
  useEffect(() => {
    if (!chartReady || !chartRef.current || !candlestickSeriesRef.current) {
      console.log(
        "[Chart] Chart not ready yet - ready:",
        chartReady,
        "chart:",
        !!chartRef.current,
        "series:",
        !!candlestickSeriesRef.current
      );
      return;
    }

    if (!chartData.length) {
      console.log("[Chart] No chart data available");
      return;
    }

    try {
      console.log(
        "[Chart] Updating chart with data:",
        chartData.length,
        "candles"
      );
      console.log("[Chart] Sample data:", chartData.slice(0, 3));

      // Validate data format
      const validData = chartData.filter((candle) => {
        return (
          candle.time &&
          typeof candle.open === "number" &&
          typeof candle.high === "number" &&
          typeof candle.low === "number" &&
          typeof candle.close === "number" &&
          !isNaN(candle.open) &&
          !isNaN(candle.high) &&
          !isNaN(candle.low) &&
          !isNaN(candle.close)
        );
      });

      console.log("[Chart] Valid data points:", validData.length);

      if (validData.length === 0) {
        console.error("[Chart] No valid data points found");
        return;
      }

      candlestickSeriesRef.current.setData(validData);
      console.log("[Chart] Data set successfully");

      // Auto-fit content with some padding
      setTimeout(() => {
        if (chartRef.current) {
          console.log("[Chart] Fitting content...");
          const timeScale = chartRef.current.timeScale();
          timeScale.fitContent();

          // Force a resize to ensure visibility
          if (chartContainerRef.current) {
            chartRef.current.applyOptions({
              width: chartContainerRef.current.clientWidth,
              height: chartContainerRef.current.clientHeight,
            });
          }
        }
      }, 200);
    } catch (error) {
      console.error("[Chart] Error updating chart data:", error);
    }
  }, [chartData, chartReady]);

  // Handle loading states
  if (!tokenOne) {
    return (
      <div className="w-full h-full flex justify-center items-center">
        <div className="text-gray-400">Select a token to view chart</div>
      </div>
    );
  }

  if (isLoadingOHLC && chartData.length === 0) {
    return (
      <div className="w-full h-full flex justify-center items-center">
        <div className="flex flex-col items-center gap-3">
          <CircularProgress size={40} sx={{ color: "#00b4ff" }} />
          <div className="text-gray-400 text-sm">Loading OHLC data...</div>
        </div>
      </div>
    );
  }

  if (ohlcError || !isSupported) {
    return (
      <div className="w-full h-full flex justify-center items-center">
        <div className="text-center">
          <div className="text-red-400 mb-2">
            {ohlcError || "No trading data available for this token"}
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

  if (chartData.length === 0) {
    return (
      <div className="w-full h-full flex justify-center items-center">
        <div className="text-gray-400">No chart data available</div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      {/* Header inside chart container */}
      {showInternalHeader && tokenOne && (
        <div
          className={`absolute ${
            isMobile ? "top-2 left-2 right-2" : "top-3 left-4 right-4"
          } ${isMobile ? "flex-col gap-3" : "flex justify-between"} flex ${
            isMobile ? "items-start" : "items-center"
          } z-10`}
        >
          {/* Token Info with Price Stats */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 md:gap-4">
              <div
                className={`${
                  isMobile ? "w-8" : "w-12"
                } rounded-full overflow-hidden flex-shrink-0`}
              >
                <img
                  src={tokenOne.img}
                  alt={tokenOne.ticker}
                  className="w-full object-cover"
                />
              </div>
              <div>
                <p
                  className={`${
                    isMobile ? "text-lg" : "text-2xl"
                  } font-semibold text-white`}
                >
                  {tokenOne.name}
                </p>
                {priceStats && (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[#00F5E0] font-semibold">
                      {formatPrice(currentPrice || priceStats.currentPrice)}
                    </span>
                    <span
                      className={`flex items-center gap-1 text-sm ${
                        priceStats.priceChange.percentage >= 0
                          ? "text-green-400"
                          : "text-red-400"
                      }`}
                    >
                      {priceStats.priceChange.percentage >= 0 ? (
                        <TrendingUp size={16} />
                      ) : (
                        <TrendingDown size={16} />
                      )}
                      {priceStats.priceChange.percentage >= 0 ? "+" : ""}
                      {priceStats.priceChange.percentage.toFixed(2)}%
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Chart Controls and Metrics */}
          <div className="flex flex-col gap-2">
            {/* Chart Controls */}
            <div className="flex gap-2">
              <ButtonGroup size="small" variant="outlined">
                <Button
                  onClick={() => setResolution("hour")}
                  variant={resolution === "hour" ? "contained" : "outlined"}
                  sx={{
                    color: resolution === "hour" ? "white" : "#00b4ff",
                    backgroundColor:
                      resolution === "hour" ? "#00b4ff" : "transparent",
                    borderColor: "#00b4ff",
                    "&:hover": {
                      backgroundColor:
                        resolution === "hour"
                          ? "#0099cc"
                          : "rgba(0, 180, 255, 0.1)",
                    },
                  }}
                >
                  1H
                </Button>
                <Button
                  onClick={() => setResolution("day")}
                  variant={resolution === "day" ? "contained" : "outlined"}
                  sx={{
                    color: resolution === "day" ? "white" : "#00b4ff",
                    backgroundColor:
                      resolution === "day" ? "#00b4ff" : "transparent",
                    borderColor: "#00b4ff",
                    "&:hover": {
                      backgroundColor:
                        resolution === "day"
                          ? "#0099cc"
                          : "rgba(0, 180, 255, 0.1)",
                    },
                  }}
                >
                  1D
                </Button>
              </ButtonGroup>

              <Button
                onClick={refetch}
                size="small"
                startIcon={<Refresh />}
                sx={{ color: "#00b4ff", borderColor: "#00b4ff" }}
                variant="outlined"
                disabled={isLoadingOHLC}
              >
                {isLoadingOHLC ? "..." : "Refresh"}
              </Button>
            </div>

            {/* Metrics */}
            <div className="flex gap-4 text-sm">
              {ohlcData?.metadata && (
                <>
                  <div className="flex flex-col items-center">
                    <span className="text-gray-400 text-xs">1INCH</span>
                    <span className="text-white font-medium">CHARTS</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-gray-400 text-xs">PAIR</span>
                    <span className="text-white font-medium">
                      {ohlcData.metadata.pair.quoteToken.symbol}
                    </span>
                  </div>
                  {priceStats && (
                    <>
                      <div className="flex flex-col items-center">
                        <span className="text-gray-400 text-xs">HIGH</span>
                        <span className="text-green-400 font-medium">
                          {formatPrice(priceStats.high)}
                        </span>
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="text-gray-400 text-xs">LOW</span>
                        <span className="text-red-400 font-medium">
                          {formatPrice(priceStats.low)}
                        </span>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>

            {/* Date Range Info */}
            {priceStats?.dateRange && (
              <div className="text-xs text-gray-400 mt-1">
                {priceStats.dateRange.formatted}
                <span className="ml-2 text-green-400">(1inch Charts API)</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Chart Container */}
      <div className={`w-full h-full ${showInternalHeader ? "pt-20" : "pt-2"}`}>
        <div
          ref={chartContainerCallback}
          className="w-full h-full bg-[#0d1117] rounded-lg"
          style={{ minHeight: "400px" }}
        />

        {/* Debug info */}
        {process.env.NODE_ENV === "development" && (
          <div className="absolute bottom-2 left-2 text-xs text-gray-500 bg-black/50 p-2 rounded">
            Data points: {chartData.length} | Chart ready:{" "}
            {chartReady ? "Yes" : "No"} | Chart ref:{" "}
            {chartRef.current ? "Yes" : "No"} | Series ref:{" "}
            {candlestickSeriesRef.current ? "Yes" : "No"}
          </div>
        )}
      </div>
    </div>
  );
};

export default LightweightOHLCChart;
