// components/charts/PieChartComp.tsx
import React, { useMemo } from "react";
import { useAccount } from "wagmi";
import { useKatanaPortfolio } from "@/hooks/useKatanaPortfolio";
import { CommonPieChart, PieDataItem } from "./CommonPieChart";

type PropType = {
  isLoading?: boolean;
};

const generateColors = (count: number) => {
  const colors = [
    "#0088FE",
    "#00C49F",
    "#FFBB28",
    "#FF8042",
    "#8884D8",
    "#82CA9D",
    "#FFC658",
    "#FF7C7C",
    "#8DD1E1",
    "#D084D0",
    "#87D068",
    "#FFA500",
  ];
  return colors.slice(0, count);
};

export function PieChartComp({ isLoading = false }: PropType) {
  const { address } = useAccount();
  const { tokens: katanaTokens, isLoading: katanaLoading } = useKatanaPortfolio(
    address || null
  );

  const pieData: PieDataItem[] = useMemo(() => {
    const symbolMap = new Map<string, PieDataItem>();

    // Add Katana tokens
    if (katanaTokens && katanaTokens.length > 0) {
      katanaTokens.forEach((token) => {
        if (token.value > 0.01) {
          if (symbolMap.has(token.symbol)) {
            const existing = symbolMap.get(token.symbol)!;
            existing.balance += token.balance;
            existing.value += token.value;
          } else {
            symbolMap.set(token.symbol, {
              name: token.symbol,
              value: token.value,
              color: "#0088FE",
              balance: token.balance,
              symbol: token.symbol,
            });
          }
        }
      });
    }

    const data = Array.from(symbolMap.values());
    const colorList = generateColors(data.length);
    data.forEach((item, index) => {
      item.color = colorList[index];
    });

    return data.length > 0
      ? data
      : [
          {
            name: "No Data",
            value: 0,
            color: "#666666",
            balance: 0,
            symbol: "",
          },
        ];
  }, [katanaTokens]);

  const isChartLoading = isLoading || katanaLoading;

  return (
    <div className="w-full">
      <CommonPieChart
        data={pieData}
        isLoading={isChartLoading}
        centerLabel="Total Portfolio"
      />
      <div className="mt-4 text-center">
        <p className="text-gray-500 text-sm">
          Katana token portfolio breakdown
        </p>
      </div>
    </div>
  );
}
