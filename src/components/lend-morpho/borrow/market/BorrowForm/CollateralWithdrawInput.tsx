// /components/lend-morpho/borrow/market/BorrowForm/CollateralWithdrawInput.tsx
"use client";

import React from "react";
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  FormControlLabel,
  Radio,
} from "@mui/material";

interface CollateralWithdrawInputProps {
  amount: string;
  onAmountChange: (amount: string) => void;
  onMaxClick: () => void;
  symbol: string;
  balance: string;
  tokenPrice: number;
  isConnected: boolean;
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
}

export const CollateralWithdrawInput: React.FC<
  CollateralWithdrawInputProps
> = ({
  amount,
  onAmountChange,
  onMaxClick,
  symbol,
  balance,
  tokenPrice,
  isConnected,
  enabled,
  onEnabledChange,
}) => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      onAmountChange(value);
    }
  };

  const usdValue = (parseFloat(amount) || 0) * tokenPrice;

  return (
    <Box sx={{ mb: 3 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 1,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <FormControlLabel
            control={
              <Radio
                checked={enabled}
                onChange={() => onEnabledChange(!enabled)}
                sx={{
                  color: "#3b82f6",
                  "&.Mui-checked": { color: "#3b82f6" },
                  p: 0.5,
                }}
              />
            }
            label=""
            sx={{ m: 0 }}
          />
          <Typography variant="body2" sx={{ color: "#8b949e" }}>
            Withdraw Collateral {symbol}
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ color: "#8b949e", fontSize: "12px" }}>
          {balance} {symbol}
        </Typography>
      </Box>

      <TextField
        fullWidth
        value={amount}
        onChange={handleChange}
        placeholder="0.00"
        disabled={!isConnected || !enabled}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography
                  variant="body2"
                  sx={{
                    cursor: isConnected && enabled ? "pointer" : "default",
                    color: isConnected && enabled ? "#3b82f6" : "#8b949e",
                    fontWeight: "bold",
                    fontSize: "12px",
                    "&:hover":
                      isConnected && enabled
                        ? {
                            backgroundColor: "rgba(59, 130, 246, 0.1)",
                          }
                        : {},
                    p: 0.5,
                    borderRadius: 1,
                  }}
                  onClick={isConnected && enabled ? onMaxClick : undefined}
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
              borderColor: enabled ? "#3b82f6" : "#2d3748",
            },
            "&:hover fieldset": {
              borderColor: enabled ? "#2563eb" : "#3b82f6",
            },
            "&.Mui-focused fieldset": {
              borderColor: enabled ? "#2563eb" : "#3b82f6",
            },
            "&.Mui-disabled": {
              opacity: 0.6,
              "& fieldset": { borderColor: "#2d3748" },
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
        {amount &&
          parseFloat(amount) > parseFloat(balance) &&
          isConnected &&
          enabled && (
            <Typography variant="caption" sx={{ color: "#ef4444" }}>
              Insufficient balance
            </Typography>
          )}
      </Box>
    </Box>
  );
};
