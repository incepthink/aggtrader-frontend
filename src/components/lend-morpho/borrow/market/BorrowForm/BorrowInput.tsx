// /components/lend-morpho/borrow/market/BorrowForm/BorrowInput.tsx
"use client";

import React from "react";
import { Box, Typography, TextField, InputAdornment, IconButton } from "@mui/material";
import { AccountBalanceWallet } from "@mui/icons-material";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";

export type InputMode = "token" | "usd";

interface BorrowInputProps {
  amount: string;
  onAmountChange: (amount: string) => void;
  symbol: string;
  balance: string;
  tokenPrice: number;
  isConnected: boolean;
  maxBorrowable?: string;
  mode: "borrow" | "repay";
  onMaxClick?: () => void;
  suggestedAmount?: number; // New prop for suggested borrowable amount
  collateralAmount?: string; // New prop to show collateral context

  existingAmount?: number;
  showExisting?: boolean;

  inputMode?: InputMode;
  onToggleMode?: () => void;
  isLoadingPrice?: boolean;
}

export const BorrowInput: React.FC<BorrowInputProps> = ({
  amount,
  onAmountChange,
  symbol,
  balance,
  tokenPrice,
  isConnected,
  maxBorrowable,
  mode,
  onMaxClick,
  suggestedAmount,
  collateralAmount,
  existingAmount = 0,
  showExisting = false,
  inputMode = "token",
  onToggleMode,
  isLoadingPrice = false,
}) => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      onAmountChange(value);
    }
  };

  // Get display value for secondary amount (similar to AmountInput)
  const getDisplayValue = () => {
    if (!amount || !tokenPrice) return null;
    const numValue = parseFloat(amount);
    if (isNaN(numValue)) return null;

    if (inputMode === "usd") {
      // When in USD mode, show token amount as secondary
      const tokenAmount = numValue / tokenPrice;
      return `≈ ${tokenAmount.toFixed(6)} ${symbol}`;
    } else {
      // When in token mode, show USD amount as secondary
      const usdValue = numValue * tokenPrice;
      return `≈ $${usdValue.toFixed(2)}`;
    }
  };

  const usdValue = (parseFloat(amount) || 0) * tokenPrice;
  const displayBalance = mode === "repay" ? maxBorrowable || "0.00" : balance;

  const getBalanceDisplay = () => {
    if (!isConnected) {
      return "Connect wallet to see balance";
    }

    if (mode === "repay") {
      return `Current debt: ${displayBalance} ${symbol}`;
    } else {
      return `Balance: ${displayBalance} ${symbol}`;
    }
  };

  const getSuggestedAmountDisplay = () => {
    if (
      mode === "borrow" &&
      suggestedAmount &&
      suggestedAmount > 0 &&
      collateralAmount &&
      parseFloat(collateralAmount) > 0
    ) {
      return `Max borrowable: ${suggestedAmount.toFixed(4)} ${symbol}`;
    }
    return null;
  };

  const handleSuggestedClick = () => {
    if (suggestedAmount && suggestedAmount > 0) {
      onAmountChange(suggestedAmount.toFixed(6));
    }
  };

  return (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
        <Typography variant="body2" sx={{ color: "#8b949e" }}>
          {mode === "borrow" ? `Borrow ${symbol}` : `Repay ${symbol}`}
        </Typography>
        <Typography variant="body2" sx={{ color: "#8b949e", fontSize: "12px" }}>
          {getBalanceDisplay()}
        </Typography>
      </Box>

      <Box sx={{ position: "relative" }}>
        {/* $ sign prefix when in USD mode - exactly like AmountInput */}
        {inputMode === "usd" && (
          <Typography
            data-testid="borrow-usd-prefix-symbol"
            sx={{
              position: "absolute",
              left: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "white",
              fontSize: "28px",
              fontWeight: "bold",
              pointerEvents: "none",
              zIndex: 1,
            }}
          >
            $
          </Typography>
        )}

        <Box
          sx={{
            position: "relative",
            width: "100%",
            display: "flex",
            alignItems: "center",
            backgroundColor: !isConnected ? "#1a1a1a" : "#0f1419",
            border: `1px solid ${mode === "repay" ? "#2d3748" : "#2d3748"}`,
            borderRadius: "4px",
            padding: "16.5px 14px",
            paddingLeft: inputMode === "usd" ? "35px" : "14px",
            paddingRight: "14px",
            transition: "border-color 0.3s",
            "&:hover": {
              borderColor: mode === "repay" ? "#3b82f6" : "#3b82f6",
            },
            "&:focus-within": {
              borderColor: mode === "repay" ? "#3b82f6" : "#3b82f6",
            },
            opacity: !isConnected ? 0.6 : 1,
          }}
        >
          <input
            data-testid={mode === "borrow" ? "borrow-input" : "repay-input"}
            data-input-mode={inputMode}
            aria-label={`${mode === "borrow" ? "Borrow" : "Repay"} amount in ${symbol}`}
            type="text"
            placeholder="0.00"
            value={amount}
            onChange={handleChange}
            disabled={!isConnected}
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              color: !isConnected ? "#8b949e" : "white",
              fontSize: "28px",
              fontWeight: "bold",
              fontFamily: "inherit",
              padding: 0,
              width: "100%",
            }}
          />
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, ml: 1 }}>
            {mode === "repay" && onMaxClick && (
              <Typography
                variant="body2"
                sx={{
                  cursor: isConnected ? "pointer" : "default",
                  color: isConnected ? "#ef4444" : "#8b949e",
                  fontWeight: "bold",
                  fontSize: "12px",
                  textTransform: "none",
                  "&:hover": isConnected
                    ? {
                        backgroundColor: "rgba(239, 68, 68, 0.1)",
                      }
                    : {},
                  p: 0.5,
                  borderRadius: 1,
                }}
                onClick={isConnected ? onMaxClick : undefined}
              >
                MAX
              </Typography>
            )}
            <Typography
              variant="body2"
              sx={{ color: "#8b949e", fontSize: "16px" }}
            >
              {symbol}
            </Typography>
          </Box>
        </Box>
      </Box>

      <Box sx={{ display: "flex", justifyContent: "space-between", mt: 1 }}>
        {/* Price display with toggle button - exactly like AmountInput */}
        <Box id="borrow-amount-switch-container" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {isLoadingPrice ? (
            <>
              <Box
                sx={{
                  height: "16px",
                  width: "64px",
                  backgroundColor: "#4b5563",
                  borderRadius: "4px",
                  animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                  "@keyframes pulse": {
                    "0%, 100%": { opacity: 1 },
                    "50%": { opacity: 0.5 },
                  },
                }}
              />
              {onToggleMode && (
                <IconButton
                  onClick={onToggleMode}
                  disabled={!isConnected}
                  size="small"
                  sx={{
                    padding: "2px",
                    color: "rgba(255, 255, 255, 0.7)",
                    "&:hover": {
                      color: "#00F5E0",
                      backgroundColor: "rgba(0, 245, 224, 0.1)",
                    },
                    "&:disabled": {
                      color: "rgba(255, 255, 255, 0.3)",
                    },
                  }}
                  title={`Switch to ${inputMode === "token" ? "USD" : "token"} input`}
                >
                  <SwapHorizIcon sx={{ fontSize: 18 }} />
                </IconButton>
              )}
            </>
          ) : tokenPrice !== null && tokenPrice > 0 ? (
            <>
              {amount && (
                <Typography variant="caption" sx={{ color: "#8b949e" }}>
                  {getDisplayValue()}
                </Typography>
              )}
              {onToggleMode && (
                <IconButton
                  onClick={onToggleMode}
                  disabled={!isConnected}
                  size="small"
                  sx={{
                    padding: "2px",
                    color: "rgba(255, 255, 255, 0.7)",
                    "&:hover": {
                      color: "#00F5E0",
                      backgroundColor: "rgba(0, 245, 224, 0.1)",
                    },
                    "&:disabled": {
                      color: "rgba(255, 255, 255, 0.3)",
                    },
                  }}
                  title={`Switch to ${inputMode === "token" ? "USD" : "token"} input`}
                >
                  <SwapHorizIcon sx={{ fontSize: 18 }} />
                </IconButton>
              )}
            </>
          ) : (
            <>
              <Typography variant="caption" sx={{ color: "#6b7280" }}>
                Price unavailable
              </Typography>
              {onToggleMode && (
                <IconButton
                  onClick={onToggleMode}
                  disabled={!isConnected}
                  size="small"
                  sx={{
                    padding: "2px",
                    color: "rgba(255, 255, 255, 0.7)",
                    "&:hover": {
                      color: "#00F5E0",
                      backgroundColor: "rgba(0, 245, 224, 0.1)",
                    },
                    "&:disabled": {
                      color: "rgba(255, 255, 255, 0.3)",
                    },
                  }}
                  title={`Switch to ${inputMode === "token" ? "USD" : "token"} input`}
                >
                  <SwapHorizIcon sx={{ fontSize: 18 }} />
                </IconButton>
              )}
            </>
          )}
        </Box>

        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
          }}
        >
          {/* Suggested amount display */}
          {getSuggestedAmountDisplay() && (
            <Typography
              variant="caption"
              sx={{
                color: "#3b82f6",
                cursor: "pointer",
                "&:hover": {
                  textDecoration: "underline",
                },
              }}
              onClick={handleSuggestedClick}
            >
              {getSuggestedAmountDisplay()}
            </Typography>
          )}

          {/* Validation messages */}
          {amount &&
            mode === "repay" &&
            parseFloat(amount) > parseFloat(maxBorrowable || "0") && (
              <Typography variant="caption" sx={{ color: "#ef4444" }}>
                Amount exceeds debt
              </Typography>
            )}

          {amount &&
            mode === "borrow" &&
            suggestedAmount &&
            parseFloat(amount) > suggestedAmount && (
              <Typography variant="caption" sx={{ color: "#ef4444" }}>
                Exceeds max borrowable
              </Typography>
            )}
        </Box>
      </Box>
    </Box>
  );
};
