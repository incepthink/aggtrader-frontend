// src/components/EquityTrendChart.tsx
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

/* ───── static sample curve ───── */
const DATA = [
  { t: "05-01", v: 4100 },
  { t: "05-06", v: 3150 },
  { t: "05-11", v: 2900 },
  { t: "05-16", v: 3300 },
  { t: "05-21", v: 3950 },
  { t: "05-26", v: 4380 },
  { t: "05-31", v: 4525 },
];

export default function EquityTrendChart() {
  return (
    <div className="neon-panel h-[340px]">
      <header className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Equity Trend</h3>
        <div className="flex gap-2">
          <button className="time-btn !bg-cyan-500/20">7 days</button>
          <button className="time-btn">30 days</button>
        </div>
      </header>

      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={DATA}
          margin={{ top: 10, right: 0, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="equityGradient" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#00FFE9" stopOpacity={0.5} />
              <stop offset="100%" stopColor="#00FFE9" stopOpacity={0} />
            </linearGradient>
          </defs>

          {/* grid dots, subtle */}
          <CartesianGrid
            stroke="#ffffff0f"
            strokeDasharray="1 8"
            vertical={false}
          />

          <XAxis
            dataKey="t"
            tickLine={false}
            axisLine={false}
            tick={{ fill: "#6b7280", fontSize: 11 }}
          />

          <Tooltip
            contentStyle={{ background: "#0d0c1a", border: "none" }}
            itemStyle={{ color: "#00FFE9" }}
            labelStyle={{ color: "#6b7280" }}
          />

          <Area
            type="monotone"
            dataKey="v"
            stroke="#00FFE9"
            strokeWidth={2}
            fill="url(#equityGradient)"
            dot={false}
            activeDot={{ r: 4, fill: "#00FFE9" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
