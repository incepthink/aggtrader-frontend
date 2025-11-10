// hooks/usePortfolioData.ts
"use client";

import { useMemo, useState } from "react";
import { useAccount } from "wagmi";
import { usePortfolioDetailed } from "@/hooks/usePortfolioDetailed";
import { useKatanaPortfolio } from "@/hooks/useKatanaPortfolio";
import { useEntryPrices } from "@/hooks/sushiswap/useEntryPrices";
import { useBatchPriceBackend } from "@/hooks/sushiswap/usePriceBackend";
import { useSpotStore } from "@/store/spotStore";
import {
  convertToPortfolioTokenFormat,
  createTokenPairs,
  createPriceMap,
  normalizeTokenData,
} from "@/utils/portfolio/portfolioHelpers";
import type { CombinedToken, PriceStats } from "@/types/portfolio";

export const usePortfolioData = () => {
  const { address } = useAccount();
  const { chainId } = useSpotStore();
  const [isRefetching, setIsRefetching] = useState(false);

  // Multi-chain data
  const {
    data: multiChainData,
    isLoading: multiChainLoading,
    error: multiChainError,
    refetch: refetchMultiChain,
  } = usePortfolioDetailed();

  // Katana portfolio data
  const {
    tokens: katanaTokens,
    totalValue: katanaTotalValue,
    isLoading: katanaLoading,
    error: katanaError,
    refresh: refetchKatana,
  } = useKatanaPortfolio(address || null);

  const isKatana = chainId === 747474;

  // Filter multi-chain data by connected chain ID
  const filteredMultiChainData =
    multiChainData?.filter((token) => token.chain_id === chainId) || [];

  // Determine which data to use
  const rawData = isKatana ? katanaTokens : filteredMultiChainData;
  const isLoading = isKatana ? katanaLoading : multiChainLoading;
  const error = isKatana ? katanaError : multiChainError;

  // Convert to PortfolioToken format for entry prices
  const entryPricesData = useMemo(
    () => convertToPortfolioTokenFormat(rawData || [], isKatana),
    [rawData, isKatana]
  );

  // Entry prices hook
  const { updateEntryPrice, getEntryPrice, isCustomPrice } = useEntryPrices(
    address,
    entryPricesData
  );

  // Create token pairs for price fetching
  const tokenPairs = useMemo(
    () => createTokenPairs(rawData || [], isKatana, chainId),
    [rawData, isKatana, chainId]
  );

  // Fetch batch prices
  const {
    data: priceData,
    isLoading: isPriceLoading,
    error: priceError,
    refetch: refreshPrices,
    successfulResults,
    failedResults,
  } = useBatchPriceBackend(tokenPairs, {
    enabled: Boolean(rawData && rawData.length > 0),
    refetchInterval: 30000, // 30 seconds
    staleTime: 15000, // 15 seconds
  });

  // Create price lookup map
  const priceMap = useMemo(
    () => createPriceMap(priceData, tokenPairs),
    [priceData, tokenPairs]
  );

  // Normalize data with real-time prices
  const normalizedData: CombinedToken[] = useMemo(
    () => normalizeTokenData(rawData || [], isKatana, priceMap),
    [rawData, isKatana, priceMap]
  );

  // Calculate price stats
  const priceStats: PriceStats = useMemo(() => {
    const supportedTokens = successfulResults.length;
    const totalTokens = normalizedData.length;
    const lastUpdated = Date.now();

    const unsupportedTokensList = failedResults.map((result) => {
      const token = normalizedData.find(
        (t) =>
          (t.contract_address || t.address)?.toLowerCase() ===
          result.pair.addressOne.toLowerCase()
      );
      return token?.symbol || result.pair.addressOne.slice(0, 8);
    });

    return {
      supportedTokensCount: supportedTokens,
      unsupportedTokens: unsupportedTokensList,
      totalTokensCount: totalTokens,
      lastUpdated,
    };
  }, [successfulResults, failedResults, normalizedData]);

  // Calculate portfolio totals
  const portfolioTotals = useMemo(() => {
    if (!normalizedData.length) {
      return { customTotalPnL: 0, customTotalROI: 0, customTotalValue: 0 };
    }

    let customTotalPnL = 0;
    let totalInvested = 0;
    let customTotalValue = 0;

    normalizedData.forEach((token) => {
      const tokenKey = `${token.chain_id}-${
        token.contract_address || token.address
      }`;
      const entryPrice = getEntryPrice(tokenKey, token.price_to_usd);
      const currentPrice = token.price_to_usd;
      const currentValue = currentPrice * token.amount;
      const investedValue = entryPrice * token.amount;
      const tokenPnL = currentValue - investedValue;

      customTotalPnL += tokenPnL;
      totalInvested += investedValue;
      customTotalValue += currentValue;
    });

    const customTotalROI =
      totalInvested > 0 ? customTotalPnL / totalInvested : 0;
    
    return { customTotalPnL, customTotalROI, customTotalValue };
  }, [normalizedData, getEntryPrice]);

  // Handle refetch
  const handleRefetch = async () => {
    if (isRefetching) return;

    setIsRefetching(true);
    try {
      if (isKatana) {
        refetchKatana();
      } else {
        await refetchMultiChain();
      }
      refreshPrices();
    } catch (error) {
      console.error("Failed to refetch portfolio data:", error);
    } finally {
      setIsRefetching(false);
    }
  };

  return {
    // Data
    normalizedData,
    portfolioTotals,
    priceStats,
    
    // Loading states
    isLoading,
    isPriceLoading,
    isRefetching,
    
    // Errors
    error,
    priceError,
    
    // Actions
    handleRefetch,
    
    // Entry price functions
    updateEntryPrice,
    getEntryPrice,
    isCustomPrice,
    
    // Metadata
    address,
    chainId,
    isKatana,
  };
};