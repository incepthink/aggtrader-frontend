// components/PortfolioHeader.tsx
"use client";

import { IconButton, Tooltip } from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import { formatPercent } from "@/utils/spot/tokenUtils";
import type { PortfolioTotals } from "@/utils/spot/portfolioCalculations";
import { useSpotStore } from "@/store/spotStore";

interface PortfolioHeaderProps {
  isRefetching: boolean;
  isLoading: boolean;
  hasTokens: boolean;
  totals: PortfolioTotals;
  onRefetch: () => void;
  priceError?: string | null;
  lastPriceUpdate?: number;
}

export const PortfolioHeader: React.FC<PortfolioHeaderProps> = ({
  isRefetching,
  isLoading,
  hasTokens,
  totals,
  onRefetch,
  priceError,
  lastPriceUpdate,
}) => {
  const { chainId } = useSpotStore();

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2 sm:mb-2 gap-3 sm:gap-0 px-0 sm:px-4">
      <div className="text-lg sm:text-xl font-semibold flex items-center gap-2">
        Token Balances ({chainId === 1 ? "Ethereum" : "Katana"})
        <Tooltip title="Refresh Data" arrow>
          <IconButton
            onClick={onRefetch}
            disabled={isRefetching || isLoading}
            sx={{
              color: "white",
              "&:hover": { color: "#00F5E0" },
              "&:disabled": { color: "gray" },
            }}
          >
            <RefreshIcon
              sx={{
                fontSize: 20,
                animation: isRefetching ? "spin 1s linear infinite" : "none",
                "@keyframes spin": {
                  "0%": { transform: "rotate(0deg)" },
                  "100%": { transform: "rotate(360deg)" },
                },
              }}
            />
          </IconButton>
        </Tooltip>
      </div>

      {/* Portfolio Summary Stats - Only show if we have Ethereum tokens */}
      {hasTokens && (
        <div className="flex gap-6">
          <div className="flex flex-col items-center">
            <div className="text-lg sm:text-xl font-bold">
              ${totals.customTotalValue.toFixed(2)}
            </div>
            <div className="text-xs text-gray-400">Total Value</div>
          </div>

          <div className="flex flex-col items-center">
            <div
              className={`text-sm sm:text-lg font-semibold ${
                totals.customTotalPnL >= 0 ? "text-green-400" : "text-red-400"
              }`}
            >
              {totals.customTotalPnL >= 0 ? "+" : ""}$
              {totals.customTotalPnL.toFixed(2)}
            </div>
            <div className="text-xs text-gray-400">P&L</div>
          </div>

          <div className="flex flex-col items-center">
            <div
              className={`text-sm sm:text-lg font-semibold ${
                totals.customTotalROI >= 0 ? "text-green-400" : "text-red-400"
              }`}
            >
              {totals.customTotalROI >= 0 ? "+" : ""}
              {formatPercent(totals.customTotalROI)}
            </div>
            <div className="text-xs text-gray-400">ROI</div>
          </div>
        </div>
      )}
    </div>
  );
};
