// /components/lend-morpho/borrow/market/BorrowForm/CollateralInput.tsx
"use client";

import React from "react";
import { Box, Typography, TextField, InputAdornment } from "@mui/material";
import { AccountBalanceWallet } from "@mui/icons-material";

interface CollateralInputProps {
  amount: string;
  onAmountChange: (amount: string) => void;
  onMaxClick: () => void;
  symbol: string;
  balance: string;
  tokenPrice: number;
  isConnected: boolean;
  isLoadingBalance: boolean;
  existingAmount?: number;
  showExisting?: boolean;
  mode?: string;
}

export const CollateralInput: React.FC<CollateralInputProps> = ({
  amount,
  onAmountChange,
  onMaxClick,
  symbol,
  balance,
  tokenPrice,
  isConnected,
  isLoadingBalance,
  existingAmount = 0,
  showExisting = false,
  mode,
}) => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      onAmountChange(value);
    }
  };

  const usdValue = (parseFloat(amount) || 0) * tokenPrice;

  const getBalanceDisplay = () => {
    if (!isConnected) {
      return "Connect wallet to see balance";
    }
    if (isLoadingBalance) {
      return "Loading balance...";
    }
    return `Balance: ${balance} ${symbol}`;
  };

  return (
    <Box sx={{ mb: 3 }}>
      {mode !== "repay" && (
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
          <Typography variant="body2" sx={{ color: "#8b949e" }}>
            Supply Collateral {symbol}
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: "#8b949e", fontSize: "12px" }}
          >
            {getBalanceDisplay()}
          </Typography>
        </Box>
      )}

      <TextField
        fullWidth
        value={amount}
        onChange={handleChange}
        placeholder="0.00"
        disabled={!isConnected}
        inputProps={{
          "data-testid": "collateral-input",
          "aria-label": `Supply collateral amount in ${symbol}`,
        }}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography
                  data-testid="collateral-max-button"
                  variant="body2"
                  sx={{
                    cursor:
                      isConnected && !isLoadingBalance ? "pointer" : "default",
                    color:
                      isConnected && !isLoadingBalance ? "#3b82f6" : "#8b949e",
                    fontWeight: "bold",
                    fontSize: "12px",
                    textTransform: "none",
                    "&:hover":
                      isConnected && !isLoadingBalance
                        ? {
                            backgroundColor: "rgba(59, 130, 246, 0.1)",
                          }
                        : {},
                    p: 0.5,
                    borderRadius: 1,
                  }}
                  onClick={
                    isConnected && !isLoadingBalance ? onMaxClick : undefined
                  }
                >
                  MAX
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: "#8b949e", fontSize: "16px" }}
                >
                  {symbol}
                </Typography>
              </Box>
            </InputAdornment>
          ),
        }}
        sx={{
          "& .MuiOutlinedInput-root": {
            fontSize: "28px",
            fontWeight: "bold",
            backgroundColor: "#0f1419",
            color: "white",
            "& fieldset": {
              borderColor: "#2d3748",
            },
            "&:hover fieldset": {
              borderColor: "#3b82f6",
            },
            "&.Mui-focused fieldset": {
              borderColor: "#3b82f6",
            },
            "&.Mui-disabled": {
              opacity: 0.6,
              "& fieldset": {
                borderColor: "#2d3748",
              },
            },
          },
          "& .MuiInputBase-input": {
            "&::placeholder": {
              color: "#8b949e",
              opacity: 1,
            },
            "&.Mui-disabled": {
              color: "#8b949e",
              WebkitTextFillColor: "#8b949e",
            },
          },
        }}
      />

      <Box sx={{ display: "flex", justifyContent: "space-between", mt: 1 }}>
        <Typography variant="caption" sx={{ color: "#8b949e" }}>
          ${usdValue.toFixed(2)}
        </Typography>
        {amount && parseFloat(amount) > parseFloat(balance) && isConnected && (
          <Typography variant="caption" sx={{ color: "#ef4444" }}>
            Insufficient balance
          </Typography>
        )}
      </Box>
    </Box>
  );
};
