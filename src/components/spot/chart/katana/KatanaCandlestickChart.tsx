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
  const [isDesktopSize, setIsDesktopSize] = useState(false);
  
  // Refs to prevent loops
  const lastTokenAddress = useRef<string | null>(null);
  const lastChainId = useRef<number>(chainId);
  const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Custom breakpoint handling for 1560px
  useEffect(() => {
    const checkSize = () => {
      const newIsDesktop = window.innerWidth >= 1560;
      if (newIsDesktop !== isDesktopSize) {
        setIsDesktopSize(newIsDesktop);
      }
    };

    // Set initial size
    checkSize();

    // Handle window resize with debouncing
    const handleResize = () => {
      // Clear existing timeout
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }

      // Set new timeout
      resizeTimeoutRef.current = setTimeout(() => {
        checkSize();
        // Force chart re-render after resize
        setRenderKey((prev) => prev + 1);
      }, 300); // Debounce resize events
    };

    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
    };
  }, [isDesktopSize]);

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
      {/* Chart Header - Only show outside on screens < 1560px, NO margin-top unless < lg */}
      {!isDesktopSize && (
        <Box
          sx={{
            mb: 2, // Reduced margin bottom
            // Only add margin-top for screens smaller than lg (1200px)
            mt: { xs: 4, sm: 4, md: 4, lg: 0 }, // mt only for xs/sm/md, not lg+
          }}
        >
          <GlowBox
            sx={{
              p: 2,
              overflow: "hidden",
            }}
          >
            <ChartHeader
              {...headerProps}
              isOverlay={false}
            />
          </GlowBox>
        </Box>
      )}

      {/* Chart Container with GlowBox - Made fully responsive */}
      <Box
        sx={{
          width: "100%",
          maxWidth: "100%",
          height: {
            xs: "400px",
            sm: "450px", 
            md: "500px",
            lg: "550px",
            xl: "600px",
          },
          minHeight: {
            xs: "350px",
            sm: "400px",
          },
          overflow: "hidden",
        }}
      >
        <GlowBox
          sx={{
            width: "100%",
            height: "100%",
            maxWidth: "100%",
            position: "relative",
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,0.2) 1px, transparent 1px)",
            backgroundSize: { xs: "20px 20px", sm: "30px 30px" },
            overflow: "hidden",
            p: { xs: 1, md: 2 },
            boxSizing: "border-box",
          }}
        >
          <Box
            key={renderKey} 
            sx={{
              width: "100%",
              height: "100%",
              position: "relative",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* TimeframeSelector - Mobile positioned at top of chart for screens < 1560px */}
            {!isDesktopSize && (
              <Box
                sx={{
                  position: "absolute",
                  top: 8,
                  left: 8,
                  right: 8,
                  zIndex: 20,
                }}
              >
                <TimeframeSelector
                  selectedTimeframe={currentTimeframe}
                  onTimeframeChange={changeTimeframe}
                  isProcessingTimeframe={isProcessingTimeframe}
                  variant="mobile"
                />
              </Box>
            )}

            {/* Chart Header - Overlay mode for desktop (screens >= 1560px) only */}
            {isDesktopSize && (
              <Box>
                <ChartHeader
                  {...headerProps}
                  isOverlay={true}
                />
              </Box>
            )}

            {/* Chart Container - Takes remaining space */}
            <Box
              sx={{
                width: "100%",
                flex: 1,
                minHeight: 0,
                pt: isDesktopSize ? "64px" : "32px",
                overflow: "hidden",
              }}
            >
              <ChartContainer
                tokenAddress={tokenAddress}
                isKatanaChain={isKatanaChain}
                chartData={chartData}
                renderKey={renderKey}
                resolution={resolution}
                onChartReady={handleChartReady}
                onError={handleChartError}
              />
            </Box>

            <ChartStatusIndicators
              chartReady={chartReady}
              chartDataLength={chartData.length}
              renderKey={renderKey}
              priceLoading={priceLoading}
              currentPrice={currentPrice}
              high={high}
              low={low}
            />
          </Box>
        </GlowBox>
      </Box>
    </>
  );
};

export default KatanaCandlestickChart;