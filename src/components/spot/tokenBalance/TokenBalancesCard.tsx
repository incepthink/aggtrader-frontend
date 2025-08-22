// components/TokenBalancesCard.tsx - Fixed with proper entry price initialization
"use client";

import { CircularProgress } from "@mui/material";
import {
  usePortfolioDetailed,
  type PortfolioToken,
} from "@/hooks/usePortfolioDetailed";
import {
  useKatanaPortfolio,
  type KatanaPortfolioToken,
} from "@/hooks/useKatanaPortfolio";
import { useAccount } from "wagmi";
import { useState, useMemo, useEffect } from "react";
import { useEntryPrices } from "@/hooks/sushiswap/useEntryPrices";
import { useBatchPriceBackend } from "@/hooks/sushiswap/usePriceBackend";
import { useSpotStore } from "@/store/spotStore";
import { calculatePortfolioTotals } from "@/utils/spot/portfolioCalculations";
import { PortfolioHeader } from "./PortfolioHeader";
import { TokenRowDesktop } from "./TokenRowDesktop";
import { TokenCardMobile } from "./TokenCardMobile";
import { Address } from "viem";

// Combined token type for both Katana and other chains
type CombinedToken = (PortfolioToken | KatanaPortfolioToken) & {
  amount: number;
  price_to_usd: number;
  value_usd: number;
  symbol: string;
  name: string;
  chain_id: number;
  contract_address?: string;
  address?: string;
};

