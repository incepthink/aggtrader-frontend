"use client";

import React, { useState, useMemo } from "react";
import { useDerivedStateTwap } from "@/store/limit-order/derivedstate-twap-provider";
import { formatUnits } from "viem/utils";
import { useAccount, useBalance } from "wagmi";
import { LimitTokenSelectionModal } from "./LimitTokenSelectionModal";
import type { Token } from "@/store/limit-order/utils/token.types";

export const LimitToken1Input = () => {
  const {
    state: {
      chainId,
      token1,
      token0,
      swapAmountString,
      limitPriceString,
      isLimitPriceInverted,
    },
    mutate: { setToken1 },
    isToken1Loading: isLoading,
  } = useDerivedStateTwap();

  const { address, isConnecting, isReconnecting } = useAccount();
  const [isTokenSelectorOpen, setIsTokenSelectorOpen] = useState(false);

  console.log("TOKEN1INPUT", token1);

  // Get balance for display with better error handling
  const { data: balance, isLoading: isBalanceLoading } = useBalance({
    address: address || undefined,
    token:
      token1?.address === "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"
        ? undefined
        : (token1?.address as `0x${string}`) || undefined,
    query: {
      enabled:
        !!address && !!token1?.address && !isConnecting && !isReconnecting,
    },
  });

  const formatBuyingAmount = (amount: number): string => {
    try {
      if (!amount || isNaN(amount) || amount === 0) return "0.0";

      // Handle very small amounts
      if (amount < 0.000001) {
        return amount.toFixed(10).replace(/\.?0+$/, "");
      }

      // Handle small amounts
      if (amount < 1) {
        return amount.toFixed(8).replace(/\.?0+$/, "");
      }

      // Handle normal amounts
      if (amount < 1000000) {
        return amount.toFixed(6).replace(/\.?0+$/, "");
      }

      // Handle large amounts without scientific notation
      return amount.toLocaleString("en-US", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      });
    } catch (error) {
      console.error("Error formatting buying amount:", error);
      return "0.0";
    }
  };

  // Calculate the buying amount based on selling amount and limit price
  const calculatedBuyingAmount = useMemo(() => {
    // Return early if essential data is missing
    if (!swapAmountString || !limitPriceString || !token0 || !token1) {
      return "0.0";
    }

    try {
      const sellAmount = parseFloat(swapAmountString);
      const limitPrice = parseFloat(limitPriceString);

      if (
        isNaN(sellAmount) ||
        isNaN(limitPrice) ||
        sellAmount <= 0 ||
        limitPrice <= 0
      ) {
        return "0.0";
      }

      let buyingAmount: number;

      if (isLimitPriceInverted) {
        // When inverted, the limit price is "how much token0 per token1"
        // So to get token1 amount: sellAmount / limitPrice
        buyingAmount = sellAmount / limitPrice;
      } else {
        // Normal case: limit price is "how much token1 per token0"
        // So to get token1 amount: sellAmount * limitPrice
        buyingAmount = sellAmount * limitPrice;
      }

      // Format the result to avoid scientific notation and errors
      return formatBuyingAmount(buyingAmount);
    } catch (error) {
      console.error("Error calculating buying amount:", error);
      return "0.0";
    }
  }, [
    swapAmountString,
    limitPriceString,
    isLimitPriceInverted,
    token0?.address,
    token1?.address,
  ]);

  const formatBalance = (balance: bigint, decimals: number): string => {
    try {
      const formatted = formatUnits(balance, decimals);
      const num = parseFloat(formatted);

      if (isNaN(num)) return "0.000000";

      return num.toFixed(6);
    } catch (error) {
      console.error("Error formatting balance:", error);
      return "0.000000";
    }
  };

  const handleTokenSelect = (selectedToken: Token) => {
    if (!selectedToken) return;
    setToken1(selectedToken);
  };

  const isWalletLoading = isConnecting || isReconnecting || isBalanceLoading;

  return (
    <>
      <div className="relative border border-gray-600 rounded-xl p-4">
        {/* Label */}
        <div className="text-sm text-gray-400 mb-2">You're buying</div>

        {/* Amount Display and Token Selector Row */}
        <div className="flex items-center gap-4">
          {/* Amount Display (calculated from selling amount and limit price) */}
          <div className="flex-1">
            <div className="text-3xl font-medium text-white">
              {calculatedBuyingAmount}
            </div>
            <div className="text-sm text-gray-500 mt-1">Estimated output</div>
          </div>

          {/* Token Selector */}
          <button
            onClick={() => setIsTokenSelectorOpen(true)}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50"
          >
            {token1 ? (
              <>
                {token1.img ? (
                  <img
                    src={token1.img}
                    alt={token1.ticker}
                    className="w-6 h-6 rounded-full"
                    onError={(e) => {
                      // Fallback to placeholder if image fails
                      e.currentTarget.style.display = "none";
                    }}
                  />
                ) : null}
                {(!token1.img || token1.img === "") && (
                  <div className="w-6 h-6 bg-gray-500 rounded-full flex items-center justify-center text-xs">
                    {token1.ticker?.slice(0, 2) || "??"}
                  </div>
                )}
                <span className="font-medium">{token1.ticker}</span>
              </>
            ) : (
              <span className="text-gray-400">Select token</span>
            )}
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        </div>

        {/* Balance Display */}
        {token1 && address && (
          <div className="mt-3 text-sm text-gray-400">
            Balance:{" "}
            {isWalletLoading
              ? "Loading..."
              : balance
              ? formatBalance(balance.value, balance.decimals)
              : "0.000000"}{" "}
            {token1.ticker}
          </div>
        )}

        {/* Connection status indicator */}
        {(isConnecting || isReconnecting) && (
          <div className="mt-2 text-xs text-yellow-400">
            Connecting wallet...
          </div>
        )}
      </div>

      {/* Token Selection Modal */}
      {token0 && token1 && (
        <LimitTokenSelectionModal
          isOpen={isTokenSelectorOpen}
          onClose={() => setIsTokenSelectorOpen(false)}
          onSelect={handleTokenSelect}
          selectedToken={token1}
          otherToken={token0}
          chainId={chainId}
          title="Select token to buy"
        />
      )}
    </>
  );
};
