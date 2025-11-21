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
  needsApproval: boolean; // NEW
  isApproving: boolean; // NEW
  isConfirmingApproval: boolean; // NEW
  tokenOneTicker: string; // NEW
  onSwap: () => void;
  onApprove: () => void; // NEW
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
    needsApproval,
    isApproving,
    isConfirmingApproval,
    tokenOneTicker,
    onSwap,
    onApprove,
  }: SwapButtonProps) => {
    if (!isConnected) {
      return <GradientConnectButton />;
    }

    const getButtonText = () => {
      if (isLoadingPrices) return "Loading prices…";
      if (needsApproval) {
        if (isApproving) return "Approving in wallet…";
        if (isConfirmingApproval) return "Confirming approval…";
        return `Approve ${tokenOneTicker}`;
      }
      if (isSending) return "Sending…";
      if (isConfirming) return "Confirming…";
      if (isInitiatingSwap) return "Preparing…";
      if (isLoadingQuote) return "Getting Quote...";
      return "Swap";
    };

    const handleClick = () => {
      if (needsApproval) {
        onApprove();
      } else {
        onSwap();
      }
    };

    const isButtonDisabled = isDisabled || isApproving || isConfirmingApproval;

    return (
      <div
        id="main-action-btn"
        className={`swapButton ${isButtonDisabled ? "disabled" : ""}`}
        onClick={isButtonDisabled ? undefined : handleClick}
        style={{
          opacity: isButtonDisabled ? 0.6 : 1,
          cursor: isButtonDisabled ? "not-allowed" : "pointer",
        }}
      >
        {getButtonText()}
      </div>
    );
  }
);

SwapButton.displayName = "SwapButton";
