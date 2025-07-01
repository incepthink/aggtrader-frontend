export interface TokenInfo {
  symbol: string;
  address: string;
  decimals: number;
  name: string;
  logo: string;
}

export const TOKENS: TokenInfo[] = [
  {
    symbol: "WETH",
    // conventional placeholder for native ETH (use 0x0 if your lib expects that)
    address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    decimals: 18,
    name: "Wrapped Ether",
    logo: "/logos/weth.png",
  },
  {
    symbol: "WBTC",
    address: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
    decimals: 8,
    name: "Wrapped Bitcoin",
    logo: "/logos/wbtc.png",
  },
  {
    symbol: "MATIC",
    address: "0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0",
    decimals: 18,
    name: "Matic Token",
    logo: "/logos/matic.png",
  },
  {
    symbol: "rETH",
    address: "0xae78736cd615f374d3085123a210448e74fc6393",
    decimals: 18,
    name: "Rocket Pool ETH",
    logo: "/logos/reth.png",
  },
];
