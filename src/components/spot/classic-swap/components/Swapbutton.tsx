import React, { memo } from "react";
import { GradientConnectButton } from "@/components/common/navbar/Navbar";

interface SwapButtonProps {
  isConnected: boolean;
  isDisabled: boolean;
  isLoadingPrices: boolean;
  isSending: boolean;
  isConfirming: boolean;
  isInitiatingSwap: boolean;
  isLoadingQuote: boolean;
  onSwap: () => void;
}

export const SwapButton = memo(
  ({
    isConnected,
    isDisabled,
    isLoadingPrices,
    isSending,
    isConfirming,
    isInitiatingSwap,
    isLoadingQuote,
    onSwap,
  }: SwapButtonProps) => {
    if (!isConnected) {
      return <GradientConnectButton />;
    }

    const getButtonText = () => {
      if (isLoadingPrices) return "Loading prices…";
      if (isSending) return "Sending…";
      if (isConfirming) return "Confirming…";
      if (isInitiatingSwap) return "Preparing…";
      if (isLoadingQuote) return "Getting Quote...";
      return "Swap";
    };

    return (
      <div
        className={`swapButton ${isDisabled ? "disabled" : ""}`}
        onClick={isDisabled ? undefined : onSwap}
        style={{
          opacity: isDisabled ? 0.6 : 1,
          cursor: isDisabled ? "not-allowed" : "pointer",
        }}
      >
        {getButtonText()}
      </div>
    );
  }
);

SwapButton.displayName = "SwapButton";
