"use client";

import SwapVertIcon from "@mui/icons-material/SwapVert";
import React, { useState, useCallback, memo, useMemo } from "react";
import { useAccount } from "wagmi";

import { useSpotStore } from "@/store/spotStore";
import { GradientConnectButton } from "@/components/common/navbar/Navbar";

import { SwapSettings } from "./components/SwapSettings";
import { SwapInputSection } from "./components/Swapinputsection";
import { SwapDetails } from "./components/SwapDetails";
import { TokenSelectionModal } from "./components/TokenSelectionModal";
import { SwapButton } from "./components/Swapbutton";
import { NotificationSnackbar } from "./components/Notificationsnackbar";
import type { InputMode } from "./components/SwapInput";

import { useSwapState } from "./hooks/useswapstate";
import { useSwapHandlers } from "./hooks/useswaphandlers";
import { useSwapEffects } from "./hooks/useswapeffects";

import "./styles/index.css";

const SushiClassicSwap = memo(() => {
  const { address, isConnected } = useAccount();

  const tokenOne = useSpotStore((s) => s.tokenOne);
  const tokenTwo = useSpotStore((s) => s.tokenTwo);
  const setTokenOne = useSpotStore((s) => s.setTokenOne);
  const setTokenTwo = useSpotStore((s) => s.setTokenTwo);
  const openModal = useSpotStore((s) => s.openModal);

  // Input mode state (token amount or USD value)
  const [sellInputMode, setSellInputMode] = useState<InputMode>("token");
  const [buyInputMode, setBuyInputMode] = useState<InputMode>("token");

  const {
    tokenOneAmount,
    tokenTwoAmount,
    slippage,
    isInitiatingSwap,
    snackbarState,
    setTokenOneAmount,
    setTokenTwoAmount,
    setSlippage,
    setIsInitiatingSwap,
    showSnackbar,
    closeSnackbar,
  } = useSwapState();

  const {
    handleSellAmountChange: originalHandleSellAmountChange,
    handleBuyAmountChange: originalHandleBuyAmountChange,
    handleMaxBalance,
    handleSwitchTokens,
    handleSwap,
    handleApprove, // NEW
    quote,
    isLoadingQuote,
    quoteWarning,
    isSending,
    isConfirming,
    prices,
    isLoadingPrices,
    tokenOnePrice,
    tokenTwoPrice,
    needsApproval, // NEW
    isApproving, // NEW
    isConfirmingApproval, // NEW
  } = useSwapHandlers({
    tokenOne,
    tokenTwo,
    tokenOneAmount,
    tokenTwoAmount,
    slippage,
    isInitiatingSwap,
    address,
    isConnected,
    setTokenOne,
    setTokenTwo,
    setTokenOneAmount,
    setTokenTwoAmount,
    setIsInitiatingSwap,
    showSnackbar,
  });

  // Wrapped handlers that handle USD input mode
  const handleSellAmountChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      let value = e.target.value;

      // Allow complete clearing - empty string is valid
      if (!value || value === "" || value === ".") {
        originalHandleSellAmountChange(e);
        return;
      }

      if (sellInputMode === "usd" && tokenOnePrice) {
        // Convert USD to token amount for internal state
        const usdValue = parseFloat(value);
        if (!isNaN(usdValue) && usdValue >= 0) {
          const tokenValue = usdValue / tokenOnePrice;
          // Ensure we handle very small and very large numbers
          if (isFinite(tokenValue)) {
            // Create synthetic event with token amount
            const syntheticEvent = {
              ...e,
              target: { ...e.target, value: tokenValue.toString() },
            } as React.ChangeEvent<HTMLInputElement>;
            originalHandleSellAmountChange(syntheticEvent);
            return;
          }
        }
        // If parsing fails, clear the input
        originalHandleSellAmountChange(e);
        return;
      }

      originalHandleSellAmountChange(e);
    },
    [sellInputMode, tokenOnePrice, originalHandleSellAmountChange]
  );

  const handleBuyAmountChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      let value = e.target.value;

      // Allow complete clearing - empty string is valid
      if (!value || value === "" || value === ".") {
        originalHandleBuyAmountChange(e);
        return;
      }

      if (buyInputMode === "usd" && tokenTwoPrice) {
        // Convert USD to token amount for internal state
        const usdValue = parseFloat(value);
        if (!isNaN(usdValue) && usdValue >= 0) {
          const tokenValue = usdValue / tokenTwoPrice;
          // Ensure we handle very small and very large numbers
          if (isFinite(tokenValue)) {
            // Create synthetic event with token amount
            const syntheticEvent = {
              ...e,
              target: { ...e.target, value: tokenValue.toString() },
            } as React.ChangeEvent<HTMLInputElement>;
            originalHandleBuyAmountChange(syntheticEvent);
            return;
          }
        }
        // If parsing fails, clear the input
        originalHandleBuyAmountChange(e);
        return;
      }

      originalHandleBuyAmountChange(e);
    },
    [buyInputMode, tokenTwoPrice, originalHandleBuyAmountChange]
  );

  // Get display values based on input mode
  const displayTokenOneAmount = useMemo(() => {
    if (!tokenOneAmount) return "";
    if (sellInputMode === "usd" && tokenOnePrice) {
      const tokenValue = parseFloat(tokenOneAmount);
      if (!isNaN(tokenValue) && tokenValue > 0) {
        const usdValue = tokenValue * tokenOnePrice;
        // Limit to reasonable precision for USD (max 6 decimals)
        return parseFloat(usdValue.toFixed(6)).toString();
      }
    }
    return tokenOneAmount;
  }, [tokenOneAmount, sellInputMode, tokenOnePrice]);

  const displayTokenTwoAmount = useMemo(() => {
    if (!tokenTwoAmount) return "";
    if (buyInputMode === "usd" && tokenTwoPrice) {
      const tokenValue = parseFloat(tokenTwoAmount);
      if (!isNaN(tokenValue) && tokenValue > 0) {
        const usdValue = tokenValue * tokenTwoPrice;
        // Limit to reasonable precision for USD (max 6 decimals)
        return parseFloat(usdValue.toFixed(6)).toString();
      }
    }
    return tokenTwoAmount;
  }, [tokenTwoAmount, buyInputMode, tokenTwoPrice]);

  useSwapEffects({
    tokenOne,
    tokenTwo,
    isSending,
    isConfirming,
    showSnackbar,
    setTokenOneAmount,
    setTokenTwoAmount,
    setIsInitiatingSwap,
    tokenOneAmount,
    tokenTwoAmount,
  });

  const handleSlippageChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSlippage(parseFloat(e.target.value));
    },
    [setSlippage]
  );

  const handleOpenTokenOneModal = useCallback(() => {
    openModal("tokenOne");
  }, [openModal]);

  const handleOpenTokenTwoModal = useCallback(() => {
    openModal("tokenTwo");
  }, [openModal]);

  // Toggle input mode handlers - toggle mode and format the displayed value
  const handleToggleSellMode = useCallback(() => {
    if (!tokenOneAmount || !tokenOnePrice) {
      setSellInputMode((prev) => (prev === "token" ? "usd" : "token"));
      return;
    }

    const tokenValue = parseFloat(tokenOneAmount);
    if (isNaN(tokenValue)) {
      setSellInputMode((prev) => (prev === "token" ? "usd" : "token"));
      return;
    }

    if (sellInputMode === "token") {
      // Switching to USD mode - format as clean USD value
      const usdValue = tokenValue * tokenOnePrice;
      setTokenOneAmount((usdValue / tokenOnePrice).toString());
      setSellInputMode("usd");
    } else {
      // Switching to token mode - keep current token value as is
      setSellInputMode("token");
    }
  }, [sellInputMode, tokenOneAmount, tokenOnePrice, setTokenOneAmount]);

  const handleToggleBuyMode = useCallback(() => {
    if (!tokenTwoAmount || !tokenTwoPrice) {
      setBuyInputMode((prev) => (prev === "token" ? "usd" : "token"));
      return;
    }

    const tokenValue = parseFloat(tokenTwoAmount);
    if (isNaN(tokenValue)) {
      setBuyInputMode((prev) => (prev === "token" ? "usd" : "token"));
      return;
    }

    if (buyInputMode === "token") {
      // Switching to USD mode - format as clean USD value
      const usdValue = tokenValue * tokenTwoPrice;
      setTokenTwoAmount((usdValue / tokenTwoPrice).toString());
      setBuyInputMode("usd");
    } else {
      // Switching to token mode - keep current token value as is
      setBuyInputMode("token");
    }
  }, [buyInputMode, tokenTwoAmount, tokenTwoPrice, setTokenTwoAmount]);

  // UPDATED: Don't disable if needsApproval (user needs to click to approve)
  const isSwapDisabled =
    !tokenOneAmount ||
    parseFloat(tokenOneAmount) <= 0 ||
    !isConnected ||
    isLoadingPrices ||
    isSending ||
    isConfirming ||
    isInitiatingSwap ||
    isLoadingQuote ||
    !quote;

  return (
    <>
      <div className="tradeBox px-2">
        <div className="flex justify-between items-center mb-4 lg:mb-4">
          <h4 className="text-xl">Classic Swap</h4>
          <SwapSettings
            slippage={slippage}
            onSlippageChange={handleSlippageChange}
          />
        </div>

        <SwapInputSection
          tokenOne={tokenOne}
          tokenTwo={tokenTwo}
          tokenOneAmount={displayTokenOneAmount}
          tokenTwoAmount={displayTokenTwoAmount}
          tokenOnePrice={tokenOnePrice}
          tokenTwoPrice={tokenTwoPrice}
          isLoadingPrices={isLoadingPrices}
          isLoadingQuote={isLoadingQuote}
          onSellAmountChange={handleSellAmountChange}
          onBuyAmountChange={handleBuyAmountChange}
          onMaxBalance={handleMaxBalance}
          onSwitchTokens={handleSwitchTokens}
          onOpenTokenOneModal={handleOpenTokenOneModal}
          onOpenTokenTwoModal={handleOpenTokenTwoModal}
          sellInputMode={sellInputMode}
          buyInputMode={buyInputMode}
          onToggleSellMode={handleToggleSellMode}
          onToggleBuyMode={handleToggleBuyMode}
        />

        {quote && tokenOneAmount && (
          <SwapDetails
            quote={quote}
            slippage={slippage}
            tokenInAmount={tokenOneAmount}
            isLoadingQuote={isLoadingQuote}
          />
        )}

        {/* Quote warning display */}
        {quoteWarning && (
          <div className="mt-2 mb-2 p-2 bg-yellow-900/20 border border-yellow-600/50 rounded-lg text-yellow-400 text-sm">
            <div className="flex items-start gap-2">
              <span className="text-lg">⚠️</span>
              <div>
                <div className="font-semibold">Quote Warning</div>
                <div>{quoteWarning}</div>
                <div className="text-xs mt-1 opacity-75">
                  You can still proceed with the swap. A fresh quote will be fetched during execution.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* UPDATED: Pass new props */}
        <SwapButton
          isConnected={isConnected}
          isDisabled={isSwapDisabled}
          isLoadingPrices={isLoadingPrices}
          isSending={isSending}
          isConfirming={isConfirming}
          isInitiatingSwap={isInitiatingSwap}
          isLoadingQuote={isLoadingQuote}
          needsApproval={needsApproval}
          isApproving={isApproving}
          isConfirmingApproval={isConfirmingApproval}
          tokenOneTicker={tokenOne.ticker}
          onSwap={handleSwap}
          onApprove={handleApprove}
        />
      </div>

      <TokenSelectionModal />

      <NotificationSnackbar
        open={snackbarState.open}
        message={snackbarState.message}
        severity={snackbarState.severity}
        onClose={closeSnackbar}
      />
    </>
  );
});

SushiClassicSwap.displayName = "SushiClassicSwap";

export default SushiClassicSwap;
