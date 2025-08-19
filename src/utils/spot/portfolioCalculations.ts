// utils/portfolioCalculations.ts
import type { PortfolioToken } from "@/hooks/usePortfolioDetailed";

export interface PortfolioTotals {
  customTotalPnL: number;
  customTotalROI: number;
  customTotalValue: number;
}

export interface TokenCalculation {
  investedValue: number;
  currentValue: number;
  customPnL: number;
  customROI: number;
}

export const calculateTokenPnL = (
  token: PortfolioToken,
  entryPrice: number
): TokenCalculation => {
  const investedValue = entryPrice * token.amount;
  const currentValue = token.value_usd;
  const customPnL = currentValue - investedValue;
  const customROI = investedValue > 0 ? customPnL / investedValue : 0;

  return {
    investedValue,
    currentValue,
    customPnL,
    customROI,
  };
};

export const calculatePortfolioTotals = (
  tokens: PortfolioToken[],
  getEntryPrice: (tokenKey: string, fallback: number) => number
): PortfolioTotals => {
  if (!tokens.length) {
    return { customTotalPnL: 0, customTotalROI: 0, customTotalValue: 0 };
  }

  let customTotalPnL = 0;
  let totalInvested = 0;
  let customTotalValue = 0;

  tokens.forEach((token) => {
    const tokenKey = `${token.chain_id}-${token.contract_address}`;
    const entryPrice = getEntryPrice(tokenKey, token.price_to_usd);
    const calculation = calculateTokenPnL(token, entryPrice);

    customTotalPnL += calculation.customPnL;
    totalInvested += calculation.investedValue;
    customTotalValue += calculation.currentValue;
  });

  const customTotalROI = totalInvested > 0 ? customTotalPnL / totalInvested : 0;

  return { customTotalPnL, customTotalROI, customTotalValue };
};
