import { formatUnits, parseUnits } from "viem";
import type { Token } from "../types";

/**
 * Format amount with proper decimal places
 */
export function formatAmount(amount: string | number, decimals: number = 6): string {
  if (!amount || amount === "0") return "0";
  
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  
  if (isNaN(num)) return "0";
  
  return num.toFixed(decimals);
}

/**
 * Calculate price impact percentage
 */
export function calculatePriceImpact(
  inputAmount: string,
  outputAmount: string,
  marketPrice: number
): number {
  if (!inputAmount || !outputAmount || !marketPrice) return 0;

  const actualPrice = parseFloat(outputAmount) / parseFloat(inputAmount);
  const impact = ((actualPrice - marketPrice) / marketPrice) * 100;

  return Math.abs(impact);
}

/**
 * Calculate minimum amount received after slippage
 */
export function calculateMinReceived(
  amount: string,
  slippage: number,
  decimals: number = 6
): string {
  if (!amount || parseFloat(amount) === 0) return "0";

  const amountNum = parseFloat(amount);
  const slippageMultiplier = 1 - slippage / 100;
  const minReceived = amountNum * slippageMultiplier;

  return formatAmount(minReceived, decimals);
}

/**
 * Validate if amount is valid for swap
 */
export function isValidSwapAmount(amount: string): boolean {
  if (!amount || amount === "") return false;
  
  const num = parseFloat(amount);
  
  return !isNaN(num) && num > 0;
}

/**
 * Format token amount from wei/smallest unit
 */
export function formatTokenAmount(
  amount: bigint | string,
  decimals: number,
  displayDecimals: number = 6
): string {
  try {
    const formatted = formatUnits(BigInt(amount), decimals);
    return formatAmount(formatted, displayDecimals);
  } catch (error) {
    console.error("Error formatting token amount:", error);
    return "0";
  }
}

/**
 * Parse token amount to wei/smallest unit
 */
export function parseTokenAmount(amount: string, decimals: number): bigint {
  try {
    if (!amount || amount === "") return BigInt(0);
    return parseUnits(amount, decimals);
  } catch (error) {
    console.error("Error parsing token amount:", error);
    return BigInt(0);
  }
}

/**
 * Check if user has sufficient balance
 */
export function hasSufficientBalance(
  amount: string,
  balance: string | undefined
): boolean {
  if (!balance || !amount) return false;
  
  const amountNum = parseFloat(amount);
  const balanceNum = parseFloat(balance);
  
  return !isNaN(amountNum) && !isNaN(balanceNum) && balanceNum >= amountNum;
}

/**
 * Format USD value
 */
export function formatUSD(value: number | null): string {
  if (value === null || isNaN(value)) return "$0.00";
  
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Calculate total value in USD
 */
export function calculateUSDValue(
  amount: string,
  price: number | null
): number | null {
  if (!amount || !price) return null;
  
  const amountNum = parseFloat(amount);
  if (isNaN(amountNum)) return null;
  
  return amountNum * price;
}