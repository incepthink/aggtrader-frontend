// src/components/EquityTrendChart.tsx
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { useState, useEffect, useMemo } from "react";
import { useAccount } from "wagmi";
import { useEquityTrend } from "@/hooks/useEquityTrend";
import { Info } from "@mui/icons-material";
import { Tooltip as MuiTooltip } from "@mui/material";

export default function EquityTrendChart() {
  const { address, isConnected } = useAccount();
  const [isMobile, setIsMobile] = useState(false);
  const [screenWidth, setScreenWidth] = useState(0);

  // Fetch equity trend data
  const { data, isLoading, error, isSuccess } = useEquityTrend(address);

  console.log("EQUITYCHART::", data);

  // Check screen size
  useEffect(() => {
    const checkSize = () => {
      const width = window.innerWidth;
      setScreenWidth(width);
      setIsMobile(width < 640);
    };

    checkSize();
    window.addEventListener("resize", checkSize);

    return () => window.removeEventListener("resize", checkSize);
  }, []);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-black/80 backdrop-blur-sm border border-cyan-400/30 rounded-lg p-3 shadow-xl">
          <p className="text-cyan-300 font-bold text-lg">
            $
            {payload[0].value.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
          <p className="text-white/60 text-xs mt-1">
            {new Date(payload[0].payload.timestamp).toLocaleDateString(
              "en-US",
              {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              }
            )}
          </p>
        </div>
      );
    }
    return null;
  };

  const hasRealData =
    isSuccess && data?.data?.history && data.data.history.length > 0;
  const chartData = hasRealData ? data.data.history : [];

  // Get unique dates for X-axis labels
  const uniqueDates = useMemo(() => {
    if (!hasRealData) return [];

    const dateSet = new Set<string>();
    const uniqueLabels: string[] = [];

    chartData.forEach((item) => {
      const date = new Date(item.timestamp);
      const dateLabel = date.toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
      });

      if (!dateSet.has(dateLabel)) {
        dateSet.add(dateLabel);
        uniqueLabels.push(dateLabel);
      }
    });

    return uniqueLabels;
  }, [chartData, hasRealData]);

  // Calculate percentage change and stats
  const getPortfolioStats = () => {
    if (!hasRealData || chartData.length < 2) return null;

    const firstValue = chartData[0].balance;
    const lastValue = chartData[chartData.length - 1].balance;
    const maxValue = Math.max(...chartData.map((d) => d.balance));
    const minValue = Math.min(...chartData.map((d) => d.balance));

    if (firstValue === 0) return null;

    const change = ((lastValue - firstValue) / firstValue) * 100;
    const changeAmount = lastValue - firstValue;

    return {
      change,
      changeAmount,
      high: maxValue,
      low: minValue,
      current: lastValue,
    };
  };

  const stats = getPortfolioStats();

  // Calculate dynamic Y-axis ticks
  const calculateYAxisTicks = () => {
    if (!hasRealData || chartData.length === 0) return [0, 5, 10, 15, 20];

    const maxValue = Math.max(...chartData.map((d) => d.balance));
    const minValue = Math.min(...chartData.map((d) => d.balance));

    // Round up max to next whole number and add 1
    const maxTick = Math.ceil(maxValue) + 1;
    const minTick = Math.max(0, Math.floor(minValue) - 1);

    const range = maxTick - minTick;

    // Determine interval based on range
    let interval;
    if (range <= 20) {
      interval = 2;
    } else if (range <= 50) {
      interval = 5;
    } else if (range <= 100) {
      interval = 10;
    } else if (range <= 200) {
      interval = 20;
    } else if (range <= 500) {
      interval = 50;
    } else if (range <= 1000) {
      interval = 100;
    } else {
      interval = 200;
    }

    // Generate ticks
    const ticks = [];
    for (let i = minTick; i <= maxTick; i += interval) {
      ticks.push(i);
    }

    // Ensure maxTick is included
    if (ticks[ticks.length - 1] < maxTick) {
      ticks.push(maxTick);
    }

    return ticks;
  };

  const yAxisTicks = calculateYAxisTicks();

  // Custom Y-axis tick to prevent duplicates
  const CustomYAxisTick = ({ x, y, payload }: any) => {
    const fontSize = screenWidth <= 730 ? 9 : isMobile ? 10 : 11;

    return (
      <g transform={`translate(${x},${y})`}>
        <text
          x={0}
          y={0}
          dy={4}
          textAnchor="end"
          fill="#ffffff80"
          fontSize={fontSize}
          fontWeight={500}
        >
          ${payload.value.toFixed(0)}
        </text>
      </g>
    );
  };

  const fontSize = screenWidth <= 730 ? 9 : isMobile ? 10 : 11;

  return (
    <div className="neon-panel h-[400px] relative">
      <header className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-white">Equity Trend</h3>

            {/* Info Tooltip */}
            <MuiTooltip
              title={
                <div className="text-sm p-1">
                  <p className="font-semibold mb-1">
                    How we track your equity:
                  </p>
                  <p className="text-xs text-gray-300">
                    We automatically track your wallet balance (ETH + Yearn
                    vaults) every hour and store historical snapshots to show
                    your portfolio growth over time. Data is securely stored and
                    only visible to you.
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
          {hasRealData ? `${chartData.length} data points` : "Historical trend"}
        </div>
      </header>

      {error && (
        <div className="text-yellow-400 text-sm mb-4 p-3 bg-yellow-400/10 border border-yellow-400/20 rounded">
          {error.message || "Failed to load equity data"}
        </div>
      )}

      {/* Chart Container */}
      <div className="relative">
        {hasRealData ? (
          <>
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart
                data={chartData}
                margin={
                  screenWidth <= 730
                    ? { top: 10, right: 5, left: -15, bottom: 10 }
                    : isMobile
                    ? { top: 10, right: 5, left: -10, bottom: 10 }
                    : { top: 10, right: 20, left: 0, bottom: 20 }
                }
              >
                <defs>
                  {/* Enhanced gradient with cyan theme */}
                  <linearGradient
                    id="equityGradient"
                    x1="0"
                    x2="0"
                    y1="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#00FFE9" stopOpacity={0.6} />
                    <stop offset="50%" stopColor="#00D4FF" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#0099CC" stopOpacity={0.1} />
                  </linearGradient>

                  {/* Stroke gradient */}
                  <linearGradient
                    id="strokeGradient"
                    x1="0"
                    x2="0"
                    y1="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#00FFE9" stopOpacity={1} />
                    <stop offset="100%" stopColor="#00D4FF" stopOpacity={0.8} />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  stroke="#ffffff10"
                  strokeDasharray="2 6"
                  vertical={false}
                  opacity={0.5}
                />

                {/* XAxis without labels */}
                <XAxis
                  dataKey="timestamp"
                  tick={false}
                  tickLine={false}
                  axisLine={{ stroke: "#ffffff20", strokeWidth: 1 }}
                  height={35}
                />

                <YAxis
                  tickLine={false}
                  axisLine={{ stroke: "#ffffff20", strokeWidth: 1 }}
                  tick={<CustomYAxisTick />}
                  tickMargin={4}
                  domain={[
                    (dataMin: number) =>
                      Math.max(0, dataMin - Math.abs(dataMin * 0.15)),
                    (dataMax: number) => dataMax + Math.abs(dataMax * 0.15),
                  ]}
                  ticks={yAxisTicks}
                  width={screenWidth <= 730 ? 30 : isMobile ? 35 : 45}
                />

                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{
                    stroke: "#00FFE9",
                    strokeWidth: 1,
                    strokeOpacity: 0.3,
                  }}
                />

                <Area
                  type="monotone"
                  dataKey="balance"
                  stroke="url(#strokeGradient)"
                  strokeWidth={2}
                  fill="url(#equityGradient)"
                  dot={{
                    r: chartData.length === 1 ? 5 : 0,
                    fill: "#00FFE9",
                    stroke: "#ffffff",
                    strokeWidth: 2,
                  }}
                  activeDot={{
                    r: isMobile ? 4 : 6,
                    fill: "#00FFE9",
                    stroke: "#ffffff",
                    strokeWidth: 2,
                    style: {
                      filter: "drop-shadow(0 0 8px rgba(0, 255, 233, 0.6))",
                    },
                  }}
                  animationDuration={2000}
                  animationEasing="ease-out"
                />
              </AreaChart>
            </ResponsiveContainer>

            {/* Absolute positioned X-axis labels */}
            <div
              className="absolute flex justify-between items-center"
              style={{
                bottom: screenWidth <= 730 || isMobile ? "10px" : "20px",
                left: screenWidth <= 730 ? "15px" : isMobile ? "25px" : "60px",
                right: screenWidth <= 730 ? "5px" : isMobile ? "5px" : "20px",
              }}
            >
              {uniqueDates.map((dateLabel, index) => (
                <div
                  key={index}
                  className="text-center flex-1"
                  style={{
                    color: "#ffffff80",
                    fontSize: `${fontSize}px`,
                    fontWeight: 500,
                  }}
                >
                  {dateLabel}
                </div>
              ))}
            </div>
          </>
        ) : (
          /* No data state */
          <div className="flex flex-col items-center justify-center h-[320px] text-center">
            <div className="w-16 h-16 mb-4 bg-white/5 rounded-lg flex items-center justify-center">
              <span className="text-2xl text-white/20">📊</span>
            </div>
            <div className="space-y-2">
              <p className="text-white/60 text-sm">
                {isLoading
                  ? "Loading equity data..."
                  : !isConnected
                  ? "Connect your wallet to view equity trends"
                  : "No equity data available yet"}
              </p>
              {!isConnected && (
                <p className="text-white/40 text-xs">
                  Connect your wallet to start tracking
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Loading shimmer effect */}
      {isLoading && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/5 to-transparent animate-pulse rounded-lg pointer-events-none"></div>
      )}
    </div>
  );
}
