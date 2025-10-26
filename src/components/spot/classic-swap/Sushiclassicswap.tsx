"use client";

import SwapVertIcon from "@mui/icons-material/SwapVert";
import React, { useState, useCallback, memo } from "react";
import { useAccount } from "wagmi";

import { useSpotStore } from "@/store/spotStore";
import { GradientConnectButton } from "@/components/common/navbar/Navbar";

// Local components
import { SwapSettings } from "./components/SwapSettings";
import { SwapInputSection } from "./components/Swapinputsection";
import { SwapDetails } from "./components/SwapDetails";
import { TokenSelectionModal } from "./components/TokenSelectionModal";
import { SwapButton } from "./components/Swapbutton";
import { NotificationSnackbar } from "./components/Notificationsnackbar";

// Hooks
import { useSwapState } from "./hooks/useswapstate";
import { useSwapHandlers } from "./hooks/useswaphandlers";
import { useSwapEffects } from "./hooks/useswapeffects";

import "./styles/index.css";

const SushiClassicSwap = memo(() => {
  const { address, isConnected } = useAccount();

  /* --------- Global token selection from store --------- */
  const tokenOne = useSpotStore((s) => s.tokenOne);
  const tokenTwo = useSpotStore((s) => s.tokenTwo);
  const setTokenOne = useSpotStore((s) => s.setTokenOne);
  const setTokenTwo = useSpotStore((s) => s.setTokenTwo);
  const openModal = useSpotStore((s) => s.openModal);

  /* --------- Local state managed by custom hook --------- */
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

  /* --------- Swap handlers --------- */
  const {
    handleSellAmountChange,
    handleBuyAmountChange,
    handleMaxBalance,
    handleSwitchTokens,
    handleSwap,
    quote,
    isLoadingQuote,
    isSending,
    isConfirming,
    prices,
    isLoadingPrices,
    tokenOnePrice,
    tokenTwoPrice,
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

  /* --------- Side effects (notifications, price loading) --------- */
  useSwapEffects({
    tokenOne,
    tokenTwo,
    isSending,
    isConfirming,
    showSnackbar,
    setTokenOneAmount,
    setTokenTwoAmount,
    setIsInitiatingSwap,
  });

  /* --------- Memoized callbacks --------- */
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

  /* --------- Computed values --------- */
  const isSwapDisabled =
    !tokenOneAmount ||
    !isConnected ||
    isLoadingPrices ||
    isSending ||
    isConfirming ||
    isInitiatingSwap ||
    isLoadingQuote ||
    !quote;

  /* ---------- Render ---------- */
  return (
    <>
      <div className="tradeBox px-2">
        {/* Header */}
        <div className="flex justify-between items-center mb-4 lg:mb-4">
          <h4 className="text-xl">Classic Swap</h4>
          <SwapSettings
            slippage={slippage}
            onSlippageChange={handleSlippageChange}
          />
        </div>

        {/* Swap Inputs Section */}
        <SwapInputSection
          tokenOne={tokenOne}
          tokenTwo={tokenTwo}
          tokenOneAmount={tokenOneAmount}
          tokenTwoAmount={tokenTwoAmount}
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
        />

        {/* Swap Details */}
        {quote && tokenOneAmount && (
          <SwapDetails
            quote={quote}
            slippage={slippage}
            tokenInAmount={tokenOneAmount}
            isLoadingQuote={isLoadingQuote}
          />
        )}

        {/* Swap Button */}
        <SwapButton
          isConnected={isConnected}
          isDisabled={isSwapDisabled}
          isLoadingPrices={isLoadingPrices}
          isSending={isSending}
          isConfirming={isConfirming}
          isInitiatingSwap={isInitiatingSwap}
          isLoadingQuote={isLoadingQuote}
          onSwap={handleSwap}
        />
      </div>

      {/* Token Selection Modal */}
      <TokenSelectionModal />

      {/* Notifications */}
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
