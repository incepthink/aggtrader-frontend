import React from "react";
import { MetricCard } from "./MetricCard";
import { formatCompact } from "./utils";
import { MetricDisplayMode, TimeframeMetrics, TimeframeOption } from "./types";

interface MetricsDisplayProps {
  selectedTimeframe: TimeframeOption;
  timeframeMetrics: TimeframeMetrics | null;
  priceDisplayMode: MetricDisplayMode;
  onPriceDisplayToggle: () => void;
  ohlcData: any;
  layout: "grid" | "row";
}

export const MetricsDisplay: React.FC<MetricsDisplayProps> = ({
  selectedTimeframe,
  timeframeMetrics,
  priceDisplayMode,
  onPriceDisplayToggle,
  ohlcData,
  layout,
}) => {
  const hasValidTimeframeData =
    !!timeframeMetrics && timeframeMetrics.timeframe === selectedTimeframe;

  const renderPriceChange = () => {
    if (!hasValidTimeframeData) {
      return <span className="text-gray-400">--</span>;
    }

    const { priceChange: tfPriceChange } = timeframeMetrics!;

    if (priceDisplayMode === "usd") {
      const value = tfPriceChange.absolute;
      const sign = value >= 0 ? "+" : "";
      return `${sign}$${formatCompact(Math.abs(value))}`;
    } else {
      const value = tfPriceChange.percentage;
      const sign = value >= 0 ? "+" : "";
      return `${sign}${value.toFixed(2)}%`;
    }
  };

  const renderVolumeChange = () => {
    if (!hasValidTimeframeData) {
      return <span className="text-gray-400">--</span>;
    }

    const { volumeChange } = timeframeMetrics!;
    const value = volumeChange.absolute;
    const sign = value >= 0 ? "+" : "";
    return `${sign}$${formatCompact(Math.abs(value))}`;
  };

  const getPriceChangeColor = (): string => {
    if (!hasValidTimeframeData) return "text-gray-400";
    return timeframeMetrics!.priceChange.percentage >= 0
      ? "text-green-400"
      : "text-red-400";
  };

  const getVolumeChangeColor = (): string => {
    if (!hasValidTimeframeData) return "text-gray-400";
    return timeframeMetrics!.volumeChange.absolute >= 0
      ? "text-green-400"
      : "text-red-400";
  };

  const containerClass =
    layout === "grid" ? "grid grid-cols-2 gap-3" : "flex gap-4 md:gap-14";

  return (
    <div className={containerClass}>
      <MetricCard
        label={`Price (${selectedTimeframe})`}
        value={renderPriceChange()}
        isClickable
        onClick={onPriceDisplayToggle}
        colorClass={getPriceChangeColor()}
        disabled={!hasValidTimeframeData}
        variant={layout}
      />

      <MetricCard
        label={`Volume (${selectedTimeframe})`}
        value={renderVolumeChange()}
        isClickable={false}
        colorClass={getVolumeChangeColor()}
        disabled={!hasValidTimeframeData}
        variant={layout}
      />

      <MetricCard
        label="Total Vol"
        value={
          hasValidTimeframeData && timeframeMetrics?.totalVolume
            ? `$${formatCompact(timeframeMetrics.totalVolume)}`
            : "--"
        }
        variant={layout}
      />

      <MetricCard
        label="Pool TVL"
        value={
          ohlcData?.metadata?.pool?.totalValueLockedUSD
            ? `$${formatCompact(ohlcData.metadata.pool.totalValueLockedUSD)}`
            : "--"
        }
        variant={layout}
      />
    </div>
  );
};
