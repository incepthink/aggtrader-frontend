"use client";

import React, {
  useEffect,
  useRef,
  useMemo,
  useState,
  useCallback,
} from "react";
import { useSpotStore } from "@/store/spotStore";
import { useSushiSwapOHLCData } from "@/hooks/useSushiSwapOHLCData";
import {
  createChart,
  IChartApi,
  UTCTimestamp,
  CandlestickData,
} from "lightweight-charts";
import { CircularProgress, Button, ButtonGroup } from "@mui/material";
import { Refresh } from "@mui/icons-material";

const SushiSwapCandlestickChart: React.FC = () => {
  const tokenOne = useSpotStore((state) => state.tokenOne);
  // State
  const [chartReady, setChartReady] = useState(false);
  const [resolution, setResolution] = useState<"hour" | "day">("hour");

  // Refs
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<any>(null);

  // OHLC Data Hook
  const {
    data: ohlcData,
    isLoading,
    error,
    refetch,
    isSupported,
  } = useSushiSwapOHLCData({
    tokenAddress: tokenOne?.address || "",
    resolution,
    days: resolution === "hour" ? 7 : 30,
    autoRefresh: true,
    refreshInterval: 300000,
  });

  // Process OHLC data for chart
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

  // Initialize chart
  const initializeChart = useCallback((container: HTMLDivElement) => {
    try {
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

      const candlestickSeries = chart.addCandlestickSeries({
        upColor: "#22c55e",
        downColor: "#ef4444",
        borderVisible: false,
        wickUpColor: "#22c55e",
        wickDownColor: "#ef4444",
      });

      chartRef.current = chart;
      candlestickSeriesRef.current = candlestickSeries;
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

      return () => {
        window.removeEventListener("resize", handleResize);
        setChartReady(false);
        if (chartRef.current) {
          chartRef.current.remove();
          chartRef.current = null;
          candlestickSeriesRef.current = null;
        }
      };
    } catch (error) {
      console.error("Error creating chart:", error);
    }
  }, []);

  // Chart container callback
  const chartContainerCallback = useCallback(
    (node: HTMLDivElement | null) => {
      if (node && !chartRef.current) {
        initializeChart(node);
      }
    },
    [initializeChart]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
        candlestickSeriesRef.current = null;
        setChartReady(false);
      }
    };
  }, []);

  // Update chart data
  useEffect(() => {
    if (
      !chartReady ||
      !chartRef.current ||
      !candlestickSeriesRef.current ||
      !chartData.length
    ) {
      return;
    }

    try {
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

      if (validData.length === 0) return;

      candlestickSeriesRef.current.setData(validData);

      setTimeout(() => {
        if (chartRef.current) {
          chartRef.current.timeScale().fitContent();
        }
      }, 200);
    } catch (error) {
      console.error("Error updating chart data:", error);
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

  // Loading state
  if (isLoading && chartData.length === 0) {
    return (
      <div className="w-full h-full flex justify-center items-center">
        <div className="flex flex-col items-center gap-3">
          <CircularProgress size={40} sx={{ color: "#00b4ff" }} />
          <div className="text-gray-400 text-sm">Loading chart data...</div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !isSupported) {
    return (
      <div className="w-full h-full flex justify-center items-center">
        <div className="text-center">
          <div className="text-red-400 mb-2">
            {error || "No trading data available on SushiSwap"}
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

  // No data state
  if (chartData.length === 0) {
    return (
      <div className="w-full h-full flex justify-center items-center">
        <div className="text-gray-400">No chart data available</div>
      </div>
    );
  }

  const currentPrice = ohlcData?.metadata?.priceUsd || 0;
  const lastCandle = chartData[chartData.length - 1];
  const firstCandle = chartData[0];
  const priceChange =
    lastCandle && firstCandle
      ? ((lastCandle.close - firstCandle.close) / firstCandle.close) * 100
      : 0;

  return (
    <div className="w-full h-full relative">
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
              {tokenOne?.ticker}/USDC
            </p>
            <div className="flex items-center gap-2">
              <span className="text-[#00F5E0] font-semibold">
                ${currentPrice.toFixed(currentPrice >= 1 ? 2 : 6)}
              </span>
              <span
                className={`text-sm ${
                  priceChange >= 0 ? "text-green-400" : "text-red-400"
                }`}
              >
                {priceChange >= 0 ? "+" : ""}
                {priceChange.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>

        {/* Controls */}
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
            disabled={isLoading}
          >
            {isLoading ? "..." : "Refresh"}
          </Button>
        </div>
      </div>

      {/* Chart Container */}
      <div className="w-full h-full pt-16">
        <div
          ref={chartContainerCallback}
          className="w-full h-full bg-[#0d1117] rounded-lg"
          style={{ minHeight: "400px" }}
        />
      </div>

      {/* SushiSwap Badge */}
      <div className="absolute bottom-3 right-4 text-xs text-gray-400 bg-black/50 px-2 py-1 rounded">
        SushiSwap V3 • {chartData.length} candles
      </div>
    </div>
  );
};

export default SushiSwapCandlestickChart;
