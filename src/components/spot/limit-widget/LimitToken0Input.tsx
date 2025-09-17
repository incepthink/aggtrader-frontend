// components/limit-widget/LimitToken0Input.tsx
"use client";

import React, { useEffect } from "react";
import { useDerivedStateTwap } from "@/store/limit-order/derivedstate-twap-provider";
import { formatUnits } from "viem/utils";
import { useAccount, useBalance } from "wagmi";
import { LimitTokenSelectionModal } from "./LimitTokenSelectionModal";
import { useTokenSelectModal } from "@/context/TokenSelectModalContext";
import type { Token } from "@/store/limit-order/utils/token.types";

export const LimitToken0Input = () => {
  const {
    state: { chainId, token0, token1, swapAmountString },
    mutate: { setSwapAmount, setToken0 },
    isToken0Loading: isLoading,
  } = useDerivedStateTwap();

  const { address, isConnecting, isReconnecting } = useAccount();

  // Use context instead of local state
  const {
    isLimitTokenModalOpen,
    limitModalPosition,
    openLimitTokenModal,
    closeLimitTokenModal,
  } = useTokenSelectModal();

  console.log("TOKEN0INPUT", token0);

  // Get balance for the selected token with better error handling
  const { data: balance, isLoading: isBalanceLoading } = useBalance({
    address: address || undefined,
    token:
      token0?.address === "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"
        ? undefined
        : (token0?.address as `0x${string}`) || undefined,
    query: {
      enabled:
        !!address && !!token0?.address && !isConnecting && !isReconnecting,
    },
  });

  const handleMaxClick = () => {
    if (!balance || !token0) return;

    try {
      const maxAmount = formatUnits(balance.value, balance.decimals);
      // Leave a small buffer for gas if it's native token
      const adjustedMax =
        token0.address === "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"
          ? (parseFloat(maxAmount) * 0.95).toFixed(8)
          : maxAmount;

      // Only set if the adjusted amount is valid
      if (!isNaN(parseFloat(adjustedMax))) {
        setSwapAmount(adjustedMax);
      }
    } catch (error) {
      console.error("Error setting max amount:", error);
    }
  };

  const handleTokenSelect = (selectedToken: Token) => {
    if (!selectedToken) return;
    setToken0(selectedToken);
  };

  const handleAmountChange = (value: string) => {
    // Only allow numbers and decimal point
    const cleanValue = value.replace(/[^0-9.]/g, "");

    // Prevent multiple decimal points
    const parts = cleanValue.split(".");
    if (parts.length > 2) return;

    // Prevent very long decimal places
    if (parts[1] && parts[1].length > 18) return;

    setSwapAmount(cleanValue);
  };

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

  const hasBalance = balance && balance.value > BigInt(0);
  const isWalletLoading = isConnecting || isReconnecting || isBalanceLoading;

  // Check if this component should show the modal
  const shouldShowModal =
    isLimitTokenModalOpen && limitModalPosition === "token0";

  return (
    <>
      <div className="relative border border-[#00FFE9] rounded-xl p-4">
        {/* Label */}
        <div className="text-sm text-gray-400 mb-2">You're selling</div>

        {/* Input and Token Selector Row */}
        <div className="flex items-center gap-4">
          {/* Amount Input */}
          <div className="flex-1">
            <input
              type="text"
              value={swapAmountString || ""}
              onChange={(e) => handleAmountChange(e.target.value)}
              placeholder="0.0"
              className="w-full bg-transparent text-3xl font-medium text-white placeholder-gray-500 border-none outline-none focus:ring-0"
              disabled={isLoading || isWalletLoading}
              inputMode="decimal"
              autoComplete="off"
              spellCheck={false}
            />
          </div>

          {/* Token Selector */}
          <button
            onClick={() => openLimitTokenModal("token0")}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50"
          >
            {token0 ? (
              <>
                {token0.img ? (
                  <img
                    src={token0.img}
                    alt={token0.ticker}
                    className="w-6 h-6 rounded-full"
                    onError={(e) => {
                      // Fallback to placeholder if image fails
                      e.currentTarget.style.display = "none";
                    }}
                  />
                ) : null}
                {(!token0.img || token0.img === "") && (
                  <div className="w-6 h-6 bg-gray-500 rounded-full flex items-center justify-center text-xs">
                    {token0.ticker?.slice(0, 2) || "??"}
                  </div>
                )}
                <span className="font-medium">{token0.ticker}</span>
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

        {/* Balance and Max Button */}
        {token0 && address && (
          <div className="flex justify-between items-center mt-3 text-sm">
            <div className="text-gray-400">
              Balance:{" "}
              {isWalletLoading
                ? "Loading..."
                : balance
                ? formatBalance(balance.value, balance.decimals)
                : "0.000000"}{" "}
              {token0.ticker}
            </div>
            {hasBalance && !isWalletLoading && (
              <button
                onClick={handleMaxClick}
                className="px-2 py-1 bg-gray-600 hover:bg-gray-500 rounded text-[10px] text-white transition-colors"
                disabled={isWalletLoading}
              >
                MAX
              </button>
            )}
          </div>
        )}

        {/* Connection status indicator */}
        {(isConnecting || isReconnecting) && (
          <div className="mt-2 text-xs text-yellow-400">
            Connecting wallet...
          </div>
        )}
      </div>

      {/* Token Selection Modal - Only show when this component should handle it */}
      {token0 && token1 && shouldShowModal && (
        <LimitTokenSelectionModal
          isOpen={shouldShowModal}
          onClose={closeLimitTokenModal}
          onSelect={handleTokenSelect}
          selectedToken={token0}
          otherToken={token1}
          chainId={chainId}
          title="Select token to sell"
          modalTokenPosition="tokenOne"
        />
      )}
    </>
  );
};
