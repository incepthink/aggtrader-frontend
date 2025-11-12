// /utils/borrowingCapacity.ts
"use client";

// Safety buffer: 5% less than LLTV to prevent liquidation risk
const SAFETY_BUFFER_PERCENTAGE = 0.05; // 5%

/**
 * Calculate maximum safe LTV (LLTV minus safety buffer)
 */
export function calculateMaxSafeLTV(lltv: number): number {
  return Math.max(0, lltv - SAFETY_BUFFER_PERCENTAGE);
}

/**
 * Calculate maximum borrowable amount based on Morpho Blue's LLTV formula with safety buffer
 * Formula: Max Borrowable = (Collateral Value × Safe LTV) / Loan Token Price
 * Safe LTV = LLTV - 5%
 */
export function calculateMaxBorrowable(
  collateralAmount: number,
  collateralPrice: number,
  loanTokenPrice: number,
  lltv: number // LLTV as decimal (e.g., 0.965 for 96.5%)
): number {
  if (!collateralAmount || !collateralPrice || !loanTokenPrice || !lltv) {
    return 0;
  }

  // Calculate safe LTV with safety buffer
  const safeLTV = calculateMaxSafeLTV(lltv);

  // Calculate collateral value in USD
  const collateralValueUSD = collateralAmount * collateralPrice;

  // Apply safe LTV to get max borrowable value in USD
  const maxBorrowableValueUSD = collateralValueUSD * safeLTV;

  // Convert to loan token amount
  const maxBorrowableAmount = maxBorrowableValueUSD / loanTokenPrice;

  return maxBorrowableAmount;
}

/**
 * Calculate current LTV ratio
 * Formula: LTV = (Borrowed Amount × Loan Token Price) / (Collateral Amount × Collateral Price)
 */
export function calculateCurrentLTV(
  borrowedAmount: number,
  loanTokenPrice: number,
  collateralAmount: number,
  collateralPrice: number
): number {
  console.log("=== calculateCurrentLTV DEBUG ===");
  console.log("Inputs:", {
    borrowedAmount,
    loanTokenPrice,
    collateralAmount,
    collateralPrice,
  });

  if (!collateralAmount || collateralAmount === 0) {
    console.log("Returning 0: No collateral");
    return 0;
  }

  if (!collateralPrice || collateralPrice === 0) {
    console.log("ERROR: collateralPrice is 0 or falsy");
    return 0;
  }

  const borrowedValueUSD = borrowedAmount * loanTokenPrice;
  const collateralValueUSD = collateralAmount * collateralPrice;

  console.log("Calculated values:", {
    borrowedValueUSD,
    collateralValueUSD,
  });

  const ltv = borrowedValueUSD / collateralValueUSD;
  console.log("Final LTV:", ltv, `(${(ltv * 100).toFixed(2)}%)`);

  return ltv;
}

/**
 * Calculate health factor
 * Formula: Health Factor = LLTV / Current LTV
 * Health Factor > 1 = Safe, Health Factor <= 1 = Liquidatable
 */
export function calculateHealthFactor(
  currentLTV: number,
  lltv: number
): number {
  if (!currentLTV) {
    return Infinity; // No debt = infinite health
  }

  return lltv / currentLTV;
}

/**
 * Check if a borrow amount would exceed the safe LTV limit
 */
export function isExceedingSafeLTV(
  projectedLTV: number,
  lltv: number
): boolean {
  const safeLTV = calculateMaxSafeLTV(lltv);
  return projectedLTV > safeLTV;
}

/**
 * Get risk level based on LTV ratio with updated thresholds
 */
export function getRiskLevel(
  currentLTV: number,
  lltv: number
): {
  level: "safe" | "moderate" | "risky" | "danger";
  color: string;
  description: string;
} {
  const safeLTV = calculateMaxSafeLTV(lltv);
  const ltvRatio = currentLTV / safeLTV;

  if (currentLTV <= safeLTV * 0.7) {
    return {
      level: "safe",
      color: "#4caf50",
      description: "Safe - Low liquidation risk",
    };
  } else if (currentLTV <= safeLTV * 0.85) {
    return {
      level: "moderate",
      color: "#ff9800",
      description: "Moderate - Monitor position",
    };
  } else if (currentLTV <= safeLTV) {
    return {
      level: "risky",
      color: "#f44336",
      description: "Risky - Approaching safety limit",
    };
  } else {
    return {
      level: "danger",
      color: "#d32f2f",
      description: "Danger - Exceeds safe borrowing limit",
    };
  }
}

/**
 * Format percentage with proper precision
 */
export function formatPercentage(value: number, decimals: number = 2): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Format number with proper precision
 */
export function formatNumber(value: number, decimals: number = 4): string {
  return value.toFixed(decimals);
}

/**
 * Get safety buffer information for display
 */
export function getSafetyBufferInfo(lltv: number) {
  const safeLTV = calculateMaxSafeLTV(lltv);
  return {
    safeLTV,
    buffer: SAFETY_BUFFER_PERCENTAGE,
    liquidationLTV: lltv,
    bufferPercentage: formatPercentage(SAFETY_BUFFER_PERCENTAGE),
  };
}
