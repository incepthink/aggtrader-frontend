// components/chart/EthereumChartDebug.tsx (NEW FILE)
import React from 'react';

interface EthereumChartDebugProps {
  ohlcData: any;
  chartData: any[];
  currentPrice: number | null;
  isLoading: boolean;
  error: string | null;
  timeframeMetrics: any;
  currentTimeframe: string;
}

const EthereumChartDebug: React.FC<EthereumChartDebugProps> = ({
  ohlcData,
  chartData,
  currentPrice,
  isLoading,
  error,
  timeframeMetrics,
  currentTimeframe,
}) => {
  // Only show in development mode
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black/90 text-white p-4 rounded-lg text-xs max-w-sm z-50">
      <h4 className="font-bold mb-2 text-blue-400">Ethereum Chart Debug</h4>
      
      <div className="space-y-1">
        <div>
          <span className="text-gray-400">Chain:</span> Ethereum
        </div>
        
        <div>
          <span className="text-gray-400">Current Price:</span> 
          <span className={currentPrice ? 'text-green-400' : 'text-red-400'}>
            {currentPrice ? `$${currentPrice.toFixed(6)}` : 'N/A'}
          </span>
        </div>
        
        <div>
          <span className="text-gray-400">Chart Data:</span> 
          <span className={chartData.length > 0 ? 'text-green-400' : 'text-red-400'}>
            {chartData.length} points
          </span>
        </div>
        
        <div>
          <span className="text-gray-400">Loading:</span> 
          <span className={isLoading ? 'text-yellow-400' : 'text-green-400'}>
            {isLoading ? 'Yes' : 'No'}
          </span>
        </div>
        
        {error && (
          <div>
            <span className="text-gray-400">Error:</span> 
            <span className="text-red-400">{error}</span>
          </div>
        )}
        
        <div>
          <span className="text-gray-400">Timeframe:</span> 
          <span className="text-blue-400">{currentTimeframe}</span>
        </div>
        
        {ohlcData?.metadata && (
          <div className="mt-2 pt-2 border-t border-gray-600">
            <div>
              <span className="text-gray-400">Pair:</span> 
              <span className="text-white">
                {ohlcData.metadata.pair?.token0?.symbol || 'N/A'} / {ohlcData.metadata.pair?.token1?.symbol || 'N/A'}
              </span>
            </div>
            
            <div>
              <span className="text-gray-400">Reserve USD:</span> 
              <span className="text-green-400">
                ${(ohlcData.metadata.reserveUSD || 0).toLocaleString()}
              </span>
            </div>
            
            <div>
              <span className="text-gray-400">Volume USD:</span> 
              <span className="text-blue-400">
                ${(ohlcData.metadata.volumeUSD || 0).toLocaleString()}
              </span>
            </div>
          </div>
        )}
        
        {timeframeMetrics && (
          <div className="mt-2 pt-2 border-t border-gray-600">
            <div>
              <span className="text-gray-400">Price Change:</span> 
              <span className={timeframeMetrics.priceChange?.percentage >= 0 ? 'text-green-400' : 'text-red-400'}>
                {timeframeMetrics.priceChange?.percentage?.toFixed(2) || 0}%
              </span>
            </div>
            
            <div>
              <span className="text-gray-400">Volume:</span> 
              <span className="text-blue-400">
                ${(timeframeMetrics.totalVolume || 0).toLocaleString()}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EthereumChartDebug;