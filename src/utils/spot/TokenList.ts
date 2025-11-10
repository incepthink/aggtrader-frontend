// src/utils/spot/TokenList.ts
import { Address } from "viem";

export interface Token {
  ticker: string;
  img: string;
  name: string;
  address: Address;
  decimals: number;
}

// Katana tokens - the only supported tokens
export const KATANA_TOKENS: Token[] = [
  {
    ticker: "ETH",
    img: "https://assets.katana.network/icons/eth.svg",
    name: "Ether",
    address: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
    decimals: 18,
  },
  {
    ticker: "USDC",
    img: "https://assets.katana.network/icons/usdc.svg",
    name: "Vault Bridge USDC",
    address: "0x203A662b0BD271A6ed5a60EdFbd04bFce608FD36",
    decimals: 6,
  },
];

// Export KATANA_TOKENS as TOKENS for backwards compatibility
export const TOKENS = KATANA_TOKENS;
