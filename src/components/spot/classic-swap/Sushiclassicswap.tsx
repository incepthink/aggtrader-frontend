// components/spot/classic-swap/Sushiclassicswap.tsx
"use client";

import SwapVertIcon from "@mui/icons-material/SwapVert";
import React, { useState, useCallback, memo } from "react";
import { useAccount } from "wagmi";

import { useSpotStore } from "@/store/spotStore";
import { GradientConnectButton } from "@/components/common/navbar/Navbar";

import { SwapSettings } from "./components/SwapSettings";
import { SwapInputSection } from "./components/Swapinputsection";
import { SwapDetails } from "./components/SwapDetails";
import { TokenSelectionModal } from "./components/TokenSelectionModal";
import { SwapButton } from "./components/Swapbutton";
import { NotificationSnackbar } from "./components/Notificationsnackbar";

import { useSwapState } from "./hooks/useswapstate";
import { useSwapHandlers } from "./hooks/useswaphandlers";
import { useSwapEffects } from "./hooks/useswapeffects";

import "./styles/index.css";

interface SushiClassicSwapProps {
  showChart: boolean;
  onToggleChart: () => void;
  isMobile?: boolean;
}

const SushiClassicSwap = memo(
  ({ showChart, onToggleChart, isMobile = false }: SushiClassicSwapProps) => {
    const { address, isConnected } = useAccount();

    const tokenOne = useSpotStore((s) => s.tokenOne);
    const tokenTwo = useSpotStore((s) => s.tokenTwo);
    const setTokenOne = useSpotStore((s) => s.setTokenOne);
    const setTokenTwo = useSpotStore((s) => s.setTokenTwo);
    const openModal = useSpotStore((s) => s.openModal);

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

    const isSwapDisabled =
      !tokenOneAmount ||
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

          {quote && tokenOneAmount && (
            <SwapDetails
              quote={quote}
              slippage={slippage}
              tokenInAmount={tokenOneAmount}
              isLoadingQuote={isLoadingQuote}
            />
          )}
          <div>
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
            {!isMobile && (
              <button
                className="bg-neutral-800 rounded-md p-4 w-full cursor-pointer hover:bg-neutral-700 transition-colors"
                onClick={onToggleChart}
              >
                {showChart ? "Hide Chart" : "Show Chart"}
              </button>
            )}
          </div>
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
  }
);

SushiClassicSwap.displayName = "SushiClassicSwap";

export default SushiClassicSwap;
