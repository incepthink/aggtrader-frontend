// src/components/profile/equity-chart/EquityChart.tsx
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import CustomTooltip from "./CustomTooltip";
import CustomYAxisTick from "./CustomYAxisTick";

interface EquityChartProps {
  chartData: any[];
  screenWidth: number;
  isMobile: boolean;
  yAxisTicks: number[];
}

export default function EquityChart({
  chartData,
  screenWidth,
  isMobile,
  yAxisTicks,
}: EquityChartProps) {
  return (
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
          <linearGradient id="equityGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#00FFE9" stopOpacity={0.6} />
            <stop offset="50%" stopColor="#00D4FF" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#0099CC" stopOpacity={0.1} />
          </linearGradient>

          {/* Stroke gradient */}
          <linearGradient id="strokeGradient" x1="0" x2="0" y1="0" y2="1">
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
          tick={
            <CustomYAxisTick screenWidth={screenWidth} isMobile={isMobile} />
          }
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
            r: 5,
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
          connectNulls
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
