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

interface TokenCardMobileProps {
  token: PortfolioToken;
  entryPrice: number;
  currentPrice: number;
  change24h?: number | null;
  isCustomPrice: boolean;
  onPriceChange: (tokenKey: string, price: number) => void;
}

export const TokenCardMobile: React.FC<TokenCardMobileProps> = ({
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
    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
      <div className="flex items-center gap-2 mb-6">
        {tokenLogo ? (
          <img
            src={tokenLogo}
            alt={token.symbol}
            className="w-8 h-8 rounded-full"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = "none";
              const fallback = target.nextElementSibling as HTMLElement;
              if (fallback) fallback.style.display = "flex";
            }}
          />
        ) : null}
        <div
          className="w-8 h-8 rounded-full bg-gradient-to-r from-gray-600 to-gray-800 flex items-center justify-center"
          style={{ display: tokenLogo ? "none" : "flex" }}
        >
          <span className="text-sm font-bold text-white">
            {token.symbol.charAt(0)}
          </span>
        </div>
        <div className="flex-1">
          <div className="font-semibold text-base">{token.symbol}</div>
          <div className="text-sm text-gray-400">{token.name}</div>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold">
            {formatUSD(updatedToken.value_usd)}
          </div>
          <div
            className={`text-sm font-medium ${
              calculation.customPnL >= 0 ? "text-green-400" : "text-red-400"
            }`}
          >
            {calculation.customPnL >= 0 ? "+" : ""}
            {formatUSD(calculation.customPnL)}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <div className="text-cyan-300 text-xs mb-1">Balance</div>
          <div className="font-medium text-white">
            {formatNumber(token.amount)}
          </div>
        </div>
        <div>
          <div className="text-cyan-300 text-xs mb-1">Current Price</div>
          <div className="font-medium text-white">
            <div>${currentPrice.toFixed(2)}</div>
            {change24h !== null && change24h !== undefined && (
              <div
                className={`text-xs ${
                  change24h >= 0 ? "text-green-400" : "text-red-400"
                }`}
              >
                {change24h >= 0 ? "+" : ""}
                {change24h.toFixed(2)}%
              </div>
            )}
          </div>
        </div>
        <div>
          <div className="text-cyan-300 text-xs mb-1">Entry Price</div>
          <div className="font-medium text-white flex justify-start">
            <EditablePrice
              tokenKey={tokenKey}
              currentPrice={entryPrice}
              isCustom={isCustomPrice}
              onPriceChange={(price) => onPriceChange(tokenKey, price)}
            />
          </div>
        </div>
        <div>
          <div className="text-cyan-300 text-xs mb-1">ROI</div>
          <div
            className={`font-medium ${
              calculation.customROI >= 0 ? "text-green-400" : "text-red-400"
            }`}
          >
            {calculation.customROI >= 0 ? "+" : ""}
            {formatPercent(calculation.customROI)}
          </div>
        </div>
      </div>
    </div>
  );
};
