// src/components/EquityTrendChart.tsx
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { useEquityTrend } from "@/hooks/useEquityTrend";

export default function EquityTrendChart() {
  const { isConnected } = useAccount();
  const [timeRange, setTimeRange] = useState<"7" | "30">("7");
  const [isMobile, setIsMobile] = useState(false);

  // Use the custom hook
  const { data, isLoading, error, isSuccess } = useEquityTrend({
    timeRange,
    enabled: isConnected,
  });

  // Check if mobile on client side
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0a0b14]/95 backdrop-blur-sm border border-cyan-400/30 rounded-xl p-4 shadow-2xl">
          <p className="text-slate-400 text-sm font-medium mb-1">{label}</p>
          <p className="text-cyan-300 font-bold text-lg">
            $
            {payload[0].value.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-cyan-400/30"></div>
        </div>
      );
    }
    return null;
  };

  const hasRealData = isSuccess && data.length > 0;

  return (
    <div className="neon-panel h-[340px]">
      <header className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-white">Equity Trend</h3>
          {isLoading && (
            <div className="w-4 h-4 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
          )}
        </div>
        <div className="flex gap-2">
          <button
            className={`time-btn ${timeRange === "7" ? "!bg-cyan-500/20" : ""}`}
            onClick={() => setTimeRange("7")}
          >
            7 days
          </button>
          <button
            className={`time-btn ${
              timeRange === "30" ? "!bg-cyan-500/20" : ""
            }`}
            onClick={() => setTimeRange("30")}
          >
            30 days
          </button>
        </div>
      </header>

      {error && (
        <div className="text-yellow-400 text-sm mb-4 p-2 bg-yellow-900/20 rounded">
          {error.message}
        </div>
      )}

      {/* Show chart only when we have real data */}
      {hasRealData ? (
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart
            data={data}
            margin={
              isMobile
                ? { top: 20, right: 0, left: 0, bottom: 0 }
                : { top: 20, right: 20, left: 20, bottom: 20 }
            }
          >
            <defs>
              {/* Enhanced gradient with multiple colors */}
              <linearGradient id="equityGradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#00FFE9" stopOpacity={0.8} />
                <stop offset="50%" stopColor="#00D4FF" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#0099CC" stopOpacity={0.1} />
              </linearGradient>

              {/* Glow effect gradient */}
              <linearGradient id="strokeGradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#00FFE9" stopOpacity={1} />
                <stop offset="100%" stopColor="#00D4FF" stopOpacity={0.8} />
              </linearGradient>
            </defs>

            <CartesianGrid
              stroke="#ffffff08"
              strokeDasharray="2 6"
              vertical={false}
              opacity={0.3}
            />

            <XAxis
              dataKey="t"
              tickLine={false}
              axisLine={false}
              tick={{
                fill: "#64748b",
                fontSize: 11,
                fontWeight: 500,
              }}
              tickMargin={8}
            />

            <Tooltip content={<CustomTooltip />} />

            <Area
              type="monotone"
              dataKey="v"
              stroke="url(#strokeGradient)"
              strokeWidth={3}
              fill="url(#equityGradient)"
              dot={false}
              activeDot={{
                r: 6,
                fill: "#00FFE9",
                stroke: "#ffffff",
                strokeWidth: 2,
                style: {
                  filter: "drop-shadow(0 0 8px rgba(0, 255, 233, 0.6))",
                },
              }}
              style={{
                filter: "drop-shadow(0 2px 4px rgba(0, 255, 233, 0.2))",
              }}
              animationDuration={2000}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        /* No data state - show image */
        <div className="flex flex-col items-center justify-center h-[250px] text-center">
          <img
            src="/assets/no-data-dark.svg"
            alt="No data available"
            className="w-24 h-24 mb-4 opacity-50"
          />
          <p className="text-slate-400 text-sm">
            {isLoading
              ? "Loading portfolio data..."
              : "No equity data available"}
          </p>
          {!isConnected && (
            <p className="text-slate-500 text-xs mt-2">
              Connect your wallet to view equity trends
            </p>
          )}
        </div>
      )}

      {/* Debug info */}
      <div className="absolute bottom-2 right-2 text-xs text-gray-600">
        Data points: {data.length}
      </div>

      {/* Loading shimmer effect */}
      {isLoading && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/10 to-transparent animate-pulse rounded-lg"></div>
      )}
    </div>
  );
}
