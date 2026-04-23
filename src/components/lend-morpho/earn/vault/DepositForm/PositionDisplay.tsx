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
  decimals?: number;
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
  decimals = 18,
}) => {
  const hasChange = projectedPosition !== currentPosition;
  const changeColor = mode === "withdraw" ? "#ef4444" : "#00F5E0";
  const changeIcon =
    mode === "withdraw" ? <TrendingDownIcon /> : <TrendingUpIcon />;
  const afterLabel = mode === "withdraw" ? "After Withdraw" : "After Deposit";

  const formatTokenAmount = (amount: number | undefined | null): string => {
    if (!amount || amount === 0) return "0.00";

    if (decimals >= 18) {
      if (amount < 0.000001) return amount.toFixed(8);
      if (amount < 0.0001) return amount.toFixed(6);
      if (amount < 0.01) return amount.toFixed(4);
      if (amount < 1) return amount.toFixed(3);
      if (amount < 1000) return amount.toFixed(2);
      if (amount < 1000000) return `${(amount / 1000).toFixed(2)}K`;
      return `${(amount / 1000000).toFixed(2)}M`;
    }

    if (decimals >= 6) {
      if (amount < 0.01) return amount.toFixed(6);
      if (amount < 1) return amount.toFixed(4);
      if (amount < 1000) return amount.toFixed(2);
      if (amount < 1000000) return `${(amount / 1000).toFixed(2)}K`;
      return `${(amount / 1000000).toFixed(2)}M`;
    }

    return amount.toFixed(Math.min(decimals, 2));
  };

  const formatUsdAmount = (amount: number | undefined | null): string => {
    if (!amount || amount === 0) return "$0.00";
    if (amount < 0.01) return `$${amount.toFixed(6)}`;
    if (amount < 1) return `$${amount.toFixed(4)}`;
    if (amount < 1000) return `$${amount.toFixed(2)}`;
    if (amount < 1000000) return `$${(amount / 1000).toFixed(1)}K`;
    return `$${(amount / 1000000).toFixed(1)}M`;
  };

  return (
    <Box sx={{ mb: 1 }}>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
        <Typography
          variant="body2"
          sx={{
            color: "#8b949e",
            fontWeight: 500,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            fontSize: "11px",
          }}
        >
          Your Position
        </Typography>
        <Typography variant="body2" sx={{ color: "#8b949e" }}>
          ({symbol})
        </Typography>
        <InfoIcon sx={{ color: "#8b949e", fontSize: 14 }} />
      </Box>

      {/* Position Card */}
      <Box
        sx={{
          border: "1px solid rgba(0, 245, 224, 0.1)",
          borderRadius: 2,
          backgroundColor: "rgba(0, 245, 224, 0.03)",
          p: 2,
          mb: 2,
        }}
      >
        {hasChange ? (
          /* Two-column layout when there's a change */
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {/* Current Column */}
            <Box sx={{ flex: 1 }}>
              <Typography
                variant="caption"
                sx={{
                  color: "#8b949e",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  fontSize: "10px",
                  display: "block",
                  mb: 0.5,
                }}
              >
                Current
              </Typography>
              <Typography
                variant="h5"
                sx={{ color: "white", fontWeight: "bold", lineHeight: 1.2 }}
              >
                {formatTokenAmount(currentPosition)}
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: "#8b949e", mt: 0.25, display: "block" }}
              >
                {formatUsdAmount(currentPositionUsd)}
              </Typography>
            </Box>

            {/* Arrow */}
            <Box sx={{ display: "flex", alignItems: "center", px: 0.5 }}>
              <Typography
                variant="body1"
                sx={{ color: "#8b949e", fontSize: "18px" }}
              >
                →
              </Typography>
            </Box>

            {/* After Column */}
            <Box sx={{ flex: 1, textAlign: "right" }}>
              <Typography
                variant="caption"
                sx={{
                  color: changeColor,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  fontSize: "10px",
                  display: "block",
                  mb: 0.5,
                  opacity: 0.85,
                }}
              >
                {afterLabel}
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  gap: 0.5,
                }}
              >
                <Typography
                  variant="h5"
                  sx={{
                    color: changeColor,
                    fontWeight: "bold",
                    lineHeight: 1.2,
                  }}
                >
                  {formatTokenAmount(projectedPosition)}
                </Typography>
                {React.cloneElement(changeIcon, {
                  sx: { fontSize: 18, color: changeColor },
                })}
              </Box>
              <Typography
                variant="caption"
                sx={{
                  color: changeColor,
                  mt: 0.25,
                  display: "block",
                  opacity: 0.8,
                }}
              >
                {formatUsdAmount(projectedPositionUsd)}
              </Typography>
            </Box>
          </Box>
        ) : (
          /* Single column when no change */
          <Box>
            <Typography
              variant="caption"
              sx={{
                color: "#8b949e",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                fontSize: "10px",
                display: "block",
                mb: 0.5,
              }}
            >
              Current
            </Typography>
            <Typography
              variant="h5"
              sx={{ color: "white", fontWeight: "bold", lineHeight: 1.2 }}
            >
              {formatTokenAmount(currentPosition)}
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: "#8b949e", mt: 0.25, display: "block" }}
            >
              {formatUsdAmount(currentPositionUsd)}
            </Typography>
          </Box>
        )}
      </Box>

      {/* APY Section */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography variant="body2" sx={{ color: "#8b949e" }}>
            APY
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: "#00F5E0",
              fontWeight: "bold",
              display: "flex",
              alignItems: "center",
              gap: 0.5,
            }}
          >
            {(netApy * 100).toFixed(2)}%
            <Box component="span" sx={{ fontSize: "12px" }}>
              ✨
            </Box>
          </Typography>
        </Box>

        <Chip
          label={`Daily: ${(dailyApy * 100).toFixed(3)}%`}
          size="small"
          sx={{
            backgroundColor: "rgba(0, 245, 224, 0.08)",
            color: "#00F5E0",
            fontSize: "10px",
            border: "1px solid rgba(0, 245, 224, 0.15)",
          }}
        />
      </Box>
    </Box>
  );
};
