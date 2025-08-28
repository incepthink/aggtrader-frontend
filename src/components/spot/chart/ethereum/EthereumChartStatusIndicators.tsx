// components/chart/EthereumChartStatusIndicators.tsx (NEW FILE)
import React from 'react';
import { CircularProgress } from '@mui/material';
import { ethereumOHLCUtils } from '@/hooks/sushiswap/ethereumChart/useEthereumSwapOHLC';

interface EthereumChartStatusIndicatorsProps {
  chartReady: boolean;
  chartDataLength: number;
  renderKey: number;
  priceLoading: boolean;
  currentPrice: number | null;
  high: number;
  low: number;
}

const EthereumChartStatusIndicators: React.FC<EthereumChartStatusIndicatorsProps> = ({
  chartReady,
  chartDataLength,
  renderKey,
  priceLoading,
  currentPrice,
  high,
  low,
}) => {
  // Only show status indicators in development mode or when there are issues
  const showDebugInfo = process.env.NODE_ENV === 'development';

  if (!showDebugInfo) {
    return null;
  }

  return (
    <div className="absolute bottom-2 left-2 z-20 bg-black/50 backdrop-blur-sm rounded px-2 py-1 text-xs text-gray-300">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span>Chart:</span>
          <span className={chartReady ? 'text-green-400' : 'text-red-400'}>
            {chartReady ? '✓ Ready' : '⏳ Initializing'}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <span>Data:</span>
          <span className={chartDataLength > 0 ? 'text-green-400' : 'text-yellow-400'}>
            {chartDataLength} points
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <span>Render:</span>
          <span className="text-blue-400">#{renderKey}</span>
        </div>
        
        {currentPrice && (
          <div className="flex items-center gap-2">
            <span>Price:</span>
            {priceLoading ? (
              <CircularProgress size={10} sx={{ color: '#00F5E0' }} />
            ) : (
              <span className="text-[#00F5E0]">
                ${ethereumOHLCUtils.formatPrice(currentPrice)}
              </span>
            )}
          </div>
        )}
        
        {high > 0 && low > 0 && (
          <div className="flex items-center gap-2">
            <span>Range:</span>
            <span className="text-green-400">
              H: ${ethereumOHLCUtils.formatPrice(high)}
            </span>
            <span className="text-red-400">
              L: ${ethereumOHLCUtils.formatPrice(low)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default EthereumChartStatusIndicators;