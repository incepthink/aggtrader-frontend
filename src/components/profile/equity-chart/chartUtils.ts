// src/components/profile/equity-chart/chartUtils.ts
interface ChartDataPoint {
  timestamp: string;
  balance: number;
}

export interface PortfolioStats {
  change: number;
  changeAmount: number;
  high: number;
  low: number;
  current: number;
}

export const getPortfolioStats = (
  chartData: ChartDataPoint[]
): PortfolioStats | null => {
  if (chartData.length < 2) return null;

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

export const calculateYAxisTicks = (
  chartData: ChartDataPoint[]
): number[] => {
  if (chartData.length === 0) return [0, 5, 10, 15, 20];

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

export const getUniqueDates = (chartData: ChartDataPoint[]): string[] => {
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
};