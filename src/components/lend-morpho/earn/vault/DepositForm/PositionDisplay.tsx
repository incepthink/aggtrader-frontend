// components/PositionDisplay.tsx - Updated with decimals support
"use client";
import React from "react";
import { Box, Typography, Chip } from "@mui/material";
import InfoIcon from "@mui/icons-material/Info";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";

interface PositionDisplayProps {
  symbol: string;
  currentPosition: number;
  projectedPosition: number;
  currentPositionUsd?: number;
  projectedPositionUsd?: number;
  netApy: number;
  dailyApy: number;
  mode?: "deposit" | "withdraw";
  decimals?: number; // ✅ Add decimals prop
}

export const PositionDisplay: React.FC<PositionDisplayProps> = ({
  symbol,
  currentPosition,
  projectedPosition,
  currentPositionUsd = 0,
  projectedPositionUsd = 0,
  netApy,
  dailyApy,
  mode = "deposit",
  decimals = 18, // ✅ Default to 18
}) => {
  const hasChange = projectedPosition !== currentPosition;
  const changeColor = mode === "withdraw" ? "#ef4444" : "#4caf50";
  const changeIcon =
    mode === "withdraw" ? <TrendingDownIcon /> : <TrendingUpIcon />;

  // ✅ Smart formatting based on token decimals and amount size
  const formatTokenAmount = (amount: number | undefined | null): string => {
    if (!amount || amount === 0) return "0.00";

    // For very high precision tokens (18+ decimals)
    if (decimals >= 18) {
      if (amount < 0.000001) return amount.toFixed(8); // Very small amounts
      if (amount < 0.0001) return amount.toFixed(6);
      if (amount < 0.01) return amount.toFixed(4);
      if (amount < 1) return amount.toFixed(3);
      if (amount < 1000) return amount.toFixed(2);
      if (amount < 1000000) return (amount / 1000).toFixed(2);
      return (amount / 1000000).toFixed(2);
    }

    // For medium precision tokens (6-17 decimals, like USDC)
    if (decimals >= 6) {
      if (amount < 0.01) return amount.toFixed(6);
      if (amount < 1) return amount.toFixed(4);
      if (amount < 1000) return amount.toFixed(2);
      if (amount < 1000000) return (amount / 1000).toFixed(2);
      return (amount / 1000000).toFixed(2);
    }

    // For low precision tokens
    return amount.toFixed(Math.min(decimals, 2));
  };

  // Format USD amounts
  const formatUsdAmount = (amount: number | undefined | null): string => {
    if (!amount || amount === 0) return "$0.00";
    if (amount < 0.01) return `$${amount.toFixed(6)}`;
    if (amount < 1) return `$${amount.toFixed(4)}`;
    if (amount < 1000) return `$${amount.toFixed(2)}`;
    if (amount < 1000000) return `$${(amount / 1000).toFixed(1)}K`;
    return `$${(amount / 1000000).toFixed(1)}M`;
  };

  return (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
        <Typography
          variant="body1"
          sx={{ color: "white", fontWeight: "medium" }}
        >
          Your position ({symbol})
        </Typography>
        <InfoIcon sx={{ color: "#8b949e", fontSize: 16 }} />
      </Box>

      {/* Token Amount Display */}
      <Box sx={{ display: "flex", alignItems: "baseline", gap: 2, mb: 1 }}>
        <Typography variant="h4" sx={{ color: "white", fontWeight: "bold" }}>
          {formatTokenAmount(currentPosition)}
        </Typography>
        {hasChange && (
          <>
            <Typography variant="h6" sx={{ color: "#8b949e" }}>
              →
            </Typography>
            <Typography
              variant="h4"
              sx={{
                color: changeColor,
                fontWeight: "bold",
                display: "flex",
                alignItems: "center",
                gap: 0.5,
              }}
            >
              {formatTokenAmount(projectedPosition)}
              <Box
                component="span"
                sx={{
                  fontSize: "20px",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {React.cloneElement(changeIcon, {
                  sx: { fontSize: 20, color: changeColor },
                })}
              </Box>
            </Typography>
          </>
        )}
      </Box>

      {/* USD Value Display - Optional, uncomment if needed */}
      <Box sx={{ display: "flex", alignItems: "baseline", gap: 2, mb: 2 }}>
        <Typography variant="body2" sx={{ color: "#8b949e" }}>
          {formatUsdAmount(currentPositionUsd)}
        </Typography>
        {hasChange && (
          <>
            <Typography variant="body2" sx={{ color: "#8b949e" }}>
              →
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: mode === "withdraw" ? "#ef4444" : "#4caf50",
              }}
            >
              {formatUsdAmount(projectedPositionUsd)}
            </Typography>
          </>
        )}
      </Box>

      {/* APY Section */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography variant="body1" sx={{ color: "white" }}>
            APY
          </Typography>
          <Typography
            variant="h6"
            sx={{
              color: "#4caf50",
              fontWeight: "bold",
              display: "flex",
              alignItems: "center",
              gap: 0.5,
            }}
          >
            {(netApy * 100).toFixed(2)}%
            <Box
              component="span"
              sx={{
                display: "inline-flex",
                alignItems: "center",
                fontSize: "12px",
              }}
            >
              ✨
            </Box>
          </Typography>
        </Box>

        <Chip
          label={`Daily: ${(dailyApy * 100).toFixed(3)}%`}
          size="small"
          sx={{
            backgroundColor: "rgba(59, 130, 246, 0.2)",
            color: "#3b82f6",
            fontSize: "10px",
          }}
        />
      </Box>
    </Box>
  );
};
