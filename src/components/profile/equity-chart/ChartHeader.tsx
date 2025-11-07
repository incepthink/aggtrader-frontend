// src/components/profile/equity-chart/ChartHeader.tsx
import { Info, Refresh } from "@mui/icons-material";
import { Tooltip as MuiTooltip, IconButton } from "@mui/material";

interface ChartHeaderProps {
  isLoading: boolean;
  hasRealData: boolean;
  dataPointsCount: number;
  stats: {
    change: number;
    changeAmount: number;
    high: number;
    low: number;
    current: number;
  } | null;
  onRefetch: () => void;
}

export default function ChartHeader({
  isLoading,
  hasRealData,
  dataPointsCount,
  stats,
  onRefetch,
}: ChartHeaderProps) {
  return (
    <header className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-white">Equity Trend</h3>

          {/* Info Tooltip */}
          <MuiTooltip
            title={
              <div className="text-sm p-1">
                <p className="font-semibold mb-1">How we track your equity:</p>
                <p className="text-xs text-gray-300">
                  We automatically track your wallet balance (ETH + Yearn
                  vaults) every hour and store historical snapshots to show your
                  portfolio growth over time. Data is securely stored and only
                  visible to you.
                </p>
              </div>
            }
            arrow
            placement="top"
            componentsProps={{
              tooltip: {
                sx: {
                  bgcolor: "rgba(0, 0, 0, 0.9)",
                  border: "1px solid rgba(0, 245, 224, 0.3)",
                  borderRadius: "8px",
                  padding: "12px",
                  maxWidth: "280px",
                  "& .MuiTooltip-arrow": {
                    color: "rgba(0, 0, 0, 0.9)",
                  },
                },
              },
            }}
          >
            <Info
              sx={{
                fontSize: 16,
                color: "#ffffff60",
                cursor: "pointer",
                "&:hover": { color: "#00F5E0" },
                transition: "color 0.2s",
              }}
            />
          </MuiTooltip>

          {/* Refresh Button */}
          <IconButton
            onClick={onRefetch}
            disabled={isLoading}
            sx={{
              padding: "4px",
              color: "#ffffff60",
              "&:hover": {
                color: "#00F5E0",
                backgroundColor: "rgba(0, 245, 224, 0.1)",
              },
              "&:disabled": {
                color: "#ffffff30",
              },
            }}
          >
            <Refresh
              sx={{
                fontSize: 18,
                animation: isLoading ? "spin 1s linear infinite" : "none",
              }}
            />
          </IconButton>
        </div>

        {isLoading && (
          <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
        )}

        {/* Show percentage change */}
        {stats && (
          <div
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              stats.change >= 0
                ? "bg-green-400/20 text-green-400 border border-green-400/30"
                : "bg-red-400/20 text-red-400 border border-red-400/30"
            }`}
          >
            {stats.change >= 0 ? "+" : ""}
            {stats.change.toFixed(2)}%
          </div>
        )}
      </div>

      <div className="text-xs text-white/40">
        {hasRealData ? `${dataPointsCount} data points` : "Historical trend"}
      </div>
    </header>
  );
}
