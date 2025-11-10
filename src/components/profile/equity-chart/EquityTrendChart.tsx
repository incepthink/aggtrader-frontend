// src/components/profile/equity-chart/EquityTrendChart.tsx
import { useMemo } from "react";
import { useAccount } from "wagmi";
import { useEquityTrend } from "@/hooks/useEquityTrend";
import ChartHeader from "./ChartHeader";
import EquityChart from "./EquityChart";
import EmptyState from "./EmptyState";
import { getPortfolioStats } from "./chartUtils";

export default function EquityTrendChart() {
  const { address, isConnected } = useAccount();

  const { data, isLoading, error, isSuccess, refetch } =
    useEquityTrend(address);

  console.log("EQUITYCHART::", data);

  const hasRealData =
    isSuccess && data?.data?.history && data.data.history.length > 0;
  const chartData = hasRealData ? data.data.history : [];

  // Convert to lightweight-charts format with proper timestamp conversion and deduplication
  const lightweightChartData = useMemo(() => {
    if (!hasRealData) return [];

    // Create a map to handle duplicate timestamps
    const dataMap = new Map<number, number>();

    chartData.forEach((point: any) => {
      const timestamp = Math.floor(new Date(point.timestamp).getTime() / 1000);
      const balance = Number(point.balance);

      // Only add valid data points
      if (!isNaN(timestamp) && !isNaN(balance)) {
        // If duplicate timestamp exists, use the later value (or average them)
        if (dataMap.has(timestamp)) {
          // Option 1: Use latest value
          dataMap.set(timestamp, balance);

          // Option 2: Average the values (uncomment if preferred)
          // const existingBalance = dataMap.get(timestamp)!;
          // dataMap.set(timestamp, (existingBalance + balance) / 2);
        } else {
          dataMap.set(timestamp, balance);
        }
      }
    });

    // Convert map to array and sort
    const converted = Array.from(dataMap.entries())
      .map(([time, value]) => ({
        time: time as any,
        value: value,
      }))
      .sort((a, b) => a.time - b.time);

    console.log("Converted chart data:", {
      original: chartData.length,
      converted: converted.length,
      sample: converted.slice(0, 3),
    });

    return converted;
  }, [chartData, hasRealData]);

  const stats = useMemo(() => {
    if (!hasRealData) return null;
    return getPortfolioStats(chartData);
  }, [chartData, hasRealData]);

  return (
    <div className="neon-panel h-full relative">
      <ChartHeader
        isLoading={isLoading}
        hasRealData={hasRealData}
        dataPointsCount={chartData.length}
        stats={stats}
        onRefetch={refetch}
      />

      {error && (
        <div className="text-yellow-400 text-sm mb-4 p-3 bg-yellow-400/10 border border-yellow-400/20 rounded">
          {error.message || "Failed to load equity data"}
        </div>
      )}

      <div className="relative" style={{ height: "320px" }}>
        {hasRealData && lightweightChartData.length > 0 ? (
          <EquityChart chartData={lightweightChartData} />
        ) : (
          <EmptyState isLoading={isLoading} isConnected={isConnected} />
        )}
      </div>

      {isLoading && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/5 to-transparent animate-pulse rounded-lg pointer-events-none"></div>
      )}
    </div>
  );
}
