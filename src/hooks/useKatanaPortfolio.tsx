import { useState, useEffect, useMemo, useCallback } from "react";
import { useKatanaBalance } from "./useKatanaBalance";
import { getTokenInfoBySymbol } from "@/utils/katanaTokens";
import { useBatchPriceBackend } from "./sushiswap/usePriceBackend";
import { Address } from "viem";

export interface KatanaPortfolioToken {
  symbol: string;
  name: string;
  address: string;
  balance: number;
  price: number;
  value: number;
  logoUrl?: string;
  decimals: number;
  chain_id: number;
}

export interface KatanaPortfolioData {
  tokens: KatanaPortfolioToken[];
  totalValue: number;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useKatanaPortfolio(
  address: string | null
): KatanaPortfolioData {
  const {
    balances,
    loading: balancesLoading,
    error: balancesError,
    refetch: refetchBalances,
  } = useKatanaBalance(address);
  console.log("KATANA BALANCES", balances);

  const [portfolioTokens, setPortfolioTokens] = useState<
    KatanaPortfolioToken[]
  >([]);

  // Prepare token addresses for batch price fetching
  const tokenPairs = useMemo(() => {
    return balances
      .map((balance) => {
        const tokenInfo = getTokenInfoBySymbol(balance.symbol);
        if (!tokenInfo) {
          console.warn(`Token info not found for symbol: ${balance.symbol}`);
          return null;
        }

        // For native ETH, use wETH address for price lookup
        const priceAddress =
          balance.symbol === "ETH"
            ? "0xEE7D8BCFb72bC1880D0Cf19822eB0A2e6577aB62"
            : tokenInfo.address;

        return {
          addressOne: priceAddress as Address,
          chainId: 747474 as const,
          symbol: balance.symbol,
          balance: balance.balance,
          tokenInfo,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  }, [balances]);

  // Fetch all prices using batch hook
  const {
    data: priceResults,
    isLoading: pricesLoading,
    error: pricesError,
    refetch: refetchPrices,
  } = useBatchPriceBackend(
    tokenPairs.map(({ addressOne, chainId }) => ({ addressOne, chainId })),
    {
      enabled: tokenPairs.length > 0,
      refetchInterval: 30000, // 30 seconds
      staleTime: 15000, // 15 seconds
    }
  );

  // Process balances and prices into portfolio tokens
  useEffect(() => {
    if (!balances.length) {
      setPortfolioTokens([]);
      return;
    }

    if (!priceResults) {
      return;
    }

    const processedTokens = tokenPairs
      .map((tokenPair, index) => {
        const priceResult = priceResults[index];
        const price = priceResult?.success ? priceResult.data || 0 : 0;

        if (priceResult && !priceResult.success) {
          console.error(
            `Error fetching price for ${tokenPair.symbol}:`,
            priceResult.error
          );
        }

        console.log("PRICE", tokenPair.symbol, price);

        const balanceNum = parseFloat(tokenPair.balance);

        return {
          symbol: tokenPair.symbol,
          name: tokenPair.tokenInfo.name,
          address: tokenPair.tokenInfo.address || tokenPair.addressOne,
          balance: balanceNum,
          price,
          value: balanceNum * price,
          logoUrl: tokenPair.tokenInfo.logoUrl,
          decimals: tokenPair.tokenInfo.decimals,
          chain_id: 747474,
        } as KatanaPortfolioToken;
      })
      .filter((token) => token.balance > 0); // Filter out tokens with zero balance

    setPortfolioTokens(processedTokens);
  }, [balances, priceResults, tokenPairs]);

  // Refresh function that triggers both balance and price refetch
  const refresh = useCallback(() => {
    if (refetchBalances) {
      refetchBalances();
    }
    refetchPrices();
  }, [refetchBalances, refetchPrices]);

  const totalValue = useMemo(() => {
    return portfolioTokens.reduce((total, token) => total + token.value, 0);
  }, [portfolioTokens]);

  const isLoading = balancesLoading || pricesLoading;
  const error = balancesError || (pricesError ? String(pricesError) : null);

  return {
    tokens: portfolioTokens,
    totalValue,
    isLoading,
    error,
    refresh,
  };
}
