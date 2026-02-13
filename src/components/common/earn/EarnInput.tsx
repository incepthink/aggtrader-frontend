"use client";

import React, { useState, useCallback } from "react";
import { Box, Typography, IconButton } from "@mui/material";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import "@/components/spot/index.css";
import { getToken } from "@/utils/katanaTokens";

export type InputMode = "token" | "usd";

interface EarnInputProps {
  // Core (required)
  amount: string;
  onAmountChange: (value: string) => void;
  symbol: string;
  balance: string;
  tokenPrice: number;
  isConnected: boolean;

  // Optional features — presence enables the feature
  onMaxClick?: () => void;
  maxButtonColor?: string; // default "#3b82f6"
  maxButtonHoverBg?: string; // default "rgba(59, 130, 246, 0.1)"
  isLoadingBalance?: boolean;
  isLoadingPrice?: boolean;
  balanceLabel?: string; // default "Balance"
  disabled?: boolean;

  // Render slots for feature-specific extras
  title?: React.ReactNode;

  // Pass-through for testing / automation
  dataTestId?: string;
  inputRef?: React.Ref<HTMLInputElement>;
  errorDisplay?: React.ReactNode;
  topSlot?: React.ReactNode;
}

const EarnInput: React.FC<EarnInputProps> = ({
  amount,
  onAmountChange,
  symbol,
  balance,
  tokenPrice,
  isConnected,
  onMaxClick,
  maxButtonColor = "#3b82f6",
  maxButtonHoverBg = "rgba(59, 130, 246, 0.1)",
  isLoadingBalance = false,
  isLoadingPrice = false,
  balanceLabel = "Balance",
  disabled = false,
  title,
  dataTestId,
  inputRef,
  errorDisplay,
  topSlot,
}) => {
  const [inputMode, setInputMode] = useState<InputMode>("token");

  // get token image from utils/katanaTokens.ts
  const { image: assetLogo } = getToken(symbol) || {};

  const handleToggleMode = useCallback(() => {
    if (!amount || !tokenPrice) {
      setInputMode((prev) => (prev === "token" ? "usd" : "token"));
      return;
    }

    const tokenValue = parseFloat(amount);
    if (isNaN(tokenValue)) {
      setInputMode((prev) => (prev === "token" ? "usd" : "token"));
      return;
    }

    if (inputMode === "token") {
      const usdValue = tokenValue * tokenPrice;
      onAmountChange((usdValue / tokenPrice).toString());
      setInputMode("usd");
    } else {
      setInputMode("token");
    }
  }, [inputMode, amount, tokenPrice, onAmountChange]);

  const isDisabled = disabled || !isConnected;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      onAmountChange(value);
    }
  };

  // Secondary display: token→USD or USD→token
  const getSecondaryDisplay = () => {
    if (!amount || !tokenPrice) return null;
    const num = parseFloat(amount);
    if (isNaN(num)) return null;

    if (inputMode === "usd") {
      const tokenAmount = num / tokenPrice;
      return `≈ ${tokenAmount.toFixed(6)} ${symbol}`;
    }
    const usdValue = num * tokenPrice;
    return `≈ $${usdValue.toFixed(2)}`;
  };

  // Balance line text
  const getBalanceText = () => {
    if (!isConnected) return "Connect wallet to see balance";
    if (isLoadingBalance) return "Loading balance...";
    return `${balanceLabel}: ${balance} ${symbol}`;
  };

  // Toggle button (shared across loading / normal / unavailable states)
  const toggleButton = (
    <IconButton
      onClick={handleToggleMode}
      disabled={isDisabled}
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
  );

  return (
    <div className="input-container mb-4 px-2 pb-2">
      {/* ---------- title slot (labels, error banners, etc.) ---------- */}
      <div className="absolute text-[#00F5E0]">{title}</div>

      {/* ---------- Top slot (labels, error banners, etc.) ---------- */}
      <div className="absolute right-4">{topSlot}</div>
      {/* ---------- input row ---------- */}
      <Box sx={{ position: "relative" }}>
        {/* USD prefix */}
        {inputMode === "usd" && (
          <span
            className="absolute left-[12px] text-white pointer-events-none z-10"
            style={{ fontSize: "35px", lineHeight: "96px" }}
          >
            $
          </span>
        )}

        <input
          ref={inputRef}
          data-testid={dataTestId}
          data-input-mode={inputMode}
          type="text"
          placeholder="0.00"
          value={amount}
          onChange={handleChange}
          disabled={isDisabled}
          style={{
            width: "100%",
            background: "transparent",
            border: "none",
            outline: "none",
            color: isDisabled ? "#8b949e" : "white",
            height: "96px",
            fontSize: "35px",
            fontWeight: "bold",
            fontFamily: "inherit",
            padding: 0,
            paddingLeft: inputMode === "usd" ? "35px" : "12px",
            paddingRight: "120px",
            marginBottom: "5px",
            borderRadius: "12px",
            opacity: isDisabled ? 0.6 : 1,
          }}
        />

        {/* Right side: MAX + Symbol */}
        <Box
          sx={{
            position: "absolute",
            top: "32px",
            right: "20px",
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          {onMaxClick && (
            <span
              className="max text-xs"
              onClick={isDisabled ? undefined : onMaxClick}
            >
              MAX
            </span>
          )}
          {assetLogo ? (
            <div>
              <img
                src={assetLogo}
                alt={symbol}
                className="md:w-6 md:h-6 w-4 h-4"
              />
            </div>
          ) : (
            <Typography sx={{ color: "#8b949e", fontSize: "16px" }}>
              {symbol}
            </Typography>
          )}
        </Box>
      </Box>

      {/* ---------- price display + toggle (like SwapInput) ---------- */}
      <div className="flex w-full justify-between items-center -mt-5 px-3">
        <div className="flex items-center gap-2 text-sm text-gray-300 font-medium">
          {errorDisplay ? (
            errorDisplay
          ) : isLoadingPrice ? (
            <>
              <div className="animate-pulse bg-gray-600 h-4 w-16 rounded"></div>
              {toggleButton}
            </>
          ) : tokenPrice > 0 ? (
            <>
              {amount && <span>{getSecondaryDisplay()}</span>}
              {toggleButton}
            </>
          ) : (
            <>
              <div className="text-gray-500">Price unavailable</div>
              {toggleButton}
            </>
          )}
        </div>
        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
          <Typography variant="caption" sx={{ color: "#8b949e" }}>
            {getBalanceText()}
          </Typography>
        </Box>
      </div>

      {/* ---------- balance row ---------- */}

      {/* ---------- bottom slot (validation messages, suggested amounts) ---------- */}
    </div>
  );
};

export default EarnInput;
