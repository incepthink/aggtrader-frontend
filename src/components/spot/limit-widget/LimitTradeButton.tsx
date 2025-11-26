// LimitTradeButton.tsx
"use client";

import React, { useState, useMemo } from "react";
import {
  useDerivedStateTwap,
  useTwapTrade,
  useTwapTradeErrors,
} from "../../../store/limit-order/derivedstate-twap-provider";
import { useAccount, useConnect } from "wagmi";
import { SimpleAmount } from "../../../store/limit-order/utils/simpleCurrency";
import {
  isNativeToken,
  createWrappedNativeToken,
} from "@/store/limit-order/utils/token.types";
import type { Token } from "@/store/limit-order/utils/token.types";
import { WrapTokenButton } from "./WrapTokenButton";
import { LimitTradeReviewDialog } from "./LimitTradeReviewDialog";

export const LimitTradeButton = () => {
  const {
    state: { token0, token1, swapAmount, swapAmountString, chainId },
    mutate: { setToken0 },
  } = useDerivedStateTwap();

  const { data: trade } = useTwapTrade();
  const { minTradeSizeError, minFillDelayError, maxFillDelayError } =
    useTwapTradeErrors();
  const { isConnected, address } = useAccount();
  const { connectors, connect } = useConnect();
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);

  // Check if we need to wrap token0
  const needsWrapping = useMemo(() => {
    return (
      token0 &&
      isNativeToken(token0) &&
      swapAmountString &&
      parseFloat(swapAmountString) > 0
    );
  }, [token0, swapAmountString]);

  // Handle successful wrap by switching to wrapped token
  const handleWrapSuccess = (wrappedToken: Token) => {
    setToken0(wrappedToken);
  };

  // Create SIMPLE_ZERO equivalent for comparison
  const isZeroAmount = useMemo(() => {
    if (!swapAmount) return true;
    try {
      return swapAmount.quotient === BigInt(0);
    } catch {
      return true;
    }
  }, [swapAmount]);

  // Determine button state and text
  const getButtonState = () => {
    if (!isConnected) {
      return { text: "Connect Wallet", disabled: false, variant: "connect" };
    }

    if (!swapAmount || isZeroAmount) {
      return { text: "Enter amount", disabled: true, variant: "disabled" };
    }

    // If native token needs wrapping, show wrap state
    if (needsWrapping) {
      return { text: "Wrap Required", disabled: false, variant: "wrap" };
    }

    if (minTradeSizeError) {
      return {
        text: "Inadequate Trade Size",
        disabled: true,
        variant: "error",
      };
    }

    if (minFillDelayError) {
      return {
        text: "Trade Interval Below Limit",
        disabled: true,
        variant: "error",
      };
    }

    if (maxFillDelayError) {
      return {
        text: "Trade Interval Exceeds Limit",
        disabled: true,
        variant: "error",
      };
    }

    if (!trade) {
      return { text: "Loading...", disabled: true, variant: "loading" };
    }

    return { text: "Review Limit Order", disabled: false, variant: "ready" };
  };

  const { text, disabled, variant } = getButtonState();

  const getButtonStyles = () => {
    switch (variant) {
      case "connect":
        return "bg-[#00F5E0] hover:bg-[#00F5E0]/90 text-black";
      case "error":
        return "bg-red-600 text-white cursor-not-allowed";
      case "loading":
        return "bg-gray-600 text-gray-300 cursor-not-allowed";
      case "disabled":
        return "bg-gray-700 text-gray-400 cursor-not-allowed";
      case "wrap":
        return "bg-blue-600 hover:bg-blue-700 text-white";
      case "ready":
        return "bg-[#00F5E0] hover:bg-[#00F5E0]/90 text-black hover:shadow-lg";
      default:
        return "bg-gray-600 text-white";
    }
  };

  const handleClick = () => {
    if (disabled) return;

    if (variant === "connect") {
      // Connect wallet
      const injectedConnector = connectors.find(
        (connector) => connector.id === "injected"
      );
      if (injectedConnector) {
        connect({ connector: injectedConnector });
      }
      return;
    }

    if (variant === "ready") {
      // Open review dialog for limit order
      setIsReviewDialogOpen(true);
    }
  };

  // If wrapping is needed, show the wrap button instead
  if (needsWrapping) {
    return (
      <WrapTokenButton
        token={token0}
        amount={swapAmountString}
        onWrapSuccess={handleWrapSuccess}
        disabled={disabled}
        className="w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-200 bg-blue-600 hover:bg-blue-700 text-white"
      />
    );
  }

  return (
    <>
      <button
        data-testid="limit-trade-button"
        onClick={handleClick}
        disabled={disabled && variant !== "connect"}
        className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-200 ${getButtonStyles()}`}
      >
        {text}
      </button>

      {/* Review Dialog */}
      {isReviewDialogOpen && (
        <LimitTradeReviewDialog
          isOpen={isReviewDialogOpen}
          onClose={() => setIsReviewDialogOpen(false)}
        />
      )}
    </>
  );
};
