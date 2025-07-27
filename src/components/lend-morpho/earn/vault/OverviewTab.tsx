"use client";

import React from "react";
import {
  Box,
  Typography,
  Button,
  Select,
  MenuItem,
  FormControl,
  Paper,
} from "@mui/material";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import {
  VaultDetail,
  HistoricalState,
} from "@/hooks/lend-morpho/ValutDescriptionHooks";

interface OverviewTabProps {
  vault: VaultDetail;
  historicalData?: HistoricalState;
  isHistoricalLoading: boolean;
  timeRange: string;
  setTimeRange: (range: string) => void;
  chartType: string;
  setChartType: (type: string) => void;
}

// Helper function to format large numbers
const formatNumber = (num: number): string => {
  if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
  return num.toFixed(2);
};

// Helper function to format date for X-axis
const formatDateForAxis = (timestamp: number): string => {
  const date = new Date(timestamp);
  const day = date.getDate();
  const month = date.toLocaleDateString("en-US", { month: "short" });
  return `${day} ${month}`;
};

// Helper function to format date for tooltip
const formatDateForTooltip = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const OverviewTab: React.FC<OverviewTabProps> = ({
  vault,
  historicalData,
  isHistoricalLoading,
  timeRange,
  setTimeRange,
  chartType,
  setChartType,
}) => {
  // Transform historical data for chart
  const chartData = React.useMemo(() => {
    if (!historicalData?.totalAssetsUsd) return [];

    return historicalData.totalAssetsUsd.map((point) => ({
      timestamp: point.x * 1000, // Convert to milliseconds
      value: point.y,
      date: new Date(point.x * 1000).toLocaleDateString(),
    }));
  }, [historicalData]);

  // Get current value for display
  const currentValue = vault.state.totalAssetsUsd;

  return (
    <Box>
      {/* Chart Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="body2" sx={{ color: "#8b949e", mb: 1 }}>
            Total Deposits (USD)
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: "bold", color: "white" }}>
            ${formatNumber(currentValue)}
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 2 }}>
          {/* Time Range Selector */}
          <FormControl size="small">
            <Select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              sx={{
                backgroundColor: "rgba(0, 245, 224, 0.1)",
                color: "white",
                "& .MuiOutlinedInput-notchedOutline": { border: "none" },
                "& .MuiSvgIcon-root": { color: "#8b949e" },
              }}
            >
              <MenuItem value="3 months">3 months</MenuItem>
              <MenuItem value="6 months">6 months</MenuItem>
              <MenuItem value="1 year">1 year</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      {/* Chart */}
      <Paper
        sx={{
          height: 400,
          backgroundColor: "#0f1419",
          borderRadius: 2,
          p: 2,
          mb: 3,
        }}
      >
        {isHistoricalLoading ? (
          <Box
            sx={{
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Typography sx={{ color: "#8b949e" }}>
              Loading chart data...
            </Typography>
          </Box>
        ) : chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis
                dataKey="timestamp"
                type="number"
                scale="time"
                domain={["dataMin", "dataMax"]}
                tickFormatter={formatDateForAxis}
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#8b949e", fontSize: 12 }}
                interval="preserveStartEnd"
              />
              <YAxis
                domain={["dataMin - 1000000", "dataMax + 1000000"]}
                tickFormatter={(value) => `${formatNumber(value)}`}
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#8b949e", fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1a1d29",
                  border: "1px solid rgba(0, 245, 224, 0.1)",
                  borderRadius: "8px",
                  color: "white",
                }}
                formatter={(value: number) => [
                  `${formatNumber(value)}`,
                  "Total Deposits",
                ]}
                labelFormatter={formatDateForTooltip}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: "#3b82f6" }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <Box
            sx={{
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Typography sx={{ color: "#8b949e" }}>
              No historical data available
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Additional Info */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 2,
        }}
      >
        <Paper sx={{ p: 2, backgroundColor: "rgba(0, 245, 224, 0.1)" }}>
          <Typography variant="body2" sx={{ color: "#8b949e", mb: 1 }}>
            Total Supply
          </Typography>
          <Typography variant="h6" sx={{ color: "white" }}>
            {formatNumber(
              parseFloat(vault.state.totalSupply) /
                Math.pow(10, vault.asset.decimals)
            )}
          </Typography>
        </Paper>

        <Paper sx={{ p: 2, backgroundColor: "rgba(0, 245, 224, 0.1)" }}>
          <Typography variant="body2" sx={{ color: "#8b949e", mb: 1 }}>
            Share Price
          </Typography>
          <Typography variant="h6" sx={{ color: "white" }}>
            ${vault.state.sharePriceUsd.toFixed(4)}
          </Typography>
        </Paper>

        <Paper sx={{ p: 2, backgroundColor: "rgba(0, 245, 224, 0.1)" }}>
          <Typography variant="body2" sx={{ color: "#8b949e", mb: 1 }}>
            Performance Fee
          </Typography>
          <Typography variant="h6" sx={{ color: "white" }}>
            {(vault.state.fee * 100).toFixed(2)}%
          </Typography>
        </Paper>

        <Paper sx={{ p: 2, backgroundColor: "rgba(0, 245, 224, 0.1)" }}>
          <Typography variant="body2" sx={{ color: "#8b949e", mb: 1 }}>
            Markets
          </Typography>
          <Typography variant="h6" sx={{ color: "white" }}>
            {vault.state.allocation?.length || 0}
          </Typography>
        </Paper>
      </Box>
    </Box>
  );
};

export default OverviewTab;
