import React from "react";
import { CircularProgress } from "@mui/material";
import { katanaOHLCUtils } from "@/hooks/sushiswap/katanaChart/useKatanaSwapOHLC";

interface TokenInfoProps {
  tokenOne: any;
  ohlcData: any;
  currentPrice: number | null;
  priceLoading: boolean;
  priceHasError: boolean;
  priceChange: {
    percentage: number;
    absolute: number;
  };
  variant?: "mobile" | "desktop";
}

export const TokenInfo: React.FC<TokenInfoProps> = ({
  tokenOne,
  ohlcData,
  currentPrice,
  priceLoading,
  priceHasError,
  priceChange,
  variant = "mobile",
}) => {
  const isMobile = variant === "mobile";
  const imageSize = isMobile ? "w-6 h-6 md:w-8 md:h-8" : "w-8 h-8";
  const titleSize = isMobile ? "text-base md:text-lg" : "text-lg";
  const priceSize = isMobile ? "text-sm" : "";

  return (
    <div className="flex items-center gap-2 md:gap-3">
      {tokenOne?.img && (
        <img
          src={tokenOne.img}
          alt={tokenOne.ticker}
          className={`${imageSize} rounded-full`}
        />
      )}
      <div>
        <p className={`${titleSize} font-semibold text-white`}>
          {tokenOne?.ticker || "Token"} /{" "}
          {ohlcData.metadata.poolToken0.id.toLowerCase() ===
          tokenOne?.address.toLowerCase()
            ? ohlcData.metadata.poolToken1.symbol
            : ohlcData.metadata.poolToken0.symbol || "Token"}
        </p>
        <div className="flex items-center gap-2">
          <span className={`text-[#00F5E0] font-semibold ${priceSize}`}>
            {priceLoading ? (
              <CircularProgress
                size={isMobile ? 14 : 16}
                sx={{ color: "#00F5E0" }}
              />
            ) : currentPrice ? (
              `$${katanaOHLCUtils.formatPrice(currentPrice)}`
            ) : (
              "$0.00"
            )}
          </span>
          <span
            className={`text-xs ${isMobile ? "md:text-sm" : "text-sm"} ${
              priceChange.percentage >= 0 ? "text-green-400" : "text-red-400"
            }`}
          >
            {priceChange.percentage >= 0 ? "+" : ""}
            {priceChange.percentage.toFixed(2)}%
          </span>
          {priceHasError && (
            <span className="text-xs text-red-400">
              {isMobile ? "Error" : "Price Error"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
