// /components/lend-morpho/borrow/market/BorrowForm/BorrowActionButton.tsx
"use client";

import React from "react";
import { Button, CircularProgress } from "@mui/material";

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
  buttonText?: string; // Add this line
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
  const getButtonText = () => {
    if (buttonText) {
      return buttonText; // Use custom button text if provided
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
      return false; // These states have their own handlers
    }

    if (isExceedingLimit) {
      return true;
    }

    if (mode === "borrow") {
      return !canBorrow;
    }

    // Repay mode validation
    if (!repayAmount || !hasDebt) {
      return true;
    }

    return false;
  };

  const getButtonColor = () => {
    if (isExceedingLimit) {
      return "#dc2626"; // Red for exceeded limit
    }

    if (!isConnected) {
      return "#3b82f6"; // Blue for connect
    }

    return "#16a34a"; // Green for normal action
  };

  return (
    <Button
      fullWidth
      variant="contained"
      size="large"
      onClick={
        !isConnected ? onConnect : mode === "borrow" ? onBorrow : onRepay
      }
      disabled={isDisabled()}
      sx={{
        py: 1.5,
        backgroundColor: getButtonColor(),
        "&:hover": {
          backgroundColor: getButtonColor(),
          opacity: 0.9,
        },
        "&:disabled": {
          backgroundColor: "#374151",
          color: "#9ca3af",
        },
        fontSize: "1rem",
        fontWeight: 600,
      }}
      startIcon={
        isLoading ? (
          <CircularProgress size={20} sx={{ color: "white" }} />
        ) : null
      }
    >
      {getButtonText()}
    </Button>
  );
};
