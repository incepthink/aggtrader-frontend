// components/AmountInput.tsx
"use client";
import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  InputAdornment,
} from "@mui/material";

interface AmountInputProps {
  amount: string;
  onAmountChange: (value: string) => void;
  onMaxClick: () => void;
  symbol: string;
  balance: string;
  tokenPrice: number;
  isConnected: boolean;
  isLoadingBalance: boolean;
  mode?: "deposit" | "withdraw";
  userPosition?: number; // Token amount for validation
  userPositionUsd?: number; // USD amount for display
  walletError?: string | null; // Add wallet error prop
}

export const AmountInput: React.FC<AmountInputProps> = ({
  amount,
  onAmountChange,
  onMaxClick,
  symbol,
  balance,
  tokenPrice,
  isConnected,
  isLoadingBalance,
  mode = "deposit",
  userPosition = 0,
  userPositionUsd = 0,
  walletError = null,
}) => {
  const [isHydrated, setIsHydrated] = useState(false);

  // ✅ Hydration-safe flag
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // ✅ Enhanced wallet ready check
  const isWalletReady = Boolean(
    isHydrated &&
      typeof window !== "undefined" &&
      typeof window.ethereum !== "undefined" &&
      isConnected
  );

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;

    // Don't trigger any wallet operations if there's a wallet error
    if (walletError) {
      return;
    }

    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      try {
        onAmountChange(value);
      } catch (error) {
        console.warn("Error updating amount:", error);
      }
    }
  };

  const handleMaxClick = () => {
    // ✅ Enhanced wallet ready check
    if (
      !isWalletReady ||
      walletError ||
      typeof window.ethereum === "undefined"
    ) {
      console.warn("Cannot execute max click: wallet not ready");
      return;
    }

    if (!isConnected) {
      console.warn("Cannot execute max click: wallet not connected");
      return;
    }

    if (mode === "withdraw" && userPosition === 0) {
      console.warn("Cannot execute max click: no position available");
      return;
    }

    try {
      onMaxClick();
    } catch (error) {
      console.error("Error executing max click:", error);
    }
  };

  const depositAmount = parseFloat(amount) || 0;
  const usdValue = depositAmount * tokenPrice;

  // Get the appropriate balance to display
  const displayBalance = isLoadingBalance
    ? "Loading..."
    : mode === "withdraw"
    ? `${balance} ${symbol}` // For withdraw, balance already contains the withdrawable amount
    : `${balance} ${symbol}`;

  // For position display, show different info based on mode
  const getPositionDisplay = () => {
    if (walletError) {
      return "Wallet connection issue";
    }

    if (!isConnected) {
      return "Connect wallet to see balance";
    }

    if (!isWalletReady) {
      return "Wallet loading...";
    }

    if (isLoadingBalance) {
      return "Loading balance...";
    }

    if (mode === "withdraw") {
      return userPositionUsd > 0
        ? `Position: ${userPositionUsd.toFixed(
            2
          )} • Available: ${balance} ${symbol}`
        : "No position available";
    } else {
      return `Balance: ${balance} ${symbol}`;
    }
  };

  const isMaxButtonDisabled =
    !isWalletReady ||
    !isConnected ||
    isLoadingBalance ||
    walletError !== null ||
    (mode === "withdraw" && userPosition === 0);

  const getInputBorderColor = () => {
    if (walletError) return "#ef4444"; // Red for errors
    if (mode === "withdraw") return "#2d3748";
    return "#2d3748";
  };

  const getInputHoverColor = () => {
    if (walletError) return "#dc2626";
    if (mode === "withdraw") return "#3b82f6";
    return "#3b82f6";
  };

  const getInputFocusColor = () => {
    if (walletError) return "#dc2626";
    if (mode === "withdraw") return "#3b82f6";
    return "#3b82f6";
  };

  return (
    <Box sx={{ mb: 3 }}>
      {/* Show wallet error banner */}
      {walletError && (
        <Box
          sx={{
            mb: 2,
            p: 2,
            backgroundColor: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            borderRadius: 1,
          }}
        >
          <Typography variant="caption" sx={{ color: "#ef4444" }}>
            ⚠️ {walletError}
          </Typography>
        </Box>
      )}

      {/* Show wallet not ready banner */}
      {isConnected && !isWalletReady && !walletError && (
        <Box
          sx={{
            mb: 2,
            p: 2,
            backgroundColor: "rgba(59, 130, 246, 0.1)",
            border: "1px solid rgba(59, 130, 246, 0.3)",
            borderRadius: 1,
          }}
        >
          <Typography variant="caption" sx={{ color: "#3b82f6" }}>
            🔄 Wallet loading, please wait...
          </Typography>
        </Box>
      )}

      <TextField
        fullWidth
        placeholder="0.00"
        value={amount}
        onChange={handleChange}
        disabled={walletError !== null || !isWalletReady} // ✅ Disable when wallet not ready
        InputProps={{
          sx: {
            backgroundColor:
              walletError || !isWalletReady ? "#1a1a1a" : "#0f1419",
            color: walletError || !isWalletReady ? "#8b949e" : "white",
            fontSize: "28px",
            fontWeight: "bold",
            "& .MuiOutlinedInput-notchedOutline": {
              border: `1px solid ${getInputBorderColor()}`,
            },
            "&:hover .MuiOutlinedInput-notchedOutline": {
              border: `1px solid ${getInputHoverColor()}`,
            },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              border: `1px solid ${getInputFocusColor()}`,
            },
            "&.Mui-disabled": {
              opacity: 0.6,
            },
          },
          endAdornment: (
            <InputAdornment position="end">
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography sx={{ color: "#8b949e", fontSize: "16px" }}>
                  {symbol}
                </Typography>
                <Button
                  size="small"
                  onClick={handleMaxClick}
                  disabled={isMaxButtonDisabled}
                  sx={{
                    color:
                      walletError || !isWalletReady
                        ? "#6b7280"
                        : mode === "withdraw"
                        ? "#3b82f6"
                        : "#3b82f6",
                    textTransform: "none",
                    fontSize: "12px",
                    fontWeight: "bold",
                    minWidth: "auto",
                    p: 0.5,
                    "&:hover": {
                      backgroundColor:
                        walletError || !isWalletReady
                          ? "transparent"
                          : mode === "withdraw"
                          ? "rgba(239, 68, 68, 0.1)"
                          : "rgba(59, 130, 246, 0.1)",
                    },
                    "&:disabled": {
                      color: "#6b7280",
                    },
                  }}
                >
                  MAX
                </Button>
              </Box>
            </InputAdornment>
          ),
        }}
      />

      <Box sx={{ display: "flex", justifyContent: "space-between", mt: 1 }}>
        <Typography variant="caption" sx={{ color: "#8b949e" }}>
          ${usdValue.toFixed(2)}
        </Typography>
        <Typography variant="caption" sx={{ color: "#8b949e" }}>
          {getPositionDisplay()}
        </Typography>
      </Box>

      {/* Validation messages */}
      {amount && mode === "withdraw" && !walletError && isWalletReady && (
        <Box sx={{ mt: 1 }}>
          {parseFloat(amount) > userPosition && userPosition > 0 && (
            <Typography variant="caption" sx={{ color: "#ef4444" }}>
              Amount exceeds available balance ({userPosition.toFixed(4)}{" "}
              {symbol})
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
};
