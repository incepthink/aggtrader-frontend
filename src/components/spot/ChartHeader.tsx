"use client";

import { useSpotStore } from "@/store/spotStore";
import { BACKEND_URL } from "@/utils/constants";
import { useBinancePrices } from "@/hooks/useBinancePrices";
import type { PortfolioToken } from "@/hooks/usePortfolioDetailed";
import axios from "axios";
import React, { useEffect, useMemo, useState } from "react";
import { useMediaQuery, useTheme } from "@mui/material";

function formatUSDCompact(value: number) {
  if (value === null || value === undefined || isNaN(value)) return "$0.00";

  const abs = Math.abs(value);

  let formatted;
  if (abs >= 1_000_000_000) {
    formatted = (value / 1_000_000_000).toFixed(2) + "B";
  } else if (abs >= 1_000_000) {
    formatted = (value / 1_000_000).toFixed(2) + "M";
  } else if (abs >= 1_000) {
    formatted = (value / 1_000).toFixed(2) + "K";
  } else {
    formatted = value.toFixed(2);
  }

  return `$${formatted}`;
}

function formatPrice(value: number) {
  if (value === null || value === undefined || isNaN(value)) return "$0.00";

  // For prices, we want more precision
  if (value >= 1000) {
    return `$${value.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  } else if (value >= 1) {
    return `$${value.toFixed(2)}`;
  } else {
    return `$${value.toFixed(4)}`;
  }
}

// Create a mock token for Binance price fetching
const createTokenFromSpotToken = (spotToken: any): PortfolioToken | null => {
  if (!spotToken) return null;

  return {
    symbol: spotToken.ticker,
    contract_address: spotToken.address,
    chain_id: 1, // Assuming Ethereum mainnet
    amount: 1, // We just need the price, not the value
    name: spotToken.name,
    price_to_usd: 0, // Will be replaced by Binance price
    value_usd: 0,
    abs_profit_usd: 0, // Required by PortfolioToken interface
    roi: 0, // Required by PortfolioToken interface
    status: 1, // Required by PortfolioToken interface
  };
};

export const ChartHeader = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.down("md"));
  const isLargeScreen = useMediaQuery(theme.breakpoints.up("xl"));

  const tokenOne = useSpotStore((state) => state.tokenOne);
  const [fdv, setFdv] = useState(0);
  const [vol, setVol] = useState(0);

  // Create token array for Binance price hook
  const tokensForPrice = useMemo((): PortfolioToken[] => {
    const token = createTokenFromSpotToken(tokenOne);
    return token ? [token] : [];
  }, [tokenOne]);

  // Get Binance prices
  const {
    getTokenPrice,
    getTokenChange24h,
    isLoading: isPriceLoading,
    error: priceError,
    lastUpdated,
    isTokenSupported,
  } = useBinancePrices(tokensForPrice);

  // Get current price and 24h change
  const currentPrice = useMemo(() => {
    if (!tokenOne || tokensForPrice.length === 0) return null;
    return getTokenPrice(tokensForPrice[0]);
  }, [tokenOne, tokensForPrice, getTokenPrice]);

  const change24h = useMemo(() => {
    if (!tokenOne || tokensForPrice.length === 0) return null;
    return getTokenChange24h(tokensForPrice[0]);
  }, [tokenOne, tokensForPrice, getTokenChange24h]);

  const isSupported = useMemo(() => {
    if (!tokenOne || tokensForPrice.length === 0) return false;
    return isTokenSupported(tokensForPrice[0]);
  }, [tokenOne, tokensForPrice, isTokenSupported]);

  useEffect(() => {
    const fetchMetadata = async () => {
      if (!tokenOne) return;
      try {
        const { data } = await axios.get(`${BACKEND_URL}/api/chart/price`, {
          params: { tokenAddress: tokenOne.address },
        });
        setFdv(data.metadata.fdv);
        setVol(data.metadata.vol);
      } catch (error) {
        console.error("ERROR FETCHING METADATA:: ", error);
      }
    };

    fetchMetadata();
  }, [tokenOne]);

  if (!tokenOne) return null;

  return (
    <div className="flex lg:flex-col justify-between flex-row gap-2 p-4 px-6">
      {/* Token Info */}
      <div className="flex items-center gap-2 md:gap-4">
        <div
          className={`${
            isMobile ? "w-8" : isLargeScreen ? "w-16" : "w-12"
          } rounded-full overflow-hidden flex-shrink-0`}
        >
          <img
            src={tokenOne.img}
            alt={tokenOne.ticker}
            className="w-full object-cover"
          />
        </div>
        <p
          className={`${
            isMobile
              ? "text-md"
              : isTablet
              ? "text-lg"
              : isLargeScreen
              ? "text-2xl"
              : "text-xl"
          } font-semibold truncate text-white`}
        >
          {tokenOne.name}
        </p>
      </div>

      {/* Metrics */}
      <div className="flex gap-6 justify-start">
        <div className="flex flex-col gap-1 items-start">
          <p
            className={`${
              isMobile ? "text-xs" : isLargeScreen ? "text-sm" : "text-xs"
            } opacity-80 text-gray-300`}
          >
            PRICE
          </p>
          <p
            className={`${
              isMobile ? "text-sm" : isLargeScreen ? "text-base" : "text-sm"
            } font-medium text-green-400`}
          >
            {currentPrice !== null ? formatPrice(currentPrice) : "$0.00"}
          </p>
        </div>
        <div className="flex flex-col gap-1 items-start">
          <p
            className={`${
              isMobile ? "text-xs" : isLargeScreen ? "text-sm" : "text-xs"
            } opacity-80 text-gray-300`}
          >
            FDV
          </p>
          <p
            className={`${
              isMobile ? "text-sm" : isLargeScreen ? "text-base" : "text-sm"
            } font-medium text-white`}
          >
            {formatUSDCompact(fdv)}
          </p>
        </div>
        <div className="flex flex-col gap-1 items-start">
          <p
            className={`${
              isMobile ? "text-xs" : isLargeScreen ? "text-sm" : "text-xs"
            } opacity-80 text-gray-300`}
          >
            24H VOL
          </p>
          <p
            className={`${
              isMobile ? "text-sm" : isLargeScreen ? "text-base" : "text-sm"
            } font-medium text-white`}
          >
            {formatUSDCompact(vol)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChartHeader;
