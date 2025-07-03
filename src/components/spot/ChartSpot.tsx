"use client";

import { useSpotStore } from "@/store/spotStore";
import { BACKEND_URL } from "@/utils/constants";
import axios from "axios";
import React, { useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { startOfMonth, addMonths, differenceInMonths } from "date-fns";
import type { TooltipProps } from "recharts";

const formatTooltipLabel = (ts: number) =>
  new Date(ts).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

const CustomTooltip: React.FC<TooltipProps<number, string>> = ({
  active,
  payload,
  label,
}) => {
  if (!active || !payload?.length) return null;

  const price = payload[0]?.value as number;

  return (
    <div className="rounded-xl bg-[#0d1117]/90 backdrop-blur-md p-3 border border-[#30363d] shadow-xl">
      <p className="text-xs text-[#58a6ff] mb-1">{formatTooltipLabel(label)}</p>
      <p className="text-sm font-semibold text-[#f0f6fc]">
        ${price.toLocaleString()}
      </p>
    </div>
  );
};

function formatUSDCompact(value: number) {
  if (value === null || value === undefined || isNaN(value)) return "$0.00";

  const abs = Math.abs(value);

  let formatted;
  if (abs >= 1_000_000_000) {
    formatted = (value / 1_000_000_000).toFixed(2) + "B";
  } else if (abs >= 1_000_000) {
    formatted = (value / 1_000_000).toFixed(2) + "M";
  } else if (abs >= 1_000) {
    formatted = (value / 1_000).toFixed(2) + "K";
  } else {
    formatted = value.toFixed(2);
  }

  return `$${formatted}`;
}

const ChartSpot = () => {
  const tokenOne = useSpotStore((state) => state.tokenOne);

  const [chartData, setChartData] = useState<any>([]);
  const [fdv, setFdv] = useState(0);
  const [vol, setVol] = useState(0);

  function buildMonthTicks(from: number, to: number) {
    const first = startOfMonth(new Date(from)).getTime();
    const months = differenceInMonths(new Date(to), new Date(first));
    const ticks: number[] = [];
    for (let i = 0; i <= months - 1; i++) {
      ticks.push(addMonths(first, i).getTime());
    }
    return ticks;
  }

  const monthTicks = useMemo(() => {
    if (chartData.length === 0) return [];

    const first = chartData[0].ts;
    const last = chartData[chartData.length - 1].ts;
    return buildMonthTicks(first, last);
  }, [chartData]);

  async function fetchOhlcData() {
    try {
      const { data } = await axios.get(`${BACKEND_URL}/api/chart/price`, {
        params: {
          tokenAddress: tokenOne.address,
        },
      });
      setChartData(data.chart);
      setFdv(data.metadata.fdv);
      setVol(data.metadata.vol);
      console.log("DATA", data.chart);
    } catch (error) {
      console.error("ERROR FETCHING OHLC:: ", error);
      setChartData([]);
    }
  }

  useEffect(() => {
    if (tokenOne) {
      fetchOhlcData();
    }
  }, [tokenOne]);

  if (chartData.length === 0) {
    return (
      <div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <>
      <div className="absolute top-5 left-8 right-32 flex justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 rounded-full overflow-hidden">
            <img
              src={tokenOne.logo}
              alt={tokenOne.symbol}
              className="w-full object-cover"
            />
          </div>
          <p className="text-2xl">{tokenOne.name}</p>
        </div>

        <div className="flex gap-4">
          <div className="flex flex-col gap-1 items-center">
            <p className="text-sm opacity-80">FDV</p>
            <p>{formatUSDCompact(fdv)}</p>
          </div>
          <div className="flex flex-col gap-1 items-center">
            <p className="text-sm opacity-80">24H VOL</p>
            <p>{formatUSDCompact(vol)}</p>
          </div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={"100%"}>
        <LineChart data={chartData} margin={{ top: 30 }}>
          {/* <CartesianGrid /> */}
          <XAxis
            scale={"time"}
            dataKey="ts"
            domain={["dataMin", "dataMax"]}
            type="number"
            ticks={monthTicks}
            tickFormatter={(ts) =>
              new Date(ts).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              })
            }
          />
          <YAxis
            dataKey="price"
            tickFormatter={(v) => `$${v.toLocaleString()}`}
            width={80}
            orientation="right"
            tickCount={5}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="price"
            stroke="#00b4ff"
            dot={false}
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </>
  );
};

export default ChartSpot;
