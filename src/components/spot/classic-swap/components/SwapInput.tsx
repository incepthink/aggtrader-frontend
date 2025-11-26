// components/swap/SwapInput.tsx
"use client";

import { Input } from "antd";
import React from "react";
import { IconButton } from "@mui/material";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import { formatUSDPrice } from "@/utils/spot/swapUtils";
import { Token } from "@/hooks/sushiswap/useSwapPrices";

export type InputMode = "token" | "usd";

interface SwapInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled: boolean;
  placeholder?: string;
  label: string;
  showPrice?: boolean;
  price?: number | null;
  isLoadingPrice?: boolean;
  inputMode?: InputMode;
  onToggleMode?: () => void;
  token: Token;
}

export const SwapInput: React.FC<SwapInputProps> = ({
  value,
  onChange,
  disabled,
  placeholder,
  label,
  showPrice = false,
  price,
  isLoadingPrice = false,
  inputMode = "token",
  onToggleMode,
  token,
}) => {
  const getPlaceholder = () => {
    if (placeholder) return placeholder;
    return inputMode === "usd" ? "0.00" : "0";
  };

  const getDisplayValue = () => {
    if (!value || !price) return null;
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return null;

    if (inputMode === "usd") {
      // When in USD mode, show token amount as secondary
      const tokenAmount = numValue / price;
      return `≈ ${tokenAmount.toFixed(6)} ${token.ticker}`;
    } else {
      // When in token mode, show USD amount as secondary
      return `≈ $${formatUSDPrice(numValue, price)}`;
    }
  };

  return (
    <div className="input-container">
      {inputMode === "usd" && (
        <span
          className="absolute left-[12px] text-white pointer-events-none z-10"
          style={{ top: "13px", fontSize: "35px", lineHeight: "96px" }}
        >
          $
        </span>
      )}
      <Input
        id={label === "Sell" ? "amount-input-sell" : "amount-input-buy"}
        placeholder={getPlaceholder()}
        value={value}
        onChange={onChange}
        disabled={disabled}
        type="number"
        onWheel={(e) => e.currentTarget.blur()}
        style={{
          paddingLeft: inputMode === "usd" ? "35px" : "12px",
          paddingRight: "120px",
        }}
        className="outline-none focus:outline-none! focus:ring-0! focus:border-transparent focus:shadow-none [&.ant-input:focus]:outline-none [&.ant-input:focus]:shadow-none [&.ant-input:focus]:border-transparent [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-inner-spin-button]:m-0"
      />
      <span className="input-tag">{label}</span>

      {/* Price display with toggle button */}
      {showPrice && (
        <div className="flex items-center gap-2 text-sm text-gray-300 font-medium -mt-5 mb-2 px-3">
          {isLoadingPrice ? (
            <>
              <div className="animate-pulse bg-gray-600 h-4 w-16 rounded"></div>
              {onToggleMode && (
                <IconButton
                  id={
                    label === "Sell" ? "switch-input-sell" : "switch-input-buy"
                  }
                  onClick={onToggleMode}
                  disabled={disabled}
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
          ) : price !== null ? (
            <>
              {value && <span>{getDisplayValue()}</span>}
              {onToggleMode && (
                <IconButton
                  id={
                    label === "Sell" ? "switch-input-sell" : "switch-input-buy"
                  }
                  onClick={onToggleMode}
                  disabled={disabled}
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
              <div className="text-gray-500">Price unavailable</div>
              {onToggleMode && (
                <IconButton
                  id={
                    label === "Sell" ? "switch-input-sell" : "switch-input-buy"
                  }
                  onClick={onToggleMode}
                  disabled={disabled}
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
        </div>
      )}
    </div>
  );
};
