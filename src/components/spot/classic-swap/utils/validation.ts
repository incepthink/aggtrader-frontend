import type { Token, SwapParams } from "../types";

/**
 * Validation error messages
 */
export const ValidationErrors = {
  INSUFFICIENT_BALANCE: "Insufficient balance",
  INVALID_AMOUNT: "Invalid amount",
  AMOUNT_TOO_LOW: "Amount too low",
  AMOUNT_TOO_HIGH: "Amount too high",
  SAME_TOKEN: "Cannot swap same token",
  NO_LIQUIDITY: "Insufficient liquidity",
  PRICE_IMPACT_HIGH: "Price impact too high",
  SLIPPAGE_INVALID: "Invalid slippage value",
} as const;

/**
 * Validate swap parameters
 */
export function validateSwapParams(params: SwapParams): {
  isValid: boolean;
  error?: string;
} {
  const { tokenIn, tokenOut, amount, slippage } = params;

  // Check if tokens are different
  if (tokenIn.address.toLowerCase() === tokenOut.address.toLowerCase()) {
    return {
      isValid: false,
      error: ValidationErrors.SAME_TOKEN,
    };
  }

  // Validate amount
  const amountNum = parseFloat(amount);
  if (isNaN(amountNum) || amountNum <= 0) {
    return {
      isValid: false,
      error: ValidationErrors.INVALID_AMOUNT,
    };
  }

  // Validate slippage
  if (isNaN(slippage) || slippage < 0 || slippage > 50) {
    return {
      isValid: false,
      error: ValidationErrors.SLIPPAGE_INVALID,
    };
  }

  return { isValid: true };
}

/**
 * Validate balance is sufficient
 */
export function validateBalance(
  amount: string,
  balance: string | undefined
): {
  isValid: boolean;
  error?: string;
} {
  if (!balance) {
    return {
      isValid: false,
      error: "Balance unavailable",
    };
  }

  const amountNum = parseFloat(amount);
  const balanceNum = parseFloat(balance);

  if (isNaN(amountNum) || isNaN(balanceNum)) {
    return {
      isValid: false,
      error: ValidationErrors.INVALID_AMOUNT,
    };
  }

  if (balanceNum < amountNum) {
    return {
      isValid: false,
      error: ValidationErrors.INSUFFICIENT_BALANCE,
    };
  }

  return { isValid: true };
}

/**
 * Validate price impact is acceptable
 */
export function validatePriceImpact(
  priceImpact: number,
  maxImpact: number = 15
): {
  isValid: boolean;
  error?: string;
  warning?: string;
} {
  if (priceImpact > maxImpact) {
    return {
      isValid: false,
      error: ValidationErrors.PRICE_IMPACT_HIGH,
    };
  }

  if (priceImpact > 5) {
    return {
      isValid: true,
      warning: "High price impact",
    };
  }

  return { isValid: true };
}

/**
 * Check if amount is within acceptable range
 */
export function validateAmountRange(
  amount: string,
  minAmount: number = 0.000001,
  maxAmount?: number
): {
  isValid: boolean;
  error?: string;
} {
  const amountNum = parseFloat(amount);

  if (isNaN(amountNum)) {
    return {
      isValid: false,
      error: ValidationErrors.INVALID_AMOUNT,
    };
  }

  if (amountNum < minAmount) {
    return {
      isValid: false,
      error: ValidationErrors.AMOUNT_TOO_LOW,
    };
  }

  if (maxAmount && amountNum > maxAmount) {
    return {
      isValid: false,
      error: ValidationErrors.AMOUNT_TOO_HIGH,
    };
  }

  return { isValid: true };
}