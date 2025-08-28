// components/chart/ChartContainer.tsx (MODIFIED)
import React, { useEffect, useRef, useState } from 'react';
import { CandlestickData } from 'lightweight-charts';
import { useChartLifecycle } from '@/hooks/sushiswap/useChartLifecycle';

interface ChartContainerProps {
  tokenAddress: string | null;
  enabled: boolean; // CHANGED: from isKatanaChain to generic enabled
  chartData: CandlestickData[];
  renderKey: number;
  resolution: 'hour' | 'day';
  onChartReady: (ready: boolean) => void;
  onError: (error: string) => void;
  chainType?: 'katana' | 'ethereum'; // NEW: for logging purposes
}

const ChartContainer: React.FC<ChartContainerProps> = ({
  tokenAddress,
  enabled, // CHANGED: generic enabled prop
  chartData,
  renderKey,
  resolution,
  onChartReady,
  onError,
  chainType = 'unknown', // NEW: default value
}) => {
  const initializationRef = useRef<number>(0);
  const currentRenderKey = useRef<number>(renderKey);
  const [isChartInitialized, setIsChartInitialized] = useState(false);

  let minMove = chartData.length > 0 ? (chartData[0].open < 0.1 ? 0.00001 : 0.01) : 0.01; // FIXED: handle empty data

  const {
    chartContainerRef,
    initializeChart,
    cleanupChart,
    updateChartData,
  } = useChartLifecycle({
    tokenAddress,
    minMove,
    enabled, // CHANGED: use enabled prop
    onChartReady: (ready) => {
      setIsChartInitialized(ready);
      onChartReady(ready);
    },
    onError,
  });

  // Track render key changes to prevent loops
  useEffect(() => {
    currentRenderKey.current = renderKey;
  }, [renderKey]);

  // Initialize chart only when needed
  useEffect(() => {
    if (!tokenAddress || !enabled) { // CHANGED: use enabled prop
      cleanupChart();
      setIsChartInitialized(false);
      return;
    }

    const currentInit = ++initializationRef.current;
    
    const timer = setTimeout(() => {
      // Only initialize if this is still the latest initialization
      if (currentInit === initializationRef.current) {
        console.log(`[${chainType.toUpperCase()}] Initializing chart for token:`, tokenAddress); // CHANGED: chain-aware logging
        initializeChart();
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      if (currentInit === initializationRef.current) {
        cleanupChart();
        setIsChartInitialized(false);
      }
    };
  }, [tokenAddress, enabled, renderKey, chainType]); // CHANGED: dependencies

  // Update chart data when chart is ready AND data is available
  useEffect(() => {
    console.log(`[${chainType.toUpperCase()}] Data update effect:`, { // CHANGED: chain-aware logging
      isChartInitialized, 
      enabled, 
      chartDataLength: chartData.length,
      hasData: chartData.length > 0 
    });
    
    if (isChartInitialized && enabled && chartData.length > 0) { // CHANGED: use enabled prop
      // Add a small delay to ensure chart is fully ready
      const timer = setTimeout(() => {
        console.log(`[${chainType.toUpperCase()}] Updating chart with data after initialization...`); // CHANGED: chain-aware logging
        updateChartData(chartData);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [isChartInitialized, chartData, enabled, chainType]); // CHANGED: dependencies

  // Handle resolution changes with cleanup
  useEffect(() => {
    if (tokenAddress && enabled) { // CHANGED: use enabled prop
      const currentInit = ++initializationRef.current;
      
      const timer = setTimeout(() => {
        if (currentInit === initializationRef.current) {
          console.log(`[${chainType.toUpperCase()}] Resolution changed, reinitializing chart...`); // CHANGED: chain-aware logging
          cleanupChart();
          setIsChartInitialized(false);
          setTimeout(() => {
            if (currentInit === initializationRef.current) {
              initializeChart();
            }
          }, 50);
        }
      }, 200);
      
      return () => clearTimeout(timer);
    }
  }, [resolution, chainType]); // CHANGED: dependencies

  return (
    <div 
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        // Ensure the container can be properly measured
        minWidth: 0,
        minHeight: 0,
      }}
    >
      <div
        ref={chartContainerRef}
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: '#0d1117',
          borderRadius: '8px',
          position: 'relative',
          // Remove any fixed dimensions that could interfere with responsiveness
          minWidth: '200px', // Minimum usable chart width
          minHeight: '200px', // Minimum usable chart height
          // Ensure the chart container takes full available space
          boxSizing: 'border-box',
        }}
      />
    </div>
  );
};

export default ChartContainer;