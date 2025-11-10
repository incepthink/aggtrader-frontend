// components/charts/TvlPieChart.tsx
import React, { useMemo } from "react";
import { useKatanaTvl } from "@/hooks/useKatanaTvl";
import { CommonPieChart, PieDataItem } from "./CommonPieChart";

export function TvlPieChart() {
  const { sushiswap, yearnfi, morphoDeposits, morphoBorrow, isLoading } =
    useKatanaTvl();

  const pieData: PieDataItem[] = useMemo(() => {
    const data: PieDataItem[] = [];

    // Always show SushiSwap
    data.push({
      name: "SushiSwap",
      value: sushiswap || 0,
      color: "#0088FE",
      balance: sushiswap || 0,
      symbol: "USD",
    });

    // Always show Yearn Finance
    data.push({
      name: "Yearn Finance",
      value: yearnfi || 0,
      color: "#00C49F",
      balance: yearnfi || 0,
      symbol: "USD",
    });

    // Always show Morpho Deposits
    data.push({
      name: "Morpho Deposits",
      value: morphoDeposits || 0,
      color: "#FFBB28",
      balance: morphoDeposits || 0,
      symbol: "USD",
    });

    // Always show Morpho Borrow
    data.push({
      name: "Morpho Borrow",
      value: morphoBorrow || 0,
      color: "#FF8042",
      balance: morphoBorrow || 0,
      symbol: "USD",
    });

    return data;
  }, [sushiswap, yearnfi, morphoDeposits, morphoBorrow]);

  return (
    <div className="w-full">
      <CommonPieChart
        data={pieData}
        isLoading={isLoading}
        centerLabel="Total TVL"
      />
      <div className="mt-4 text-center">
        <p className="text-gray-500 text-sm">
          Platform TVL breakdown across DeFi protocols
        </p>
      </div>
    </div>
  );
}
