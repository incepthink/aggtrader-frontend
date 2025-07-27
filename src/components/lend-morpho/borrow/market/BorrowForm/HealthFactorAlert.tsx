// /components/lend-morpho/borrow/market/BorrowForm/HealthFactorAlert.tsx
"use client";

import React from "react";
import { Alert, Typography, Box } from "@mui/material";

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
  const getHealthFactorText = () => {
    if (healthFactor === Infinity) return "∞";
    return healthFactor.toFixed(2);
  };

  const getDescription = () => {
    if (healthFactor === Infinity || healthFactor > 2) {
      return "Safe position - Low liquidation risk";
    } else if (healthFactor > 1.5) {
      return "Moderate risk - Monitor your position";
    } else if (healthFactor > 1) {
      return "High risk - Consider reducing borrow amount";
    } else {
      return "Liquidation risk - This position will be liquidated";
    }
  };

  const getBackgroundColor = () => {
    switch (riskLevel.severity) {
      case "info":
        return "#3b82f6";
      case "warning":
        return "#f59e0b";
      case "error":
        return "#dc2626";
      default:
        return "#3b82f6";
    }
  };

  return (
    <Alert
      severity={riskLevel.severity}
      sx={{
        mb: 3,
        backgroundColor: getBackgroundColor(),
        color: "white",
        "& .MuiAlert-icon": { color: "white" },
      }}
    >
      {borrowAmount > 0 ? (
        <Box>
          <Typography variant="body2" fontWeight="600">
            Health Factor: {getHealthFactorText()}
          </Typography>
          <Typography variant="body2">{getDescription()}</Typography>
        </Box>
      ) : (
        <Typography variant="body2">
          Enter collateral and borrow amounts to see your health factor.
        </Typography>
      )}
    </Alert>
  );
};
