// hooks/sushiswap/useChartLifecycle.ts (MODIFIED)
import { useRef, useCallback, MutableRefObject, useEffect } from 'react';
import { createChart, IChartApi, CandlestickData, UTCTimestamp } from 'lightweight-charts';
import { getVisibleBarsForTimeframe, TimeframeOption } from '@/utils/chartVisibleRange';

interface UseChartLifecycleProps {
  tokenAddress: string | null;
  minMove: number;
  enabled: boolean; // CHANGED: from isKatanaChain to generic enabled
  currentTimeframe?: string; // NEW: for visible range calculation
  onChartReady: (ready: boolean) => void;
  onError: (error: string) => void;
}

export const useChartLifecycle = ({
  tokenAddress,
  minMove,
  enabled, // CHANGED: generic enabled prop
  currentTimeframe = '1h', // NEW: default timeframe
  onChartReady,
  onError,
}: UseChartLifecycleProps) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<any>(null);
  const containerObserverRef = useRef<ResizeObserver | null>(null);
  const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const handleResizeRef = useRef<(() => void) | null>(null);
  const onChartReadyRef = useRef(onChartReady);
  const onErrorRef = useRef(onError);

  // Update refs when callbacks change
  useEffect(() => {
    onChartReadyRef.current = onChartReady;
    onErrorRef.current = onError;
  }, [onChartReady, onError]);

  // Debounced resize handler - MOVED BEFORE cleanupChart to fix initialization order
  const handleResize = useCallback(() => {
    if (resizeTimeoutRef.current) {
      clearTimeout(resizeTimeoutRef.current);
    }

    resizeTimeoutRef.current = setTimeout(() => {
      if (chartRef.current && chartContainerRef.current) {
        const rect = chartContainerRef.current.getBoundingClientRect();
        const newWidth = Math.floor(rect.width);
        const newHeight = Math.floor(rect.height);

        // Only resize if dimensions are valid and have changed meaningfully
        if (newWidth > 0 && newHeight > 0) {
          try {
            chartRef.current.applyOptions({
              width: newWidth,
              height: newHeight,
            });
          } catch (err) {
            console.error('[Chart] Error resizing chart:', err);
          }
        }
      }
    }, 100); // Debounce resize by 100ms
  }, []);

  // Update ref whenever handleResize changes
  useEffect(() => {
    handleResizeRef.current = handleResize;
  }, [handleResize]);

  // Clean up chart function
  const cleanupChart = useCallback(() => {
    // Clear resize timeout
    if (resizeTimeoutRef.current) {
      clearTimeout(resizeTimeoutRef.current);
      resizeTimeoutRef.current = null;
    }

    // Disconnect resize observer
    if (containerObserverRef.current) {
      containerObserverRef.current.disconnect();
      containerObserverRef.current = null;
    }

    // Remove window resize event listener (CRITICAL MEMORY LEAK FIX)
    // Use ref to avoid dependency issues
    if (handleResizeRef.current) {
      window.removeEventListener('resize', handleResizeRef.current);
    }

    // Remove chart
    if (chartRef.current) {
      try {
        chartRef.current.remove();
      } catch (err) {
        console.error('Error removing chart:', err);
      }
      chartRef.current = null;
      candlestickSeriesRef.current = null;
    }
    onChartReadyRef.current(false);
  }, []);

  // Initialize chart function
  const initializeChart = useCallback(() => {
    if (!chartContainerRef.current || !tokenAddress || !enabled) {
      return;
    }

    try {
      // Cleanup any existing chart before creating new one
      if (chartRef.current) {
        try {
          chartRef.current.remove();
        } catch (err) {
          console.error('Error removing chart:', err);
        }
        chartRef.current = null;
        candlestickSeriesRef.current = null;
      }

      const container = chartContainerRef.current;

      // Wait for container to be properly sized
      const checkAndCreateChart = () => {
        const rect = container.getBoundingClientRect();

        // Make sure container has meaningful dimensions
        if (rect.width < 100 || rect.height < 100) {
          setTimeout(checkAndCreateChart, 100);
          return;
        }

        try {
          
          // Create chart with responsive dimensions
          const chart = createChart(container, {
            layout: {
              background: { color: '#0d1117' },
              textColor: '#DDD',
              fontFamily: 'system-ui, -apple-system, sans-serif',
            },
            grid: {
              vertLines: { 
                color: '#1e222d',
                style: 1,
                visible: true,
              },
              horzLines: { 
                color: '#1e222d',
                style: 1,
                visible: true,
              },
            },
            width: Math.floor(rect.width),
            height: Math.floor(rect.height),
            timeScale: {
              timeVisible: true,
              secondsVisible: false,
              borderColor: '#1e222d',
              fixLeftEdge: false,
              fixRightEdge: false,
              lockVisibleTimeRangeOnResize: true,
            },
            rightPriceScale: {
              borderColor: '#2B2B43',
              textColor: '#d1d4dc',
              autoScale: true,
              scaleMargins: {
                top: 0.1,
                bottom: 0.1,
              },
            },
            crosshair: {
              vertLine: {
                color: '#758696',
                width: 1,
                style: 1,
              },
              horzLine: {
                color: '#758696',
                width: 1,
                style: 1,
              },
            },
            handleScroll: {
              mouseWheel: true,
              pressedMouseMove: true,
              horzTouchDrag: true,
              vertTouchDrag: true,
            },
            handleScale: {
              axisPressedMouseMove: {
                time: true,
                price: true,
              },
              axisDoubleClickReset: {
                time: true,
                price: true,
              },
              mouseWheel: true,
              pinch: true,
            },
          });

          // Add candlestick series
          const candlestickSeries = chart.addCandlestickSeries({
            upColor: '#22c55e',
            downColor: '#ef4444',
            borderVisible: false,
            wickUpColor: '#22c55e',
            wickDownColor: '#ef4444',
            priceFormat: {
              type: 'price',
              precision: minMove === 0.01 ? 2 : 6,
              minMove: minMove,
            },
          });

          chartRef.current = chart;
          candlestickSeriesRef.current = candlestickSeries;

          // Set up resize observer with debouncing
          if (window.ResizeObserver) {
            containerObserverRef.current = new ResizeObserver(handleResizeRef.current!);
            containerObserverRef.current.observe(container);
          }

          // Fallback for browsers without ResizeObserver
          if (handleResizeRef.current) {
            window.addEventListener('resize', handleResizeRef.current);
          }

          onChartReadyRef.current(true);

        } catch (err) {
          console.error('[Chart] Error creating chart:', err);
          onErrorRef.current(`${err}`);
        }
      };

      // Initial check with a slight delay to ensure DOM is ready
      setTimeout(checkAndCreateChart, 50);

    } catch (err) {
      console.error('[Chart] Error initializing chart:', err);
      onErrorRef.current(`${err}`);
    }
  }, [tokenAddress, enabled, minMove]);

  // Update chart data - MODIFIED TO USE DYNAMIC VISIBLE RANGE
  const updateChartData = useCallback((newData: CandlestickData[]) => {
    if (!chartRef.current || !candlestickSeriesRef.current) {
      return;
    }

    try {
      if (newData.length === 0) {
        candlestickSeriesRef.current.setData([]);
        return;
      }

      // Sort data by time to ensure proper order
      const sortedData = [...newData].sort((a, b) => (a.time as number) - (b.time as number));

      candlestickSeriesRef.current.setData(sortedData);

      // Set initial visible range based on timeframe
      if (sortedData.length > 0) {
        setTimeout(() => {
          if (chartRef.current) {
            try {
              // Get the number of bars to show based on timeframe
              const visibleBars = getVisibleBarsForTimeframe(currentTimeframe as TimeframeOption);
              
              const lastTime = sortedData[sortedData.length - 1].time as number;
              const firstTime = sortedData[0].time as number;
              
              // Calculate how many bars to go back
              const barsToGoBack = Math.min(visibleBars, sortedData.length);
              const fromIndex = Math.max(0, sortedData.length - barsToGoBack);
              const startTime = sortedData[fromIndex].time as number;

              chartRef.current.timeScale().setVisibleRange({
                from: startTime as UTCTimestamp,
                to: lastTime as UTCTimestamp,
              });
            } catch (err) {
              chartRef.current.timeScale().fitContent();
            }
          }
        }, 150);
      }
    } catch (err) {
      console.error('Error updating chart data:', err);
      onErrorRef.current(`Chart update error: ${err}`);
    }
  }, [currentTimeframe]);

  // Set markers on the candlestick series
const setMarkers = useCallback((markers: Array<{
  time: number;
  position: 'aboveBar' | 'belowBar' | 'inBar';
  color: string;
  shape: 'arrowUp' | 'arrowDown' | 'circle' | 'square';
  text?: string;
}>) => {
  if (!candlestickSeriesRef.current) {
    return;
  }

  try {
    candlestickSeriesRef.current.setMarkers(markers);
  } catch (err) {
    console.error('[Chart] Error setting markers:', err);
  }
}, []);

  return {
    chartContainerRef,
    chartRef,
    candlestickSeriesRef,
    initializeChart,
    cleanupChart,
    updateChartData,
    setMarkers
  };
};