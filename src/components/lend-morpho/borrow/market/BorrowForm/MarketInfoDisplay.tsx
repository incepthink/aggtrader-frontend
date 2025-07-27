// /components/lend-morpho/borrow/market/BorrowForm/MarketInfoDisplay.tsx
"use client";

import React from "react";
import { Box, Typography } from "@mui/material";

interface MarketInfoDisplayProps {
  borrowApy: number;
  maxLtv: string;
  mode: "borrow" | "repay";
  healthFactor?: number;
}

export const MarketInfoDisplay: React.FC<MarketInfoDisplayProps> = ({
  borrowApy,
  maxLtv,
  mode,
  healthFactor,
}) => {
  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(2)}%`;
  };

  const formatHealthFactor = (hf?: number) => {
    if (!hf || hf === 0) return "∞";
    return hf.toFixed(2);
  };

  const getHealthFactorColor = (hf?: number) => {
    if (!hf || hf === 0) return "#4caf50";
    if (hf > 2) return "#4caf50";
    if (hf > 1.5) return "#f59e0b";
    return "#f44336";
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
        <Typography variant="body2" sx={{ color: "#8b949e" }}>
          Borrow APY
        </Typography>
        <Typography variant="body2" fontWeight="600" sx={{ color: "#f44336" }}>
          {formatPercentage(borrowApy)}
        </Typography>
      </Box>

      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
        <Typography variant="body2" sx={{ color: "#8b949e" }}>
          {mode === "borrow" ? "Max LTV" : "Health Factor"}
        </Typography>
        <Typography
          variant="body2"
          fontWeight="600"
          sx={{
            color:
              mode === "borrow" ? "white" : getHealthFactorColor(healthFactor),
          }}
        >
          {mode === "borrow" ? maxLtv : formatHealthFactor(healthFactor)}
        </Typography>
      </Box>
    </Box>
  );
};
