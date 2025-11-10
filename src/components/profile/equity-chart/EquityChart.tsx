// src/components/profile/equity-chart/EquityChart.tsx
import React, { useEffect, useRef } from "react";
import {
  createChart,
  IChartApi,
  ISeriesApi,
  LineData,
} from "lightweight-charts";

interface EquityChartProps {
  chartData: LineData[];
}

export default function EquityChart({ chartData }: EquityChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Area"> | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const container = chartContainerRef.current;
    const rect = container.getBoundingClientRect();

    console.log("Initializing equity chart with dimensions:", rect);

    const chart = createChart(container, {
      layout: {
        background: { color: "transparent" },
        textColor: "#fff",
        fontFamily: "system-ui, -apple-system, sans-serif",
      },
      grid: {
        vertLines: {
          color: "#ffffff10",
          style: 1,
          visible: true,
        },
        horzLines: {
          color: "#ffffff10",
          style: 1,
          visible: true,
        },
      },
      width: Math.floor(rect.width),
      height: Math.floor(rect.height),
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderColor: "#ffffff20",
        fixLeftEdge: true,
        fixRightEdge: true,
        lockVisibleTimeRangeOnResize: true,
      },
      rightPriceScale: {
        borderColor: "#ffffff20",
        textColor: "#fff",
        autoScale: true,
        scaleMargins: {
          top: 0.15,
          bottom: 0.15,
        },
      },
      crosshair: {
        vertLine: {
          color: "#22c55e", // Green-500
          width: 1,
          style: 0,
          labelBackgroundColor: "#22c55e",
        },
        horzLine: {
          color: "#22c55e",
          width: 1,
          style: 0,
          labelBackgroundColor: "#22c55e",
        },
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: true,
      },
      handleScale: {
        axisPressedMouseMove: {
          time: true,
          price: true,
        },
        mouseWheel: true,
        pinch: true,
      },
    });

    const series = chart.addAreaSeries({
      lineColor: "#00FFE9",
      topColor: "rgba(0, 255, 233, 0.4)",
      bottomColor: "rgba(0, 212, 255, 0.05)",
      lineWidth: 2,
      priceFormat: {
        type: "price",
        precision: 2,
        minMove: 0.01,
      },
    });

    chartRef.current = chart;
    seriesRef.current = series;

    if (window.ResizeObserver) {
      resizeObserverRef.current = new ResizeObserver((entries) => {
        if (!entries.length || !chartRef.current) return;

        const { width, height } = entries[0].contentRect;
        chartRef.current.applyOptions({
          width: Math.floor(width),
          height: Math.floor(height),
        });
      });

      resizeObserverRef.current.observe(container);
    }

    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
      if (chartRef.current) {
        chartRef.current.remove();
      }
    };
  }, []);

  // Update chart data
  useEffect(() => {
    if (!seriesRef.current || chartData.length === 0) {
      console.log("Cannot update chart:", {
        hasSeries: !!seriesRef.current,
        dataLength: chartData.length,
      });
      return;
    }

    try {
      // Data should already be sorted and deduplicated from parent
      // But verify it just in case
      const sortedData = [...chartData].sort(
        (a, b) => (a.time as number) - (b.time as number)
      );

      // Double-check for duplicates
      const uniqueData: LineData[] = [];
      let lastTime = -1;

      for (const point of sortedData) {
        if (point.time !== lastTime) {
          uniqueData.push(point);
          lastTime = point.time as number;
        }
      }

      console.log("Setting equity chart data:", {
        originalCount: chartData.length,
        sortedCount: sortedData.length,
        uniqueCount: uniqueData.length,
        firstPoint: uniqueData[0],
        lastPoint: uniqueData[uniqueData.length - 1],
      });

      seriesRef.current.setData(uniqueData);

      if (chartRef.current && uniqueData.length > 0) {
        setTimeout(() => {
          if (chartRef.current) {
            chartRef.current.timeScale().fitContent();
            console.log("Chart content fitted");
          }
        }, 150);
      }
    } catch (err) {
      console.error("Error updating equity chart:", err);
    }
  }, [chartData]);

  return (
    <div
      ref={chartContainerRef}
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        backgroundColor: "transparent",
      }}
    />
  );
}
