// hooks/sushiswap/useChartLifecycle.ts (MODIFIED)
import { useRef, useCallback, MutableRefObject } from 'react';
import { createChart, IChartApi, CandlestickData, UTCTimestamp } from 'lightweight-charts';

interface UseChartLifecycleProps {
  tokenAddress: string | null;
  minMove: number;
  enabled: boolean; // CHANGED: from isKatanaChain to generic enabled
  onChartReady: (ready: boolean) => void;
  onError: (error: string) => void;
}

export const useChartLifecycle = ({
  tokenAddress,
  minMove,
  enabled, // CHANGED: generic enabled prop
  onChartReady,
  onError,
}: UseChartLifecycleProps) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<any>(null);
  const containerObserverRef = useRef<ResizeObserver | null>(null);
  const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
    onChartReady(false);
  }, [onChartReady]);

  // Debounced resize handler
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
            console.log('Chart resized to:', { width: newWidth, height: newHeight });
          } catch (err) {
            console.error('Error resizing chart:', err);
          }
        }
      }
    }, 100); // Debounce resize by 100ms
  }, []);

  // Initialize chart function
  const initializeChart = useCallback(() => {
    console.log('initializeChart called:', { tokenAddress, enabled }); // CHANGED: logging
    
    if (!chartContainerRef.current || !tokenAddress || !enabled) { // CHANGED: use enabled
      console.log('Initialization conditions not met');
      return;
    }

    try {
      cleanupChart();

      const container = chartContainerRef.current;

      // Wait for container to be properly sized
      const checkAndCreateChart = () => {
        const rect = container.getBoundingClientRect();
        console.log('Container dimensions:', rect);

        // Make sure container has meaningful dimensions
        if (rect.width < 100 || rect.height < 100) {
          console.log('Container too small, retrying...', rect);
          setTimeout(checkAndCreateChart, 100);
          return;
        }

        try {
          console.log('Creating chart with dimensions:', { width: rect.width, height: rect.height });
          
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
            containerObserverRef.current = new ResizeObserver(handleResize);
            containerObserverRef.current.observe(container);
          }

          // Fallback for browsers without ResizeObserver
          window.addEventListener('resize', handleResize);

          console.log('Chart created successfully');
          onChartReady(true);

        } catch (err) {
          console.error('Error creating chart:', err);
          onError(`Chart creation error: ${err}`);
        }
      };

      // Initial check with a slight delay to ensure DOM is ready
      setTimeout(checkAndCreateChart, 50);

    } catch (err) {
      console.error('Error initializing chart:', err);
      onError(`Chart initialization error: ${err}`);
    }
  }, [tokenAddress, enabled, onChartReady, onError, handleResize]); // CHANGED: dependencies

  // Update chart data
  const updateChartData = useCallback((newData: CandlestickData[]) => {
    console.log('updateChartData called with:', newData.length, 'points');
    
    if (!chartRef.current || !candlestickSeriesRef.current) {
      console.log('Chart or series not ready');
      return;
    }

    try {
      if (newData.length === 0) {
        console.log('No data, clearing chart');
        candlestickSeriesRef.current.setData([]);
        return;
      }

      // Sort data by time to ensure proper order
      const sortedData = [...newData].sort((a, b) => (a.time as number) - (b.time as number));
      
      console.log('Setting chart data:', sortedData.length, 'candles');
      candlestickSeriesRef.current.setData(sortedData);

      // Set initial visible range to show recent data
      if (sortedData.length > 0) {
        setTimeout(() => {
          if (chartRef.current) {
            try {
              const lastTime = sortedData[sortedData.length - 1].time as number;
              const firstTime = sortedData[0].time as number;
              
              // Show last 3 days or all data if less than 3 days
              const threeDaysInSeconds = 3 * 24 * 60 * 60;
              const startTime = Math.max(lastTime - threeDaysInSeconds, firstTime) as UTCTimestamp;
              
              console.log('Setting visible range:', { 
                from: new Date(startTime * 1000).toISOString(), 
                to: new Date((lastTime as number) * 1000).toISOString() 
              });
              
              chartRef.current.timeScale().setVisibleRange({
                from: startTime,
                to: lastTime as UTCTimestamp,
              });
            } catch (err) {
              console.warn('Failed to set initial time range, using fit content:', err);
              chartRef.current.timeScale().fitContent();
            }
          }
        }, 150);
      }
    } catch (err) {
      console.error('Error updating chart data:', err);
      onError(`Chart update error: ${err}`);
    }
  }, [onError]);

  return {
    chartContainerRef,
    chartRef,
    candlestickSeriesRef,
    initializeChart,
    cleanupChart,
    updateChartData,
  };
};