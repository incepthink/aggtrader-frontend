// types/swapTypes.ts
import { type Address } from "viem";

export interface Token {
  address: Address;
  name: string;
  ticker: string;
  img: string;
  decimals: number;
}

export interface PriceData {
  ratio: number;
  tokenOne?: number;
  tokenTwo?: number;
  [k: string]: any;
}

export interface TxDetails {
  to: Address | null;
  data: `0x${string}` | null;
  value: bigint | null;
}

export interface TokenInfo {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI: string;
  domainVersion?: string;
  eip2612?: boolean;
  isFoT?: boolean;
  tags?: string[];
}

export interface SelectedLiquiditySource {
  name: string;
  part: number;
}

export interface TokenHop {
  part: number;
  dst: string;
  fromTokenId: number;
  toTokenId: number;
  protocols: SelectedLiquiditySource[];
}

export interface TokenSwaps {
  token: string;
  hops: TokenHop[];
}

export interface QuoteResponse {
  toAmount: string;
  estimatedGas?: number;
  gas?: number;
  protocols?: any[];
}

export type SnackbarSeverity = "success" | "error" | "warning" | "info";
