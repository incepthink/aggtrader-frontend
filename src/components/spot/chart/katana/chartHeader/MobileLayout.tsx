import React, { useState, useEffect } from "react";
import { IconButton } from "@mui/material";
import { Refresh } from "@mui/icons-material";
import { TokenInfo } from "./TokenInfo";
import { MetricsDisplay } from "./MetricsDisplay";
import { ChartHeaderProps, MetricDisplayMode } from "./types";

export const MobileLayout: React.FC<ChartHeaderProps> = ({
  tokenOne,
  currentPrice,
  priceLoading,
  priceHasError,
  priceChange,
  ohlcData,
  isLoading,
  onRefresh,
  selectedTimeframe,
  isProcessingTimeframe,
  timeframeMetrics,
  isOverlay,
}) => {
  const [priceDisplayMode, setPriceDisplayMode] =
    useState<MetricDisplayMode>("percentage");
  const [volumeDisplayMode, setVolumeDisplayMode] =
    useState<MetricDisplayMode>("usd");

  // Track if screen is >= 850px
  const [isTabletSize, setIsTabletSize] = useState(false);

  useEffect(() => {
    const checkSize = () => {
      setIsTabletSize(window.innerWidth >= 850);
    };

    checkSize();
    window.addEventListener("resize", checkSize);
    return () => window.removeEventListener("resize", checkSize);
  }, []);

  const refreshDisabled = isLoading || isProcessingTimeframe;

  // Determine layout: row for >= 850px, grid for < 850px
  const metricsLayout = isTabletSize ? "row" : "grid";

  return (
    <div className={`space-y-3 ${!isOverlay ? "p-3" : ""}`}>
      {/* Top Row - Token Info, Metrics (if >= 850px), and Refresh */}
      <div className="flex items-center justify-between gap-3">
        <TokenInfo
          tokenOne={tokenOne}
          ohlcData={ohlcData}
          currentPrice={currentPrice}
          priceLoading={priceLoading}
          priceHasError={priceHasError}
          priceChange={priceChange}
          variant="mobile"
        />

        {/* Metrics Row - Only show when >= 850px */}
        {isTabletSize && (
          <div className="flex-1 flex justify-center">
            <MetricsDisplay
              selectedTimeframe={selectedTimeframe}
              timeframeMetrics={timeframeMetrics}
              priceDisplayMode={priceDisplayMode}
              volumeDisplayMode={volumeDisplayMode}
              onPriceDisplayToggle={() =>
                setPriceDisplayMode((prev) =>
                  prev === "usd" ? "percentage" : "usd"
                )
              }
              onVolumeDisplayToggle={() =>
                setVolumeDisplayMode((prev) =>
                  prev === "usd" ? "percentage" : "usd"
                )
              }
              ohlcData={ohlcData}
              layout="row"
            />
          </div>
        )}

        {/* Refresh Button */}
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
          <Refresh sx={{ fontSize: 18 }} />
        </IconButton>
      </div>

      {/* Metrics Grid - Only show when < 850px */}
      {!isTabletSize && (
        <MetricsDisplay
          selectedTimeframe={selectedTimeframe}
          timeframeMetrics={timeframeMetrics}
          priceDisplayMode={priceDisplayMode}
          volumeDisplayMode={volumeDisplayMode}
          onPriceDisplayToggle={() =>
            setPriceDisplayMode((prev) =>
              prev === "usd" ? "percentage" : "usd"
            )
          }
          onVolumeDisplayToggle={() =>
            setVolumeDisplayMode((prev) =>
              prev === "usd" ? "percentage" : "usd"
            )
          }
          ohlcData={ohlcData}
          layout="grid"
        />
      )}
    </div>
  );
};
