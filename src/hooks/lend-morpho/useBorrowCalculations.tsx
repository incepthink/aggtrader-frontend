// /hooks/useBorrowCalculations.ts
"use client";

import {
  calculateMaxBorrowable,
  calculateCurrentLTV,
  calculateHealthFactor,
  calculateMaxSafeLTV,
  isExceedingSafeLTV,
  getSafetyBufferInfo,
  formatPercentage,
  formatNumber,
} from "@/components/lend-morpho/borrow/market/BorrowForm/borrowingCapacity";

interface UseBorrowCalculationsProps {
  collateralAmount: string;
  borrowAmount: string;
  repayAmount: string;
  collateralPrice: number;
  loanTokenPrice: number;
  lltv: number;
  currentCollateral: number;
  currentBorrowed: number;
  activeTab: "borrow" | "repay";
}

export function useBorrowCalculations({
  collateralAmount,
  borrowAmount,
  repayAmount,
  collateralPrice,
  loanTokenPrice,
  lltv,
  currentCollateral,
  currentBorrowed,
  activeTab,
}: UseBorrowCalculationsProps) {
  const collateralAmountNum = parseFloat(collateralAmount) || 0;
  const borrowAmountNum = parseFloat(borrowAmount) || 0;
  const repayAmountNum = parseFloat(repayAmount) || 0;

  // Calculate safety buffer info
  const safetyInfo = getSafetyBufferInfo(lltv);
  const maxSafeLTV = calculateMaxSafeLTV(lltv);

  // Calculate max borrowable based on entered collateral with safety buffer
  const maxBorrowableAmount = calculateMaxBorrowable(
    collateralAmountNum,
    collateralPrice,
    loanTokenPrice,
    lltv
  );

  // Calculate projected position after transaction
  const projectedCollateral =
    activeTab === "borrow"
      ? currentCollateral + collateralAmountNum
      : currentCollateral;

  const projectedBorrowed =
    activeTab === "borrow"
      ? currentBorrowed + borrowAmountNum
      : Math.max(0, currentBorrowed - repayAmountNum);

  // Calculate current and projected LTV
  const currentLTV = calculateCurrentLTV(
    currentBorrowed,
    loanTokenPrice,
    currentCollateral,
    collateralPrice
  );

  const projectedLTV = calculateCurrentLTV(
    projectedBorrowed,
    loanTokenPrice,
    projectedCollateral,
    collateralPrice
  );

  // Check if exceeding safe LTV
  const isExceedingLimit = isExceedingSafeLTV(projectedLTV, lltv);

  // Calculate health factors
  const currentHealthFactor = calculateHealthFactor(currentLTV, lltv);
  const projectedHealthFactor = calculateHealthFactor(projectedLTV, lltv);

  // Calculate USD values
  const collateralUsdValue = collateralAmountNum * collateralPrice;
  const borrowUsdValue = borrowAmountNum * loanTokenPrice;
  const repayUsdValue = repayAmountNum * loanTokenPrice;

  // Risk assessment
  const getRiskLevel = () => {
    if (isExceedingLimit) {
      return { level: "danger", color: "#d32f2f", severity: "error" as const };
    }

    const healthFactor = projectedHealthFactor;

    if (healthFactor === Infinity || healthFactor > 2) {
      return { level: "safe", color: "#4caf50", severity: "info" as const };
    } else if (healthFactor > 1.5) {
      return {
        level: "moderate",
        color: "#f59e0b",
        severity: "warning" as const,
      };
    } else if (healthFactor > 1) {
      return { level: "risky", color: "#f44336", severity: "error" as const };
    } else {
      return { level: "danger", color: "#d32f2f", severity: "error" as const };
    }
  };

  const riskLevel = getRiskLevel();

  // Validation flags
  const canBorrow =
    activeTab === "borrow" &&
    collateralAmountNum > 0 &&
    borrowAmountNum > 0 &&
    !isExceedingLimit &&
    borrowAmountNum <= maxBorrowableAmount;

  return {
    maxBorrowableAmount,
    maxSafeLTV,
    safetyInfo,
    projectedCollateral,
    projectedBorrowed,
    currentLTV,
    projectedLTV,
    currentHealthFactor,
    projectedHealthFactor,
    collateralUsdValue,
    borrowUsdValue,
    repayUsdValue,
    riskLevel,
    isExceedingLimit,
    canBorrow,
    // Helper functions
    formatPercentage,
    formatNumber,
  };
}
