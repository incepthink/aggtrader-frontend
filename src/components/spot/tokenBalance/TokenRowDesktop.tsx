// components/spot/tokenBalance/TokenRowDesktop.tsx
"use client";

import { useState } from "react";
import { IconButton, Tooltip } from "@mui/material";
import ShareIcon from "@mui/icons-material/Share";
import type { PortfolioToken } from "@/hooks/usePortfolioDetailed";
import {
  getTokenLogo,
  formatNumber,
  formatUSD,
  formatPercent,
} from "@/utils/spot/tokenUtils";
import { calculateTokenPnL } from "@/utils/spot/portfolioCalculations";
import { EditablePrice } from "./EditablePrice";
import { ShareTokenModal } from "./ShareTokenModal";
import { ReferralResponse } from "@/hooks/useUserReferralData";

interface TokenRowDesktopProps {
  token: PortfolioToken;
  entryPrice: number;
  currentPrice: number;
  change24h?: number | null;
  isCustomPrice: boolean;
  onPriceChange: (tokenKey: string, price: number) => void;
  referralData: ReferralResponse;
}

export const TokenRowDesktop: React.FC<TokenRowDesktopProps> = ({
  token,
  entryPrice,
  currentPrice,
  change24h,
  isCustomPrice,
  onPriceChange,
  referralData,
}) => {
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const tokenLogo = getTokenLogo(token.symbol, token.chain_id);
  const tokenKey = `${token.chain_id}-${token.contract_address}`;

  const updatedToken = {
    ...token,
    price_to_usd: currentPrice,
    value_usd: currentPrice * token.amount,
  };
  const calculation = calculateTokenPnL(updatedToken, entryPrice);

  return (
    <>
      <tr className="border-b border-teal-900/20 hover:bg-teal-900/10 transition-colors">
        <td className="px-4 py-4 text-sm text-gray-200 text-left">
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
        <td className="px-4 py-4 text-sm text-gray-200 text-right">
          {formatNumber(token.amount)}
        </td>
        <td className="px-4 py-4 text-sm text-gray-200 text-center">
          <EditablePrice
            tokenKey={tokenKey}
            currentPrice={entryPrice}
            isCustom={isCustomPrice}
            onPriceChange={(price) => onPriceChange(tokenKey, price)}
          />
        </td>
        <td className="px-4 py-4 text-sm text-gray-200 text-center">
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
        <td className="px-4 py-4 text-sm text-gray-200 text-center font-medium">
          {formatUSD(updatedToken.value_usd)}
        </td>
        <td
          className={`px-4 py-4 text-sm text-center font-medium ${
            calculation.customPnL >= 0 ? "text-green-400" : "text-red-400"
          }`}
        >
          {calculation.customPnL >= 0 ? "+" : ""}
          {formatUSD(calculation.customPnL)}
        </td>
        <td
          className={`px-4 py-4 text-sm text-center font-medium ${
            calculation.customROI >= 0 ? "text-green-400" : "text-red-400"
          }`}
        >
          {calculation.customROI >= 0 ? "+" : ""}
          {formatPercent(calculation.customROI)}
        </td>
        <td className="px-4 py-4 text-sm text-gray-200 text-center">
          <Tooltip title="Share Trade" arrow>
            <IconButton
              onClick={() => setShareModalOpen(true)}
              size="small"
              sx={{
                color: "rgba(0, 245, 224, 0.7)",
                "&:hover": {
                  color: "#00f5e0",
                  backgroundColor: "rgba(0, 245, 224, 0.1)",
                },
              }}
            >
              <ShareIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </td>
      </tr>

      <ShareTokenModal
        referralData={referralData}
        open={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        token={updatedToken as any}
        entryPrice={entryPrice}
        currentPrice={currentPrice}
        pnl={calculation.customPnL}
        roi={calculation.customROI}
      />
    </>
  );
};
