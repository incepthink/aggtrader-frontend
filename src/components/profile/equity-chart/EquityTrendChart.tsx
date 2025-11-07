// src/components/profile/EquityTrendChart.tsx
import { useMemo } from "react";
import { useAccount } from "wagmi";
import { useEquityTrend } from "@/hooks/useEquityTrend";
import ChartHeader from "./ChartHeader";
import EquityChart from "./EquityChart";
import EmptyState from "./EmptyState";
import XAxisLabels from "./XAxisLabels";
import { useScreenSize } from "./useScreenSize";
import {
  getPortfolioStats,
  calculateYAxisTicks,
  getUniqueDates,
} from "./chartUtils";

export default function EquityTrendChart() {
  const { address, isConnected } = useAccount();
  const { isMobile, screenWidth } = useScreenSize();

  // Fetch equity trend data
  const { data, isLoading, error, isSuccess, refetch } =
    useEquityTrend(address);

  console.log("EQUITYCHART::", data);

  const hasRealData =
    isSuccess && data?.data?.history && data.data.history.length > 0;
  const chartData = hasRealData ? data.data.history : [];

  // Get unique dates for X-axis labels
  const uniqueDates = useMemo(() => {
    if (!hasRealData) return [];
    return getUniqueDates(chartData);
  }, [chartData, hasRealData]);

  // Calculate percentage change and stats
  const stats = useMemo(() => {
    if (!hasRealData) return null;
    return getPortfolioStats(chartData);
  }, [chartData, hasRealData]);

  // Calculate dynamic Y-axis ticks
  const yAxisTicks = useMemo(() => {
    if (!hasRealData) return [0, 5, 10, 15, 20];
    return calculateYAxisTicks(chartData);
  }, [chartData, hasRealData]);

  return (
    <div className="neon-panel h-[400px] relative">
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

      {/* Chart Container */}
      <div className="relative">
        {hasRealData ? (
          <>
            <EquityChart
              chartData={chartData}
              screenWidth={screenWidth}
              isMobile={isMobile}
              yAxisTicks={yAxisTicks}
            />

            {/* Absolute positioned X-axis labels */}
            <XAxisLabels
              uniqueDates={uniqueDates}
              screenWidth={screenWidth}
              isMobile={isMobile}
            />
          </>
        ) : (
          <EmptyState isLoading={isLoading} isConnected={isConnected} />
        )}
      </div>

      {/* Loading shimmer effect */}
      {isLoading && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/5 to-transparent animate-pulse rounded-lg pointer-events-none"></div>
      )}

      <style jsx global>{`
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
