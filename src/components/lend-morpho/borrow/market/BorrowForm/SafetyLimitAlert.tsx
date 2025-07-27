// /components/lend-morpho/borrow/market/BorrowForm/SafetyLimitAlert.tsx
"use client";

import React from "react";
import { Alert, Box, Typography } from "@mui/material";
import { Warning, Error, Info } from "@mui/icons-material";

interface SafetyLimitAlertProps {
  projectedLTV: number;
  maxSafeLTV: number;
  liquidationLTV: number;
  isExceedingLimit: boolean;
  formatPercentage: (value: number) => string;
}

export const SafetyLimitAlert: React.FC<SafetyLimitAlertProps> = ({
  projectedLTV,
  maxSafeLTV,
  liquidationLTV,
  isExceedingLimit,
  formatPercentage,
}) => {
  const ltvRatio = projectedLTV / maxSafeLTV;

  // Don't show alert if no meaningful LTV
  if (projectedLTV <= 0) return null;

  const getAlertConfig = () => {
    if (isExceedingLimit) {
      return {
        severity: "error" as const,
        icon: <Error />,
        title: "Safety Limit Exceeded",
        message:
          "Your borrow amount exceeds the safe borrowing limit. Please reduce your borrow amount.",
        backgroundColor: "#dc2626",
      };
    } else if (ltvRatio >= 0.9) {
      return {
        severity: "warning" as const,
        icon: <Warning />,
        title: "Approaching Safety Limit",
        message:
          "You're approaching the maximum safe borrowing limit. Consider reducing your borrow amount.",
        backgroundColor: "#f59e0b",
      };
    } else if (ltvRatio >= 0.75) {
      return {
        severity: "info" as const,
        icon: <Info />,
        title: "Moderate Risk",
        message:
          "Your position is within safe limits but monitor market conditions.",
        backgroundColor: "#3b82f6",
      };
    }

    return null;
  };

  const alertConfig = getAlertConfig();

  if (!alertConfig) return null;

  return (
    <Alert
      severity={alertConfig.severity}
      icon={alertConfig.icon}
      sx={{
        mb: 2,
        backgroundColor: alertConfig.backgroundColor,
        color: "white",
        "& .MuiAlert-icon": { color: "white" },
        "& .MuiAlert-message": { width: "100%" },
      }}
    >
      <Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
          {alertConfig.title}
        </Typography>
        <Typography variant="body2" sx={{ mb: 1 }}>
          {alertConfig.message}
        </Typography>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: "0.875rem",
          }}
        >
          <span>Current LTV: {formatPercentage(projectedLTV)}</span>
          <span>Safe Limit: {formatPercentage(maxSafeLTV)}</span>
          <span>Liquidation: {formatPercentage(liquidationLTV)}</span>
        </Box>
      </Box>
    </Alert>
  );
};
