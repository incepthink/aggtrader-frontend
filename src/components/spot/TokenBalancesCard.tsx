// components/TokenBalancesCard.tsx - Refactored
"use client";

import { CircularProgress } from "@mui/material";
import {
  usePortfolioDetailed,
  type PortfolioToken,
} from "@/hooks/usePortfolioDetailed";
import { useAccount } from "wagmi";
import { useState } from "react";
import { useEntryPrices } from "@/hooks/useEntryPrices";
import { useBinancePrices } from "@/hooks/useBinancePrices";
import { calculatePortfolioTotals } from "@/utils/portfolioCalculations";
import { PortfolioHeader } from "./PortfolioHeader";
import { TokenRowDesktop } from "./TokenRowDesktop";
import { TokenCardMobile } from "./TokenCardMobile";

export default function TokenBalancesCard() {
  const { address } = useAccount();
  const { data, isLoading, error, refetch } = usePortfolioDetailed();

  // Filter for only Ethereum mainnet (chain_id: 1) tokens
  const ethereumTokens = data?.filter((token) => token.chain_id === 1) || [];

  const { updateEntryPrice, getEntryPrice, isCustomPrice } = useEntryPrices(
    address,
    ethereumTokens
  );
  const {
    getTokenPrice,
    getTokenChange24h,
    hasPrice,
    isLoading: isPriceLoading,
    error: priceError,
    lastUpdated,
    refresh: refreshPrices,
    unsupportedTokens,
    supportedTokensCount,
    totalTokensCount,
  } = useBinancePrices(ethereumTokens);
  const [isRefetching, setIsRefetching] = useState(false);

  // Handle refetch with loading state
  const handleRefetch = async () => {
    if (isRefetching) return;

    setIsRefetching(true);
    try {
      await refetch();
      refreshPrices(); // Also refresh CoinGecko prices
    } catch (error) {
      console.error("Failed to refetch portfolio data:", error);
    } finally {
      setIsRefetching(false);
    }
  };

  // Helper function to get current price (CoinGecko or fallback to 1inch)
  const getCurrentPrice = (token: PortfolioToken): number => {
    const coinGeckoPrice = getTokenPrice(token);
    return coinGeckoPrice !== null ? coinGeckoPrice : token.price_to_usd;
  };

  // Calculate custom totals with updated prices
  const calculateUpdatedPortfolioTotals = () => {
    if (!ethereumTokens.length) {
      return { customTotalPnL: 0, customTotalROI: 0, customTotalValue: 0 };
    }

    let customTotalPnL = 0;
    let totalInvested = 0;
    let customTotalValue = 0;

    ethereumTokens.forEach((token) => {
      const tokenKey = `${token.chain_id}-${token.contract_address}`;
      const entryPrice = getEntryPrice(tokenKey, token.price_to_usd);
      const currentPrice = getCurrentPrice(token);
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
  };

  const portfolioTotals = calculateUpdatedPortfolioTotals();

  // Wallet not connected state
  if (!address) {
    return (
      <div className="relative mx-auto rounded-xl">
        <div className="relative p-4 sm:p-6 md:p-8 rounded-2xl text-white font-sans">
          <div className="text-center py-8">
            <h2 className="text-xl font-semibold mb-2">Connect Your Wallet</h2>
            <p className="text-gray-400 text-sm">
              Connect your wallet to view your token balances
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
              Failed to load token balances
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
          hasTokens={ethereumTokens.length > 0}
          totals={portfolioTotals}
          onRefetch={handleRefetch}
          priceError={priceError}
          lastPriceUpdate={lastUpdated}
        />

        {/* Content */}
        <div className="w-full">
          {isLoading || isRefetching ? (
            <div className="w-full flex justify-center pb-4">
              <CircularProgress sx={{ color: "primary.main" }} />
            </div>
          ) : ethereumTokens.length > 0 ? (
            <>
              {/* Price Update Status */}
              {priceError && (
                <div className="mb-4 p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
                  <div className="text-red-400 text-sm">
                    Binance API error: {priceError}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    Falling back to 1inch prices
                  </div>
                </div>
              )}

              {unsupportedTokens.length > 0 && (
                <div className="mb-4 p-3 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
                  <div className="text-yellow-400 text-sm">
                    {unsupportedTokens.length} token(s) not available on Binance
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    Using 1inch prices for:{" "}
                    {unsupportedTokens.map((t) => t.symbol).join(", ")}
                  </div>
                </div>
              )}

              {lastUpdated > 0 && (
                <div className="mb-4 flex justify-between items-center text-xs text-gray-400">
                  <span>
                    Binance prices updated:{" "}
                    {new Date(lastUpdated).toLocaleTimeString()}(
                    {supportedTokensCount}/{totalTokensCount} tokens)
                  </span>
                  <span className="flex items-center gap-1">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        isPriceLoading
                          ? "bg-yellow-400 animate-pulse"
                          : "bg-green-400"
                      }`}
                    ></div>
                    {isPriceLoading ? "Updating..." : "Live prices"}
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
                    {ethereumTokens.map((token: PortfolioToken) => {
                      const tokenKey = `${token.chain_id}-${token.contract_address}`;
                      const entryPrice = getEntryPrice(
                        tokenKey,
                        token.price_to_usd
                      );
                      const isCustom = isCustomPrice(tokenKey);
                      const currentPrice = getCurrentPrice(token);
                      const change24h = getTokenChange24h(token);

                      return (
                        <TokenRowDesktop
                          key={tokenKey}
                          token={token}
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
                {ethereumTokens.map((token: PortfolioToken) => {
                  const tokenKey = `${token.chain_id}-${token.contract_address}`;
                  const entryPrice = getEntryPrice(
                    tokenKey,
                    token.price_to_usd
                  );
                  const isCustom = isCustomPrice(tokenKey);
                  const currentPrice = getCurrentPrice(token);
                  const change24h = getTokenChange24h(token);

                  return (
                    <TokenCardMobile
                      key={tokenKey}
                      token={token}
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
                No Ethereum tokens found in your wallet
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
