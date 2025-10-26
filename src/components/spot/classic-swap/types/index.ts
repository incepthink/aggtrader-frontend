/**
 * Type definitions for Classic Swap
 */

export type SnackbarSeverity = "success" | "error" | "warning" | "info";

export interface Token {
  name: string;
  ticker: string;
  img: string;
  address: `0x${string}`;
  decimals: number;
  chainId?: number;
  balance?: string;
}

export interface SwapQuote {
  amountOut: string;
  priceImpact: number;
  route: string[];
  gas: string;
  [key: string]: any;
}

export interface SwapParams {
  tokenIn: Token;
  tokenOut: Token;
  amount: string;
  slippage: number;
}

export interface PriceData {
  ratio: number;
  tokenOnePrice: number | null;
  tokenTwoPrice: number | null;
}