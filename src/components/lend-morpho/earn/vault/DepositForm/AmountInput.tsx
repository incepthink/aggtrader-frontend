// components/AmountInput.tsx
"use client";
import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  InputAdornment,
  IconButton,
} from "@mui/material";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";

export type InputMode = "token" | "usd";

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
  inputMode?: InputMode;
  onToggleMode?: () => void;
  isLoadingPrice?: boolean;
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
  inputMode = "token",
  onToggleMode,
  isLoadingPrice = false,
}) => {
  const [isHydrated, setIsHydrated] = useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // ✅ Hydration-safe flag
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Focus handler
  const handleFocusInput = () => {
    inputRef.current?.focus();
  };

  // Expose onChange handler for Puppeteer automation
  useEffect(() => {
    if (inputRef.current && typeof window !== "undefined") {
      // Store the handler on the input element itself for Puppeteer access
      (inputRef.current as any).__reactOnChange = (value: string) => {
        if (value === "" || /^\d*\.?\d*$/.test(value)) {
          onAmountChange(value);
        }
      };
    }
  }, [onAmountChange]);

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

  // Get display value for secondary amount (similar to SwapInput)
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
      return `≈ $${usdValue.toFixed(2)}`;
    }
  };

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

      <Box sx={{ position: "relative" }}>
        {/* $ sign prefix when in USD mode - exactly like SwapInput */}
        {inputMode === "usd" && (
          <Typography
            data-testid="usd-prefix-symbol"
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
            backgroundColor:
              walletError || !isWalletReady ? "#1a1a1a" : "#0f1419",
            border: `1px solid ${getInputBorderColor()}`,
            borderRadius: "4px",
            padding: "16.5px 14px",
            paddingLeft: inputMode === "usd" ? "35px" : "14px",
            paddingRight: "14px",
            transition: "border-color 0.3s",
            "&:hover": {
              borderColor: getInputHoverColor(),
            },
            "&:focus-within": {
              borderColor: getInputFocusColor(),
            },
            opacity: walletError || !isWalletReady ? 0.6 : 1,
          }}
        >
          <input
            ref={inputRef}
            id="lend-input"
            data-testid="lend-deposit-input"
            data-input-mode={inputMode}
            aria-label={`${
              mode === "deposit" ? "Deposit" : "Withdraw"
            } amount in ${symbol}`}
            type="text"
            placeholder="0.00"
            value={amount}
            onChange={handleChange}
            // disabled={walletError !== null || !isWalletReady}
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              color: walletError || !isWalletReady ? "#8b949e" : "white",
              fontSize: "28px",
              fontWeight: "bold",
              fontFamily: "inherit",
              padding: 0,
              width: "100%",
            }}
          />
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, ml: 1 }}>
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
        </Box>
      </Box>

      <Box sx={{ display: "flex", justifyContent: "space-between", mt: 1 }}>
        {/* Price display with toggle button - exactly like SwapInput */}
        <Box
          id="deposit-amount-switch-container"
          sx={{ display: "flex", alignItems: "center", gap: 1 }}
        >
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
                  disabled={walletError !== null || !isWalletReady}
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
                  title={`Switch to ${
                    inputMode === "token" ? "USD" : "token"
                  } input`}
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
                  disabled={walletError !== null || !isWalletReady}
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
                  title={`Switch to ${
                    inputMode === "token" ? "USD" : "token"
                  } input`}
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
                  disabled={walletError !== null || !isWalletReady}
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
                  title={`Switch to ${
                    inputMode === "token" ? "USD" : "token"
                  } input`}
                >
                  <SwapHorizIcon sx={{ fontSize: 18 }} />
                </IconButton>
              )}
            </>
          )}
        </Box>
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

      {/* Focus Input Button */}
      <Box sx={{ mt: 2 }}>
        <Button
          variant="outlined"
          size="small"
          onClick={handleFocusInput}
          data-testid="focus-input-button"
          sx={{
            color: "#00F5E0",
            borderColor: "#00F5E0",
            textTransform: "none",
            fontSize: "12px",
            "&:hover": {
              borderColor: "#00F5E0",
              backgroundColor: "rgba(0, 245, 224, 0.1)",
            },
          }}
        >
          Focus Input (For Testing)
        </Button>
      </Box>
    </Box>
  );
};
