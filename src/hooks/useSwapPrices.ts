// hooks/useSwapPrices.ts
import { useState, useCallback, useMemo } from "react";
import axios from "axios";
import type { Address } from "viem";
import type { PriceData, Token } from "@/types/swap.types";
import { useBinancePrices } from "@/hooks/useBinancePrices";
import type { PortfolioToken } from "@/hooks/usePortfolioDetailed";
import {
  createPortfolioTokenFromSwapToken,
  getTokenBinancePrice,
} from "@/utils/swapUtils";
import { BACKEND_URL } from "@/utils/constants";

export const useSwapPrices = (tokenOne: Token, tokenTwo: Token) => {
  const [prices, setPrices] = useState<PriceData | null>(null);
  const [isLoadingPrices, setIsLoadingPrices] = useState(false);

  // Create portfolio tokens for Binance price hook
  const portfolioTokens = useMemo((): PortfolioToken[] => {
    const tokens = [];
    if (tokenOne) tokens.push(createPortfolioTokenFromSwapToken(tokenOne));
    if (tokenTwo) tokens.push(createPortfolioTokenFromSwapToken(tokenTwo));
    return tokens;
  }, [tokenOne, tokenTwo]);

  // Get Binance prices
  const {
    getTokenPrice,
    isLoading: isBinancePriceLoading,
    error: binancePriceError,
  } = useBinancePrices(portfolioTokens);

  // Get individual token prices from Binance
  const tokenOnePrice = useMemo(() => {
    return getTokenBinancePrice(tokenOne, getTokenPrice, portfolioTokens);
  }, [tokenOne, getTokenPrice, portfolioTokens]);

  const tokenTwoPrice = useMemo(() => {
    return getTokenBinancePrice(tokenTwo, getTokenPrice, portfolioTokens);
  }, [tokenTwo, getTokenPrice, portfolioTokens]);

  // Fallback price fetch from backend (for ratio calculation)
  const fetchPrices = useCallback(
    async (one: Address, two: Address, retryCount = 0) => {
      if (retryCount === 0) setIsLoadingPrices(true);

      try {
        const { data } = await axios.get<PriceData>(
          `${BACKEND_URL}/api/tokenPrice`,
          {
            params: { addressOne: one, addressTwo: two },
            timeout: 10000, // 10 second timeout
          }
        );

        // Use Binance prices if available, otherwise fallback to backend prices
        const updatedPrices = {
          ...data.data,
          tokenOne: tokenOnePrice || data.data.tokenOne || 0,
          tokenTwo: tokenTwoPrice || data.data.tokenTwo || 0,
        };

        setPrices(updatedPrices);
        setIsLoadingPrices(false);
      } catch (err) {
        console.error("Price fetch error:", err);

        // Retry logic for mobile/network issues
        if (retryCount < 2) {
          console.log(`Retrying price fetch (attempt ${retryCount + 1})`);
          setTimeout(() => {
            fetchPrices(one, two, retryCount + 1);
          }, 1000 * (retryCount + 1)); // Exponential backoff: 1s, 2s
          return;
        }

        // If backend fails but we have Binance prices, use those
        if (tokenOnePrice || tokenTwoPrice) {
          setPrices({
            ratio:
              tokenOnePrice && tokenTwoPrice
                ? tokenOnePrice / tokenTwoPrice
                : 1,
            tokenOne: tokenOnePrice || 0,
            tokenTwo: tokenTwoPrice || 0,
          });
        }

        setIsLoadingPrices(false);
      }
    },
    [tokenOnePrice, tokenTwoPrice]
  );

  // Update prices when Binance prices change
  useMemo(() => {
    if ((tokenOnePrice || tokenTwoPrice) && prices) {
      const updatedPrices = {
        ...prices,
        tokenOne: tokenOnePrice || prices.tokenOne || 0,
        tokenTwo: tokenTwoPrice || prices.tokenTwo || 0,
      };
      setPrices(updatedPrices);
    }
  }, [tokenOnePrice, tokenTwoPrice]);

  return {
    prices,
    isLoadingPrices: isLoadingPrices || isBinancePriceLoading,
    tokenOnePrice,
    tokenTwoPrice,
    binancePriceError,
    fetchPrices,
  };
};
