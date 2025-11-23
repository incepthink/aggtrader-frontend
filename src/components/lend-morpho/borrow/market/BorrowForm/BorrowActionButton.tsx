// /components/lend-morpho/borrow/market/BorrowForm/BorrowActionButton.tsx
"use client";

import React from "react";

interface BorrowActionButtonProps {
  isConnected: boolean;
  collateralAmount: string;
  borrowAmount: string;
  isLoading: boolean;
  canBorrow?: boolean;
  isExceedingLimit?: boolean;
  onBorrow: () => void;
  onConnect: () => void;
  mode: "borrow" | "repay";
  buttonText?: string;
  // Repay mode specific props
  repayAmount?: string;
  onRepay?: () => void;
  maxBorrowable?: string;
  hasDebt?: boolean;
}

export const BorrowActionButton: React.FC<BorrowActionButtonProps> = ({
  isConnected,
  collateralAmount,
  borrowAmount,
  isLoading,
  canBorrow = true,
  isExceedingLimit = false,
  onBorrow,
  onConnect,
  mode,
  buttonText,
  repayAmount = "",
  onRepay = () => {},
  maxBorrowable = "0",
  hasDebt = false,
}) => {
  const [isHovered, setIsHovered] = React.useState(false);

  const getButtonText = () => {
    if (buttonText) {
      return buttonText;
    }

    if (!isConnected) {
      return "Connect Wallet";
    }

    if (isLoading) {
      return mode === "borrow" ? "Borrowing..." : "Repaying...";
    }

    if (isExceedingLimit) {
      return "Exceeds Safe Limit";
    }

    if (!collateralAmount && !borrowAmount) {
      return `Enter ${mode === "borrow" ? "amounts" : "amount"}`;
    }

    if (mode === "borrow" && (!collateralAmount || !borrowAmount)) {
      return "Enter amounts";
    }

    return mode === "borrow" ? "Borrow" : "Repay";
  };

  const isDisabled = () => {
    if (!isConnected || isLoading) {
      return false;
    }

    if (isExceedingLimit) {
      return true;
    }

    if (mode === "borrow") {
      return !canBorrow;
    }

    if (!repayAmount || !hasDebt) {
      return true;
    }

    return false;
  };

  const getButtonColor = () => {
    if (isExceedingLimit) {
      return "#dc2626";
    }

    if (!isConnected) {
      return "#3b82f6";
    }

    return "#16a34a";
  };

  const buttonStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px 24px",
    backgroundColor: isDisabled() ? "#374151" : getButtonColor(),
    color: isDisabled() ? "#9ca3af" : "white",
    fontSize: "1rem",
    fontWeight: 600,
    border: "none",
    borderRadius: "4px",
    cursor: isDisabled() ? "not-allowed" : "pointer",
    opacity: isHovered && !isDisabled() ? 0.9 : 1,
    transition: "opacity 0.2s ease-in-out",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    fontFamily: "inherit",
  };

  return (
    <>
      <button
        data-testid={mode === "borrow" ? "borrow-action-button" : "repay-action-button"}
        data-collateral-amount={collateralAmount}
        data-borrow-amount={borrowAmount}
        data-repay-amount={repayAmount}
        data-button-text={getButtonText()}
        onClick={
          !isConnected ? onConnect : mode === "borrow" ? onBorrow : onRepay
        }
        disabled={isDisabled()}
        style={buttonStyle}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {isLoading && (
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            className="spinner"
          >
            <circle
              cx="10"
              cy="10"
              r="8"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="40"
              strokeDashoffset="10"
              opacity="0.25"
            />
            <circle
              cx="10"
              cy="10"
              r="8"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="40"
              strokeDashoffset="30"
            />
          </svg>
        )}
        {getButtonText()}
      </button>
      <style jsx>{`
        .spinner {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </>
  );
};
