// types/swap.types.ts
export interface Token {
  address: `0x${string}`;
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
  to: `0x${string}` | null;
  data: `0x${string}` | null;
  value: bigint | null;
}

export interface TokenInfo {
  address: `0x${string}`;
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
  srcToken: TokenInfo;
  dstToken: TokenInfo;
  dstAmount: string;
  protocols: TokenSwaps[];
  gas?: number;
}
