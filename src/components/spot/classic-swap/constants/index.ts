/**
 * Constants for Classic Swap
 */

// Slippage options (in percentage)
export const SLIPPAGE_OPTIONS = [0.5, 1.0, 2.5, 5.0] as const;

// Default slippage
export const DEFAULT_SLIPPAGE = 2.5;

// Maximum slippage allowed
export const MAX_SLIPPAGE = 50;

// Minimum slippage allowed
export const MIN_SLIPPAGE = 0.1;

// Quote refresh interval (milliseconds)
export const QUOTE_REFRESH_INTERVAL = 30000;

// Debounce delay for quote fetching (milliseconds)
export const QUOTE_DEBOUNCE_DELAY = 500;

// Maximum price impact warning threshold (percentage)
export const PRICE_IMPACT_WARNING_THRESHOLD = 5;

// Maximum price impact error threshold (percentage)
export const PRICE_IMPACT_ERROR_THRESHOLD = 15;

// Minimum trade amount (in native token units)
export const MIN_TRADE_AMOUNT = 0.000001;

// Number of decimal places for display
export const DISPLAY_DECIMALS = 6;

// Transaction deadline (minutes)
export const TRANSACTION_DEADLINE = 20;

// Gas estimation multiplier for safety
export const GAS_MULTIPLIER = 1.2;

// Retry attempts for failed quotes
export const MAX_QUOTE_RETRIES = 3;

// Retry delay (milliseconds)
export const RETRY_DELAY = 1000;

// Token approval amount (max uint256)
export const MAX_APPROVAL_AMOUNT = "115792089237316195423570985008687907853269984665640564039457584007913129639935";

// Notification duration (milliseconds)
export const NOTIFICATION_DURATION = 4000;

// Supported chains
export const SUPPORTED_CHAINS = {
  ETHEREUM: 1,
  ARBITRUM: 42161,
  POLYGON: 137,
  OPTIMISM: 10,
  BASE: 8453,
} as const;

// Chain names
export const CHAIN_NAMES: Record<number, string> = {
  1: "Ethereum",
  42161: "Arbitrum",
  137: "Polygon",
  10: "Optimism",
  8453: "Base",
};

// Error messages
export const ERROR_MESSAGES = {
  WALLET_NOT_CONNECTED: "Please connect your wallet",
  INSUFFICIENT_BALANCE: "Insufficient balance",
  INVALID_AMOUNT: "Please enter a valid amount",
  QUOTE_FAILED: "Failed to get quote",
  SWAP_FAILED: "Swap failed",
  TRANSACTION_REJECTED: "Transaction rejected by user",
  NETWORK_ERROR: "Network error, please try again",
  SLIPPAGE_ERROR: "Slippage tolerance exceeded",
} as const;