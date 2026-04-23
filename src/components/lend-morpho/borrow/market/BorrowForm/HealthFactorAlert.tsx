// /components/lend-morpho/borrow/market/BorrowForm/HealthFactorAlert.tsx
"use client";

import React from "react";
import { Typography, Box } from "@mui/material";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

interface HealthFactorAlertProps {
  healthFactor: number;
  borrowAmount: number;
  riskLevel: {
    level: string;
    color: string;
    severity: "info" | "warning" | "error";
  };
}

export const HealthFactorAlert: React.FC<HealthFactorAlertProps> = ({
  healthFactor,
  borrowAmount,
  riskLevel,
}) => {
  const getRiskColor = () => {
    if (healthFactor === Infinity || healthFactor > 2) return "#4caf50";
    if (healthFactor > 1.5) return "#f59e0b";
    if (healthFactor > 1) return "#ef4444";
    return "#dc2626";
  };

  const getDescription = () => {
    if (healthFactor === Infinity || healthFactor > 2) return "Safe — low liquidation risk";
    if (healthFactor > 1.5) return "Moderate — monitor your position";
    if (healthFactor > 1) return "High risk — reduce borrow amount";
    return "Danger — position will be liquidated";
  };

  const getTrendIcon = () => {
    if (healthFactor === Infinity || healthFactor > 2)
      return <TrendingUpIcon sx={{ fontSize: 14, color: getRiskColor() }} />;
    if (healthFactor > 1)
      return <WarningAmberIcon sx={{ fontSize: 14, color: getRiskColor() }} />;
    return <TrendingDownIcon sx={{ fontSize: 14, color: getRiskColor() }} />;
  };

  const riskColor = getRiskColor();
  const hfText = healthFactor === Infinity ? "∞" : healthFactor.toFixed(2);

  return (
    <Box
      sx={{
        border: `1px solid ${riskColor}26`,
        borderRadius: 2,
        backgroundColor: `${riskColor}0f`,
        p: 1.5,
        mb: 2,
        display: "flex",
        alignItems: "center",
        gap: 1.5,
      }}
    >
      {/* Indicator dot */}
      <Box
        sx={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          backgroundColor: riskColor,
          flexShrink: 0,
        }}
      />

      {/* Label */}
      <Typography
        variant="caption"
        sx={{
          color: "#8b949e",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          fontSize: "10px",
          flexShrink: 0,
        }}
      >
        Health Factor
      </Typography>

      {borrowAmount > 0 ? (
        <>
          {/* Value */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.5,
              ml: "auto",
            }}
          >
            <Typography
              variant="body2"
              sx={{ color: riskColor, fontWeight: "bold", fontSize: "15px" }}
            >
              {hfText}
            </Typography>
            {getTrendIcon()}
          </Box>

          {/* Description */}
          <Typography
            variant="caption"
            sx={{
              color: "#8b949e",
              fontSize: "11px",
              flexShrink: 0,
            }}
          >
            {getDescription()}
          </Typography>
        </>
      ) : (
        <Typography
          variant="caption"
          sx={{ color: "#8b949e", fontSize: "11px", ml: "auto" }}
        >
          Enter amounts to calculate
        </Typography>
      )}
    </Box>
  );
};
