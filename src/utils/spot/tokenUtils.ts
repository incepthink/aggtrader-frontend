// utils/tokenUtils.ts
export const getTokenLogo = (symbol: string, chainId: number) => {
  const symbolUpper = symbol.toUpperCase();
  switch (symbolUpper) {
    case "ETH":
      return "https://cdn.moralis.io/eth/0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee.png";
    case "USDC":
      return "/logos/usdc.png";
    case "USDT":
      return "https://cdn.moralis.io/eth/0xdac17f958d2ee523a2206206994597c13d831ec7.png";
    case "WETH":
      return "/logos/weth.png";
    case "WBTC":
      return "/logos/wbtc.png";
    case "LINK":
      return "https://tokens.1inch.io/0x514910771af9ca656af840dff83e8264ecf986ca.png";
    default:
      return null;
  }
};

export const formatNumber = (value: number | string) => {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (num >= 1000000) {
    return (num / 1000000).toFixed(2) + "M";
  } else if (num >= 1000) {
    return (num / 1000).toFixed(2) + "K";
  } else if (num >= 1) {
    return num.toFixed(6);
  } else {
    return num.toFixed(8);
  }
};

export const formatUSD = (value: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

export const formatPercent = (value: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "percent",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};
