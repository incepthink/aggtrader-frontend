// components/chart/ChartContainer.tsx (MODIFIED)
import React, { useEffect, useRef, useState } from "react";
import { CandlestickData } from "lightweight-charts";
import { useChartLifecycle } from "@/hooks/sushiswap/useChartLifecycle";

interface ChartMarker {
  time: number;
  position: "aboveBar" | "belowBar" | "inBar";
  color: string;
  shape: "arrowUp" | "arrowDown" | "circle" | "square";
  text?: string;
}

interface ChartContainerProps {
  tokenAddress: string | null;
  enabled: boolean;
  chartData: CandlestickData[];
  renderKey: number;
  resolution: "hour" | "day";
  onChartReady: (ready: boolean) => void;
  onError: (error: string) => void;
  chainType?: "katana" | "ethereum";
  currentTimeframe?: string;
  markers?: ChartMarker[]; // NEW: markers prop
}

const ChartContainer: React.FC<ChartContainerProps> = ({
  tokenAddress,
  enabled,
  chartData,
  renderKey,
  resolution,
  onChartReady,
  onError,
  chainType = "katana",
  currentTimeframe = "1h",
  markers = [], // NEW: default empty array
}) => {
  const initializationRef = useRef<number>(0);
  const currentRenderKey = useRef<number>(renderKey);
  const [isChartInitialized, setIsChartInitialized] = useState(false);

  let minMove =
    chartData.length > 0 ? (chartData[0].open < 0.1 ? 0.00001 : 0.01) : 0.01;

  const {
    chartContainerRef,
    initializeChart,
    cleanupChart,
    updateChartData,
    setMarkers,
  } = useChartLifecycle({
    tokenAddress,
    minMove,
    enabled,
    currentTimeframe,
    onChartReady: (ready) => {
      setIsChartInitialized(ready);
      onChartReady(ready);
    },
    onError,
  });

  // Track render key changes to prevent loops
  useEffect(() => {
    currentRenderKey.current = renderKey;
  }, [renderKey]);

  // Initialize chart only when needed
  useEffect(() => {
    if (!tokenAddress || !enabled) {
      cleanupChart();
      setIsChartInitialized(false);
      return;
    }

    const currentInit = ++initializationRef.current;

    const timer = setTimeout(() => {
      if (currentInit === initializationRef.current) {
        console.log(
          `[${chainType.toUpperCase()}] Initializing chart for token:`,
          tokenAddress
        );
        initializeChart();
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      if (currentInit === initializationRef.current) {
        cleanupChart();
        setIsChartInitialized(false);
      }
    };
  }, [tokenAddress, enabled, renderKey, chainType, currentTimeframe]);

  // Update chart data when chart is ready AND data is available
  useEffect(() => {
    console.log(`[${chainType.toUpperCase()}] Data update effect:`, {
      isChartInitialized,
      enabled,
      chartDataLength: chartData.length,
      hasData: chartData.length > 0,
    });

    if (isChartInitialized && enabled && chartData.length > 0) {
      const timer = setTimeout(() => {
        console.log(
          `[${chainType.toUpperCase()}] Updating chart with data after initialization...`
        );
        updateChartData(chartData);
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [isChartInitialized, chartData, enabled, chainType]);

  // NEW: Update markers when they change
  useEffect(() => {
    if (isChartInitialized && markers.length > 0) {
      console.log(
        `[${chainType.toUpperCase()}] Setting ${
          markers.length
        } markers on chart`
      );
      setMarkers(markers);
    }
  }, [isChartInitialized, markers, setMarkers, chainType]);

  // Handle resolution changes with cleanup
  useEffect(() => {
    if (tokenAddress && enabled) {
      const currentInit = ++initializationRef.current;

      const timer = setTimeout(() => {
        if (currentInit === initializationRef.current) {
          console.log(
            `[${chainType.toUpperCase()}] Resolution changed, reinitializing chart...`
          );
          cleanupChart();
          setIsChartInitialized(false);
          setTimeout(() => {
            if (currentInit === initializationRef.current) {
              initializeChart();
            }
          }, 50);
        }
      }, 200);

      return () => clearTimeout(timer);
    }
  }, [resolution, chainType, tokenAddress, enabled]);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden",
        minWidth: 0,
        minHeight: 0,
      }}
    >
      <div
        ref={chartContainerRef}
        style={{
          width: "100%",
          height: "100%",
          backgroundColor: "#0d1117",
          borderRadius: "8px",
          position: "relative",
          minWidth: "200px",
          minHeight: "200px",
          boxSizing: "border-box",
        }}
      />
    </div>
  );
};

export default ChartContainer;
