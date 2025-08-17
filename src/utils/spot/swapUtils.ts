// utils/swapUtils.ts
import type { PortfolioToken } from "@/hooks/usePortfolioDetailed";
import type { Token } from "@/types/swap.types";

// Helper function to create PortfolioToken from swap token
export const createPortfolioTokenFromSwapToken = (
  swapToken: Token
): PortfolioToken => {
  return {
    symbol: swapToken.ticker,
    contract_address: swapToken.address,
    chain_id: 1, // Ethereum mainnet
    amount: 1, // We only need price, not value calculation
    name: swapToken.name,
    price_to_usd: 0, // Will be updated by Binance
    value_usd: 0,
    abs_profit_usd: 0, // Required by interface
    roi: 0, // Required by interface
    status: 1, // Required by interface
  };
};

// Helper function to format USD prices
export const formatUSDPrice = (
  amount: number,
  price: number | null
): string => {
  if (!price || !amount) return "$0.00";
  return (amount * price).toFixed(2);
};

// Helper function to get token price from Binance hook
export const getTokenBinancePrice = (
  token: Token,
  getTokenPrice: (token: PortfolioToken) => number | null,
  portfolioTokens: PortfolioToken[]
): number | null => {
  const portfolioToken = portfolioTokens.find(
    (pt) => pt.contract_address.toLowerCase() === token.address.toLowerCase()
  );
  return portfolioToken ? getTokenPrice(portfolioToken) : null;
};
