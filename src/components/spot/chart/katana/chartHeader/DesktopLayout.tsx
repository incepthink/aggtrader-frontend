import React, { useState } from "react";
import { IconButton } from "@mui/material";
import { Refresh } from "@mui/icons-material";
import TimeframeSelector from "../../TimeframeSelector";
import { TokenInfo } from "./TokenInfo";
import { MetricCard } from "./MetricCard";
import { formatCompact } from "./utils";
import { ChartHeaderProps, MetricDisplayMode } from "./types";

export const DesktopLayout: React.FC<ChartHeaderProps> = ({
  tokenOne,
  currentPrice,
  priceLoading,
  priceHasError,
  priceChange,
  ohlcData,
  isLoading,
  onRefresh,
  selectedTimeframe,
  onTimeframeChange,
  isProcessingTimeframe,
  timeframeMetrics,
}) => {
  const [priceDisplayMode, setPriceDisplayMode] =
    useState<MetricDisplayMode>("percentage");

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

  const refreshDisabled = isLoading || isProcessingTimeframe;

  return (
    <div className="flex justify-between items-start">
      {/* Left Side - Token Info */}
      <div className="-mt-1.5">
        <TokenInfo
          tokenOne={tokenOne}
          ohlcData={ohlcData}
          currentPrice={currentPrice}
          priceLoading={priceLoading}
          priceHasError={priceHasError}
          priceChange={priceChange}
          variant="desktop"
        />
      </div>

      {/* Right Side - Controls and Metrics */}
      <div className="flex gap-8">
        {/* Timeframe Buttons Row */}
        <div className="flex items-end gap-2">
          <TimeframeSelector
            selectedTimeframe={selectedTimeframe}
            onTimeframeChange={onTimeframeChange}
            isProcessingTimeframe={isProcessingTimeframe}
            variant="desktop"
          />
        </div>

        {/* Metrics Row */}
        <div className="flex items-center gap-6">
          {/* Price Change */}
          <div className="flex flex-col items-center">
            <p className="text-xs text-gray-400 mb-1">
              Price ({selectedTimeframe})
            </p>
            <button
              onClick={() =>
                setPriceDisplayMode((prev) =>
                  prev === "usd" ? "percentage" : "usd"
                )
              }
              className={`text-sm font-medium hover:opacity-80 transition-opacity cursor-pointer ${getPriceChangeColor()}`}
              disabled={!hasValidTimeframeData}
            >
              {renderPriceChange()}
            </button>
          </div>

          {/* Volume Change - USD ONLY */}
          <div className="flex flex-col items-center">
            <p className="text-xs text-gray-400 mb-1">
              Volume ({selectedTimeframe})
            </p>
            <p className={`text-sm font-medium ${getVolumeChangeColor()}`}>
              {renderVolumeChange()}
            </p>
          </div>

          {/* Total Volume */}
          <div className="flex flex-col items-center">
            <p className="text-xs text-gray-400 mb-1">Total Vol</p>
            <p className="text-sm text-white font-medium">
              {hasValidTimeframeData && timeframeMetrics?.totalVolume
                ? `$${formatCompact(timeframeMetrics.totalVolume)}`
                : "--"}
            </p>
          </div>

          {/* Pool TVL */}
          <div className="flex flex-col items-center">
            <p className="text-xs text-gray-400 mb-1">Pool TVL</p>
            <p className="text-sm text-white font-medium">
              {ohlcData?.metadata?.pool?.totalValueLockedUSD
                ? `$${formatCompact(
                    ohlcData.metadata.pool.totalValueLockedUSD
                  )}`
                : "--"}
            </p>
          </div>

          {/* Refresh Icon */}
          <IconButton
            onClick={onRefresh}
            size="small"
            disableRipple
            disabled={refreshDisabled}
            aria-label="Refresh"
            sx={{
              color: "#00F5E0",
              p: 0.5,
              "&.Mui-disabled": {
                color: "#00F5E0",
                opacity: 0.45,
              },
            }}
          >
            <Refresh sx={{ fontSize: 20 }} />
          </IconButton>
        </div>
      </div>
    </div>
  );
};
