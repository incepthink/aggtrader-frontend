// components/spot/tokenBalance/PortfolioStats.tsx
"use client";

import type { PriceStats } from "@/types/portfolio";

interface PortfolioStatsProps {
  priceError?: Error | null;
  priceStats: PriceStats;
  isPriceLoading: boolean;
}

export const PortfolioStats: React.FC<PortfolioStatsProps> = ({
  priceError,
  priceStats,
  isPriceLoading,
}) => {
  return (
    <>
      {/* Price Error Alert */}
      {priceError && (
        <div className="mb-4 p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
          <div className="text-red-400 text-sm">
            Sushi API error: {priceError.message}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            Falling back to fallback prices
          </div>
        </div>
      )}

      {/* Unsupported Tokens Warning */}
      {priceStats.unsupportedTokens.length > 0 && (
        <div className="mb-4 p-3 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
          <div className="text-yellow-400 text-sm">
            {priceStats.unsupportedTokens.length} token(s) not available on
            Sushi API
          </div>
          <div className="text-xs text-gray-400 mt-1">
            Using fallback prices for: {priceStats.unsupportedTokens.join(", ")}
          </div>
        </div>
      )}
    </>
  );
};
