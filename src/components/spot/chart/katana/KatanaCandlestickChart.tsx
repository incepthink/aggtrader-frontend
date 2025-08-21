// aggtrade candle stick

"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Box } from "@mui/material";
import { useSpotStore } from "@/store/spotStore";
import { useChartData } from "@/hooks/sushiswap/katanaChart/useChartData";
import ChartHeader from "./ChartHeader";
import ChartContainer from "./ChartContainer";
import ChartStatusIndicators from "./ChartStatusIndicators";
import ChartDebug from "./ChartDebug";
import ChartErrorBoundary from "./ChartErrorBoundary";
import GlowBox from "@/components/common/ui/GlowBox";
import TimeframeSelector from "./TimeframeSelector";

const KatanaCandlestickChart = () => {
  // Get tokenOne from the store
  const { tokenOne, chainId } = useSpotStore();

  // State
  const [resolution, setResolution] = useState<"hour" | "day">("hour");
  const [chartReady, setChartReady] = useState(false);
  const [renderKey, setRenderKey] = useState(0);
  const [chartError, setChartError] = useState<string | null>(null);
  
  // Refs to prevent loops
  const lastTokenAddress = useRef<string | null>(null);
  const lastChainId = useRef<number>(chainId);

  // Get token address with native token handling
  const getTokenAddress = (token: any) => {
    if (!token) return null;
    if (token.isNative) {
      return "0xEE7D8BCFb72bC1880D0Cf19822eB0A2e6577aB62"; // WRON on Katana
    }
    return token.address;
  };

  const tokenAddress = getTokenAddress(tokenOne);
  const isKatanaChain = chainId === 747474;

  // Only force re-render when token actually changes
  useEffect(() => {
    if (
      tokenAddress !== lastTokenAddress.current || 
      chainId !== lastChainId.current
    ) {
      lastTokenAddress.current = tokenAddress;
      lastChainId.current = chainId;
      setRenderKey((prev) => prev + 1);
      setChartError(null);
      setChartReady(false);
    }
  }, [tokenAddress, chainId]);

  // Chart data hook
  const {
    ohlcData,
    chartData,
    currentPrice,
    priceChange,
    high,
    low,
    isLoading,
    ohlcLoading,
    priceLoading,
    error,
    priceHasError,
    priceErrorData,
    isSupported,
    refetchAll,
    refetchOHLC,
    refetchPrice,
    currentTimeframe,
    changeTimeframe,
    isProcessingTimeframe,
    timeframeMetrics,
  } = useChartData({
    tokenAddress,
    chainId,
    resolution,
    isKatanaChain,
  });

  // Handle chart ready state
  const handleChartReady = useCallback((ready: boolean) => {
    setChartReady(ready);
  }, []);

  // Handle chart errors
  const handleChartError = useCallback((error: string) => {
    setChartError(error);
  }, []);

  // Handle retry actions
  const handleRetry = useCallback(() => {
    setChartError(null);
    setRenderKey((prev) => prev + 1);
  }, []);

  const handleForceRefresh = useCallback(() => {
    setRenderKey((prev) => prev + 1);
  }, []);

  const handleRefresh = useCallback(() => {
    refetchAll();
    setRenderKey((prev) => prev + 1);
  }, [refetchAll]);

  // Check for error states that should show error boundary
  const hasError = chartError || error || !isSupported || 
    (!isKatanaChain || !tokenOne || 
    ((isLoading || priceLoading) && chartData.length === 0) || 
    chartData.length === 0);

  if (hasError) {
    return (
      <ChartErrorBoundary
        chainId={chainId}
        tokenOne={tokenOne}
        tokenAddress={tokenAddress}
        isKatanaChain={isKatanaChain}
        chartError={chartError}
        error={error}
        isSupported={isSupported}
        isLoading={isLoading}
        priceLoading={priceLoading}
        chartDataLength={chartData.length}
        onRetry={handleRetry}
        onRefetch={refetchOHLC}
        onForceRefresh={handleForceRefresh}
      />
    );
  }

  // Common header props
  const headerProps = {
    tokenOne,
    currentPrice,
    priceLoading,
    priceHasError,
    priceChange,
    ohlcData,
    isLoading,
    onRefresh: handleRefresh,
    selectedTimeframe: currentTimeframe,
    onTimeframeChange: changeTimeframe,
    isProcessingTimeframe,
    timeframeMetrics,
  };

  return (
    <>
      {/* Chart Header - Only show outside on mobile/tablet */}
       <div
      className="block lg:hidden mb-4 mt-8"
      >
        <GlowBox
          sx={{
            p: 2, // Remove default padding since ChartHeader handles its own
            overflow: "hidden",
          }}
        >
          <ChartHeader
            {...headerProps}
            isOverlay={false} // Standalone mode for mobile/tablet
          />
        </GlowBox>
      </div>

      {/* Chart Container with GlowBox */}
      <Box
        sx={{
          maxHeight: {
            xs: "400px",
            sm: "500px",
            md: "600px",
            lg: "600px",
            xl: "700px",
          },
          height: {
            xs: "450px",
            sm: "450px",
            md: "550px",
            lg: "550px",
            xl: "560px",
          },
          overflow: "hidden",
        }}
      >
        <GlowBox
          sx={{
            height: "100%",
            maxHeight: "100%",
            position: "relative",
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,0.2) 1px, transparent 1px)",
            backgroundSize: { xs: "20px 20px", sm: "30px 30px" },
            overflow: "hidden",
            p: { xs: 1, md: 2 }, // No padding on mobile, normal padding on medium screens and up
            
          }}
        >
          <div key={renderKey} className="w-full h-full relative">
            {/* TimeframeSelector - Mobile positioned at top of chart */}
            <div className="block lg:hidden absolute top-2 left-2 right-2 z-20">
              <TimeframeSelector
                selectedTimeframe={currentTimeframe}
                onTimeframeChange={changeTimeframe}
                isProcessingTimeframe={isProcessingTimeframe}
                variant="mobile"
              />
            </div>

            {/* Chart Header - Overlay mode for desktop only */}
            <div className="hidden lg:block">
              <ChartHeader
                {...headerProps}
                isOverlay={true} // Overlay mode for desktop
              />
            </div>

            {/* Chart Container - Remove mobile padding to fit inside GlowBox */}
            <div className="w-full h-full lg:pt-16 pt-8">
              <ChartContainer
               
                tokenAddress={tokenAddress}
                isKatanaChain={isKatanaChain}
                chartData={chartData}
                renderKey={renderKey}
                resolution={resolution}
                onChartReady={handleChartReady}
                onError={handleChartError}
              />
            </div>

            <ChartStatusIndicators
              chartReady={chartReady}
              chartDataLength={chartData.length}
              renderKey={renderKey}
              priceLoading={priceLoading}
              currentPrice={currentPrice}
              high={high}
              low={low}
            />
          </div>
        </GlowBox>
      </Box>
    </>
  );
};

export default KatanaCandlestickChart;