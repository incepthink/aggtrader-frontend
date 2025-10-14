import React from "react";
import { MetricCard } from "./MetricCard";
import { formatCompact } from "./utils";
import { MetricDisplayMode, TimeframeMetrics, TimeframeOption } from "./types";

interface MetricsDisplayProps {
  selectedTimeframe: TimeframeOption;
  timeframeMetrics: TimeframeMetrics | null;
  priceDisplayMode: MetricDisplayMode;
  volumeDisplayMode: MetricDisplayMode;
  onPriceDisplayToggle: () => void;
  onVolumeDisplayToggle: () => void;
  ohlcData: any;
  layout: "grid" | "row";
}

export const MetricsDisplay: React.FC<MetricsDisplayProps> = ({
  selectedTimeframe,
  timeframeMetrics,
  priceDisplayMode,
  volumeDisplayMode,
  onPriceDisplayToggle,
  onVolumeDisplayToggle,
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
      return `${sign}${formatCompact(Math.abs(value))}`;
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

    if (volumeDisplayMode === "usd") {
      const value = volumeChange.absolute;
      const sign = value >= 0 ? "+" : "";
      return `${sign}${formatCompact(Math.abs(value))}`;
    } else {
      const value = volumeChange.percentage;
      const sign = value >= 0 ? "+" : "";
      return `${sign}${value.toFixed(2)}%`;
    }
  };

  const getPriceChangeColor = (): string => {
    if (!hasValidTimeframeData) return "text-gray-400";
    return timeframeMetrics!.priceChange.percentage >= 0
      ? "text-green-400"
      : "text-red-400";
  };

  const getVolumeChangeColor = (): string => {
    if (!hasValidTimeframeData) return "text-gray-400";
    return timeframeMetrics!.volumeChange.percentage >= 0
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
        isClickable
        onClick={onVolumeDisplayToggle}
        colorClass={getVolumeChangeColor()}
        disabled={!hasValidTimeframeData}
        variant={layout}
      />

      <MetricCard
        label="Total Vol"
        value={
          hasValidTimeframeData
            ? `${formatCompact(ohlcData?.metadata?.volumeUSD || 0)}`
            : "--"
        }
        variant={layout}
      />

      <MetricCard
        label="Pair Reserve"
        value={`$${formatCompact(ohlcData?.metadata?.reserveUSD || 0)}`}
        variant={layout}
      />
    </div>
  );
};
