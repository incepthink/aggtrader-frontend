import { ProjectedEarnings, VaultDetail } from "./vault";

export const formatNumber = (num: number): string => {
  if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
  return num.toFixed(2);
};

// More accurate calculation that matches Morpho's methodology
export const calculateProjectedEarnings = (
  depositAmount: number,
  vault: VaultDetail,
  tokenPrice: number = 1 // Add token price parameter
): ProjectedEarnings => {
  // Use net APY which already accounts for performance fees
  const netApy = vault.state.netApy;

  console.log("Debug earnings calculation:", {
    depositAmount,
    netApy,
    netApyPercent: (netApy * 100).toFixed(4) + "%",
    tokenPrice,
    calculation: `${depositAmount} × ${netApy} ÷ 365 = ${(
      (depositAmount * netApy) /
      365
    ).toFixed(8)}`,
  });

  // Simple interest calculation (what Morpho uses for projections)
  // Formula: earnings = principal × rate × time
  const daily = (depositAmount * netApy) / 365;
  const weekly = (depositAmount * netApy) / 52.18; // 365.25/7
  const monthly = (depositAmount * netApy) / 12;
  const yearly = depositAmount * netApy;

  console.log("Calculated earnings (token amounts):", {
    daily: daily.toFixed(8),
    weekly: weekly.toFixed(8),
    monthly: monthly.toFixed(8),
    yearly: yearly.toFixed(8),
  });

  // Convert to USD using actual token price, not share price
  const result = {
    daily,
    weekly,
    monthly,
    yearly,
    dailyUsd: daily * tokenPrice,
    weeklyUsd: weekly * tokenPrice,
    monthlyUsd: monthly * tokenPrice,
    yearlyUsd: yearly * tokenPrice,
  };

  console.log("Final earnings (USD):", {
    dailyUsd: result.dailyUsd.toFixed(8),
    weeklyUsd: result.weeklyUsd.toFixed(8),
    monthlyUsd: result.monthlyUsd.toFixed(8),
    yearlyUsd: result.yearlyUsd.toFixed(8),
  });

  return result;
};
