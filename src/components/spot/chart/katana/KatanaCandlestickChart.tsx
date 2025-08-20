"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useSpotStore } from "@/store/spotStore";
import { useChartData } from "@/hooks/sushiswap/katanaChart/useChartData";
import ChartHeader from "./ChartHeader";
import ChartContainer from "./ChartContainer";
import ChartStatusIndicators from "./ChartStatusIndicators";
import ChartDebug from "./ChartDebug";
import ChartErrorBoundary from "./ChartErrorBoundary";

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

  return (
    <div key={renderKey} className="w-full h-full relative p-4">
      <ChartHeader
        tokenOne={tokenOne}
        currentPrice={currentPrice}
        priceLoading={priceLoading}
        priceHasError={priceHasError}
        priceChange={priceChange}
        ohlcData={ohlcData}
        isLoading={isLoading}
        onRefresh={handleRefresh}
        selectedTimeframe={currentTimeframe}
        onTimeframeChange={changeTimeframe}
        isProcessingTimeframe={isProcessingTimeframe}
        timeframeMetrics={timeframeMetrics}
      />

      <ChartContainer
        tokenAddress={tokenAddress}
        isKatanaChain={isKatanaChain}
        chartData={chartData}
        renderKey={renderKey}
        resolution={resolution}
        onChartReady={handleChartReady}
        onError={handleChartError}
      />

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
  );
};

export default KatanaCandlestickChart;