export default function TokenBalancesCard() {
  const { address } = useAccount();
  const { chainId } = useSpotStore(); // Get chainId from spotStore
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

  // Constants for ETH handling
  const WETH_ADDRESS = "0xC02aaA39b223FE8d0A0e5C4F27eAD9083C756Cc2";
  const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
  const ETH_PLACEHOLDER = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";

  const isNativeEth = (token: PortfolioToken | KatanaPortfolioToken) => {
    const tokenChainId = (token as any).chain_id;
    const addr =
      ((token as any).contract_address as string | undefined) ??
      ((token as any).address as string | undefined) ??
      "";
    const sym = (token as any).symbol?.toUpperCase?.();

    return (
      tokenChainId === 1 &&
      (!addr ||
        addr === ZERO_ADDRESS ||
        addr.toLowerCase() === ETH_PLACEHOLDER ||
        sym === "ETH")
    );
  };

  // Convert rawData to PortfolioToken format for useEntryPrices
  const entryPricesData = useMemo(() => {
    if (!rawData) return [];

    return rawData.map((token): PortfolioToken => {
      if (isKatana) {
        const katanaToken = token as KatanaPortfolioToken;
        return {
          symbol: katanaToken.symbol,
          name: katanaToken.name,
          contract_address: katanaToken.address,
          amount: katanaToken.balance,
          price_to_usd: katanaToken.price,
          value_usd: katanaToken.value,
          chain_id: katanaToken.chain_id,
          // Add other required PortfolioToken properties with defaults
          token_address: katanaToken.address,
          contract_name: katanaToken.name,
          contract_ticker_symbol: katanaToken.symbol,
          contract_decimals: katanaToken.decimals,
          supports_erc: null,
          logo_url: katanaToken.logoUrl || null,
          // Add missing properties
          abs_profit_usd: 0, // Will be calculated later
          roi: 0, // Will be calculated later
          status: "success", // Default status
        } as unknown as PortfolioToken;
      } else {
        return token as PortfolioToken;
      }
    });
  }, [rawData, isKatana]);

  const { updateEntryPrice, getEntryPrice, isCustomPrice } = useEntryPrices(
    address,
    entryPricesData
  );

  // Prepare token pairs - map native ETH -> WETH, de-dup addresses
  const tokenPairs = useMemo(() => {
    if (!rawData) return [];
    const uniqueAddresses = new Set<string>();
    const pairs: Array<{ addressOne: `0x${string}`; chainId: 1 | 747474 }> = [];

    rawData.forEach((token) => {
      let tokenAddress: string | undefined = isKatana
        ? (token as KatanaPortfolioToken).address
        : (token as PortfolioToken).contract_address;

      // Map native ETH (and 0xeeee / zero addr / missing addr on mainnet) to WETH
      if (!isKatana && isNativeEth(token)) {
        tokenAddress = WETH_ADDRESS;
      } else if (tokenAddress?.toLowerCase() === ETH_PLACEHOLDER) {
        tokenAddress = WETH_ADDRESS;
      }

      if (tokenAddress && tokenAddress.startsWith("0x")) {
        const key = tokenAddress.toLowerCase();
        if (!uniqueAddresses.has(key)) {
          uniqueAddresses.add(key);
          const cid = (chainId === 1 ? 1 : 747474) as 1 | 747474;
          pairs.push({
            addressOne: tokenAddress as `0x${string}`,
            chainId: cid,
          });
        }
      }
    });

    return pairs;
  }, [rawData, isKatana, chainId]);

  // Use batch price backend
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

  const [isRefetching, setIsRefetching] = useState(false);
  const [entryPricesInitialized, setEntryPricesInitialized] = useState(false);

  // Handle refetch with loading state
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

  // Create price lookup map
  const priceMap = useMemo(() => {
    if (!priceData) return {};
    const map: Record<string, number> = {};
    tokenPairs.forEach((pair, index) => {
      const result = priceData[index];
      if (result?.success && result.data !== null) {
        map[pair.addressOne.toLowerCase()] = result.data;
      }
    });
    return map;
  }, [priceData, tokenPairs]);

  // Get price for any token (handles native ETH -> WETH mapping)
  const getTokenPrice = (
    tokenAddress: string | undefined,
    token?: CombinedToken
  ): number | null => {
    // If ETH on mainnet, always use WETH price
    if (!isKatana && token && isNativeEth(token as any)) {
      return priceMap[WETH_ADDRESS.toLowerCase()] ?? null;
    }
    if (!tokenAddress) return null;
    const lower = tokenAddress.toLowerCase();
    if (lower === ETH_PLACEHOLDER || tokenAddress === ZERO_ADDRESS) {
      return priceMap[WETH_ADDRESS.toLowerCase()] ?? null;
    }
    return priceMap[lower] ?? null;
  };

  // Helper function to get current price (Sushi API or fallback)
  const getCurrentPrice = (token: CombinedToken): number => {
    const originalTokenAddress = isKatana
      ? (token as KatanaPortfolioToken).address
      : (token as PortfolioToken).contract_address;

    const realtimePrice = getTokenPrice(originalTokenAddress, token);
    const fallbackPrice = isKatana
      ? (token as KatanaPortfolioToken).price
      : (token as PortfolioToken).price_to_usd;

    return realtimePrice ?? fallbackPrice;
  };

  // Normalize data format with real-time prices
  const normalizedData: CombinedToken[] = rawData
    ? rawData.map((token): CombinedToken => {
        const originalTokenAddress = isKatana
          ? (token as KatanaPortfolioToken).address
          : (token as PortfolioToken).contract_address;

        const realtimePrice = getTokenPrice(originalTokenAddress, token as any);
        const fallbackPrice = isKatana
          ? (token as KatanaPortfolioToken).price
          : (token as PortfolioToken).price_to_usd;

        const finalPrice = realtimePrice ?? fallbackPrice;

        if (isKatana) {
          const t = token as KatanaPortfolioToken;
          const value = t.balance * finalPrice;
          return {
            ...t,
            amount: t.balance,
            price_to_usd: finalPrice,
            value_usd: value,
            contract_address: t.address,
          };
        } else {
          const t = token as PortfolioToken;
          const isEth = isNativeEth(t);
          const value = t.amount * finalPrice;
          return {
            ...t,
            // Force native ETH to present with WETH address so downstream checks see it as LIVE
            address: isEth ? WETH_ADDRESS : t.contract_address,
            price_to_usd: finalPrice,
            value_usd: value,
          };
        }
      })
    : [];

  // Initialize entry prices when data is available and prices are loaded
  useEffect(() => {
    if (
      normalizedData.length > 0 && 
      !entryPricesInitialized && 
      !isPriceLoading &&
      address
    ) {
      console.log('Initializing entry prices for first time load...');
      
      // Initialize entry prices with current prices for tokens that don't have custom entry prices
      normalizedData.forEach((token) => {
        const tokenKey = `${token.chain_id}-${token.contract_address || token.address}`;
        const currentEntryPrice = getEntryPrice(tokenKey, token.price_to_usd);
        
        // If the entry price equals the current price, it means it's using the fallback
        // and we haven't set a custom entry price yet
        if (!isCustomPrice(tokenKey)) {
          console.log(`Setting initial entry price for ${token.symbol}: $${token.price_to_usd}`);
          updateEntryPrice(tokenKey, token.price_to_usd);
        }
      });
      
      setEntryPricesInitialized(true);
    }
  }, [normalizedData, entryPricesInitialized, isPriceLoading, address, getEntryPrice, isCustomPrice, updateEntryPrice]);

  // Reset initialization flag when address changes
  useEffect(() => {
    setEntryPricesInitialized(false);
  }, [address, chainId]);

  // Calculate price change (placeholder - would need historical data)
  const getTokenChange24h = (token: CombinedToken): number | null => {
    // Note: Sushi API doesn't provide 24h change in the current endpoint
    return null;
  };

  // Calculate custom totals with updated prices
  const calculateUpdatedPortfolioTotals = () => {
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

      // Add safety checks to prevent NaN values
      if (isFinite(tokenPnL) && isFinite(investedValue) && isFinite(currentValue)) {
        customTotalPnL += tokenPnL;
        totalInvested += investedValue;
        customTotalValue += currentValue;
      } else {
        console.warn(`Invalid calculation for ${token.symbol}:`, {
          entryPrice,
          currentPrice,
          amount: token.amount,
          tokenPnL,
          investedValue,
          currentValue
        });
      }
    });

    const customTotalROI =
      totalInvested > 0 ? customTotalPnL / totalInvested : 0;
    
    return { 
      customTotalPnL: isFinite(customTotalPnL) ? customTotalPnL : 0, 
      customTotalROI: isFinite(customTotalROI) ? customTotalROI : 0, 
      customTotalValue: isFinite(customTotalValue) ? customTotalValue : 0 
    };
  };

  const portfolioTotals = calculateUpdatedPortfolioTotals();

  // Calculate stats about price coverage
  const priceStats = useMemo(() => {
    const supportedTokens = successfulResults.length;
    const unsupportedTokens = failedResults.length;
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

  // Helper to get chain name
  const getChainName = (chainId: number) => {
    switch (chainId) {
      case 1:
        return "Ethereum";
      case 747474:
        return "Katana";
      default:
        return `Chain ${chainId}`;
    }
  };

  // Wallet not connected state
  if (!address) {
    return (
      <div className="relative mx-auto rounded-xl">
        <div className="relative p-4 sm:p-6 md:p-8 rounded-2xl text-white font-sans">
          <div className="text-center py-8">
            <h2 className="text-xl font-semibold mb-2">Connect Your Wallet</h2>
            <p className="text-gray-400 text-sm">
              Connect your wallet to view your token balances and P&L
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="relative mx-auto rounded-xl">
        <div className="relative p-4 sm:p-6 md:p-8 rounded-2xl text-white font-sans">
          <PortfolioHeader
            isRefetching={isRefetching}
            isLoading={isLoading}
            hasTokens={false}
            totals={portfolioTotals}
            onRefetch={handleRefetch}
          />
          <div className="text-center py-8">
            <div className="text-red-400 text-sm">
              Failed to load portfolio data:{" "}
              {typeof error === "string" ? error : "Unknown error"}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative mx-auto rounded-xl">
      <div className="relative p-4 sm:p-6 md:p-8 rounded-2xl text-white font-sans">
        <PortfolioHeader
          isRefetching={isRefetching || isPriceLoading}
          isLoading={isLoading}
          hasTokens={normalizedData.length > 0}
          totals={portfolioTotals}
          onRefetch={handleRefetch}
          priceError={priceError?.message}
          lastPriceUpdate={priceStats.lastUpdated}
        />

        {/* Chain Indicator */}
        <div className="mb-4">
          <div className="text-sm text-gray-400 flex items-center gap-2">
            {/* <span>Showing {getChainName(chainId)} tokens</span> */}
            {isPriceLoading && (
              <span className="text-yellow-400 text-xs">
                • Updating prices...
              </span>
            )}
            {priceError && (
              <span className="text-red-400 text-xs">• Price fetch error</span>
            )}
            {!entryPricesInitialized && normalizedData.length > 0 && (
              <span className="text-blue-400 text-xs">
                • Initializing entry prices...
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="w-full">
          {isLoading || isRefetching ? (
            <div className="w-full flex justify-center pb-4">
              <CircularProgress sx={{ color: "primary.main" }} />
            </div>
          ) : normalizedData.length > 0 ? (
            <>
              {/* Price Update Status */}
              {priceError && (
                <div className="mb-4 p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
                  <div className="text-red-400 text-sm">
                    Sushi API error: {priceError.message}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    Falling back to fallback prices
                  </div>
                </div>
              )}

              {priceStats.unsupportedTokens.length > 0 && (
                <div className="mb-4 p-3 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
                  <div className="text-yellow-400 text-sm">
                    {priceStats.unsupportedTokens.length} token(s) not available
                    on Sushi API
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    Using fallback prices for:{" "}
                    {priceStats.unsupportedTokens.join(", ")}
                  </div>
                </div>
              )}

              {priceStats.lastUpdated > 0 && (
                <div className="mb-4 flex justify-between items-center text-xs text-gray-400">
                  <span>
                    Sushi prices updated:{" "}
                    {new Date(priceStats.lastUpdated).toLocaleTimeString()} (
                    {priceStats.supportedTokensCount}/
                    {priceStats.totalTokensCount} tokens)
                  </span>
                  <span className="flex items-center gap-1">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        isPriceLoading
                          ? "bg-yellow-400 animate-pulse"
                          : entryPricesInitialized
                          ? "bg-green-400"
                          : "bg-blue-400 animate-pulse"
                      }`}
                    ></div>
                    {isPriceLoading ? "Updating..." : entryPricesInitialized ? "Live prices" : "Initializing..."}
                  </span>
                </div>
              )}

              {/* Desktop Table View */}
              <div className="hidden md:block">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="text-base font-semibold">
                      <th className="text-left font-medium pb-3 text-cyan-300">
                        Token
                      </th>
                      <th className="text-right font-medium pb-3 text-cyan-300">
                        Balance
                      </th>
                      <th className="text-center font-medium pb-3 text-cyan-300">
                        Entry Price
                        <span className="text-white text-[10px] ml-2">
                          Edit
                        </span>
                      </th>
                      <th className="text-center font-medium pb-3 text-cyan-300">
                        Current Price
                      </th>
                      <th className="text-center font-medium pb-3 text-cyan-300">
                        Value
                      </th>
                      <th className="text-center font-medium pb-3 text-cyan-300">
                        P&L
                      </th>
                      <th className="text-center font-medium pb-3 text-cyan-300">
                        ROI
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {normalizedData.map((token: CombinedToken) => {
                      const tokenKey = `${token.chain_id}-${
                        token.contract_address || token.address
                      }`;
                      const entryPrice = getEntryPrice(
                        tokenKey,
                        token.price_to_usd
                      );
                      const isCustom = isCustomPrice(tokenKey);
                      const currentPrice = token.price_to_usd;
                      const change24h = getTokenChange24h(token);

                      return (
                        <TokenRowDesktop
                          key={tokenKey}
                          token={token as any} // Cast to match expected type
                          entryPrice={entryPrice}
                          currentPrice={currentPrice}
                          change24h={change24h}
                          isCustomPrice={isCustom}
                          onPriceChange={updateEntryPrice}
                        />
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="block md:hidden space-y-3">
                {normalizedData.map((token: CombinedToken) => {
                  const tokenKey = `${token.chain_id}-${
                    token.contract_address || token.address
                  }`;
                  const entryPrice = getEntryPrice(
                    tokenKey,
                    token.price_to_usd
                  );
                  const isCustom = isCustomPrice(tokenKey);
                  const currentPrice = token.price_to_usd;
                  const change24h = getTokenChange24h(token);

                  return (
                    <TokenCardMobile
                      key={tokenKey}
                      token={token as any} // Cast to match expected type
                      entryPrice={entryPrice}
                      currentPrice={currentPrice}
                      change24h={change24h}
                      isCustomPrice={isCustom}
                      onPriceChange={updateEntryPrice}
                    />
                  );
                })}
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-400 text-sm">
                No {getChainName(chainId)} tokens found in your wallet
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}