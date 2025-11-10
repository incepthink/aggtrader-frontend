// src/types/portfolio.ts
import type { PortfolioToken } from "@/hooks/usePortfolioDetailed";
import type { KatanaPortfolioToken } from "@/hooks/useKatanaPortfolio";

// Combined token type for both Katana and other chains
export type CombinedToken = (PortfolioToken | KatanaPortfolioToken) & {
  amount: number;
  price_to_usd: number;
  value_usd: number;
  symbol: string;
  name: string;
  chain_id: number;
  contract_address?: string;
  address?: string;
};

export interface PriceStats {
  supportedTokensCount: number;
  unsupportedTokens: string[];
  totalTokensCount: number;
  lastUpdated: number;
}

export interface TokenPair {
  addressOne: `0x${string}`;
  chainId: 1 | 747474;
}