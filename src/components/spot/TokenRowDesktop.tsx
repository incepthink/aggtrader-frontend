// components/TokenRowDesktop.tsx
"use client";

import type { PortfolioToken } from "@/hooks/usePortfolioDetailed";
import {
  getTokenLogo,
  formatNumber,
  formatUSD,
  formatPercent,
} from "@/utils/tokenUtils";
import { calculateTokenPnL } from "@/utils/portfolioCalculations";
import { EditablePrice } from "./EditablePrice";

interface TokenRowDesktopProps {
  token: PortfolioToken;
  entryPrice: number;
  currentPrice: number;
  change24h?: number | null;
  isCustomPrice: boolean;
  onPriceChange: (tokenKey: string, price: number) => void;
}

export const TokenRowDesktop: React.FC<TokenRowDesktopProps> = ({
  token,
  entryPrice,
  currentPrice,
  change24h,
  isCustomPrice,
  onPriceChange,
}) => {
  const tokenLogo = getTokenLogo(token.symbol, token.chain_id);
  const tokenKey = `${token.chain_id}-${token.contract_address}`;

  // Use the updated current price for calculations
  const updatedToken = {
    ...token,
    price_to_usd: currentPrice,
    value_usd: currentPrice * token.amount,
  };
  const calculation = calculateTokenPnL(updatedToken, entryPrice);

  return (
    <tr className="hover:bg-white/5 transition-colors duration-200">
      <td className="py-3 border-b border-white/8 last:border-b-0">
        <div className="flex items-center gap-2">
          {tokenLogo ? (
            <img
              src={tokenLogo}
              alt={token.symbol}
              className="w-6 h-6 rounded-full"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = "none";
                const fallback = target.nextElementSibling as HTMLElement;
                if (fallback) fallback.style.display = "flex";
              }}
            />
          ) : null}
          <div
            className="w-6 h-6 rounded-full bg-gradient-to-r from-gray-600 to-gray-800 flex items-center justify-center"
            style={{ display: tokenLogo ? "none" : "flex" }}
          >
            <span className="text-xs font-bold text-white">
              {token.symbol.charAt(0)}
            </span>
          </div>
          <div>
            <div className="font-medium">{token.symbol}</div>
            <div className="text-xs text-gray-400">{token.name}</div>
          </div>
        </div>
      </td>
      <td className="py-3 border-b border-white/8 last:border-b-0 text-right">
        {formatNumber(token.amount)}
      </td>
      <td className="py-3 border-b border-white/8 last:border-b-0 text-center">
        <EditablePrice
          tokenKey={tokenKey}
          currentPrice={entryPrice}
          isCustom={isCustomPrice}
          onPriceChange={(price) => onPriceChange(tokenKey, price)}
        />
      </td>
      <td className="py-3 border-b border-white/8 last:border-b-0 text-center">
        <div className="flex flex-col items-center">
          <span>${currentPrice.toFixed(2)}</span>
          {change24h !== null && change24h !== undefined && (
            <span
              className={`text-xs ${
                change24h >= 0 ? "text-green-400" : "text-red-400"
              }`}
            >
              {change24h >= 0 ? "+" : ""}
              {change24h.toFixed(2)}%
            </span>
          )}
        </div>
      </td>
      <td className="py-3 border-b border-white/8 last:border-b-0 text-center font-medium">
        {formatUSD(updatedToken.value_usd)}
      </td>
      <td
        className={`py-3 border-b border-white/8 last:border-b-0 text-center font-medium ${
          calculation.customPnL >= 0 ? "text-green-400" : "text-red-400"
        }`}
      >
        {calculation.customPnL >= 0 ? "+" : ""}
        {formatUSD(calculation.customPnL)}
      </td>
      <td
        className={`py-3 border-b border-white/8 last:border-b-0 text-center font-medium ${
          calculation.customROI >= 0 ? "text-green-400" : "text-red-400"
        }`}
      >
        {calculation.customROI >= 0 ? "+" : ""}
        {formatPercent(calculation.customROI)}
      </td>
    </tr>
  );
};
