// /components/lend-morpho/borrow/market/BorrowForm/PositionSummary.tsx
"use client";

import React from "react";
import { Box, Typography, Divider } from "@mui/material";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";

interface PositionSummaryProps {
  collateralSymbol: string;
  loanSymbol: string;
  collateralAmount: string;
  borrowedAmount: string;
  ltv: string;
  liquidationLtv: string;
  healthFactor?: number;
  mode: "borrow" | "repay";
  // New props for slider functionality
  onLtvChange?: (ltv: number) => void;
  collateralPrice?: number;
  loanTokenPrice?: number;
  maxSafeLTV?: number;
  // ✅ New props for arrow display
  currentCollateral?: number;
  currentBorrowed?: number;
  currentLTV?: number;
  currentHealthFactor?: number;
  projectedCollateral?: number;
  projectedBorrowed?: number;
  projectedLTV?: number;
  projectedHealthFactor?: number;
  hasCollateralChange?: boolean;
  hasBorrowChange?: boolean;
  hasAnyChange?: boolean;
  formatAmount?: (amount: number) => string;
}

export const PositionSummary: React.FC<PositionSummaryProps> = ({
  collateralSymbol,
  loanSymbol,
  collateralAmount,
  borrowedAmount,
  ltv,
  liquidationLtv,
  healthFactor,
  mode,
  onLtvChange,
  collateralPrice = 0,
  loanTokenPrice = 0,
  maxSafeLTV = 0.915, // 91.5% default
  // ✅ Arrow display props
  currentCollateral = 0,
  currentBorrowed = 0,
  currentLTV = 0,
  currentHealthFactor = Infinity,
  projectedCollateral = 0,
  projectedBorrowed = 0,
  projectedLTV = 0,
  projectedHealthFactor = Infinity,
  hasCollateralChange = false,
  hasBorrowChange = false,
  hasAnyChange = false,
  formatAmount,
}) => {
  const formatHealthFactor = (hf?: number) => {
    if (!hf || hf === 0 || hf === Infinity) return "∞";
    return hf.toFixed(2);
  };

  const getHealthFactorColor = (hf?: number) => {
    if (!hf || hf === 0 || hf === Infinity) return "#4caf50";
    if (hf > 2) return "#4caf50";
    if (hf > 1.5) return "#f59e0b";
    return "#f44336";
  };

  // ✅ Default format function if not provided
  const defaultFormatAmount = (amount: number): string => {
    if (amount === 0) return "0.00";
    if (amount < 0.0001) return amount.toFixed(8);
    if (amount < 0.01) return amount.toFixed(6);
    if (amount < 1) return amount.toFixed(4);
    return amount.toFixed(4);
  };

  const safeFormatAmount = formatAmount || defaultFormatAmount;

  return (
    <Box
      sx={{
        backgroundColor: "transparent",
        borderRadius: 2,
        p: 2,
        mb: 3,
        border: "1px solid #30363d",
      }}
    >
      {/* ✅ Collateral Position with Arrows */}
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
        <Typography variant="body2" sx={{ color: "#8b949e" }}>
          {mode === "repay" ? "Current debt" : "Collateral"} (
          {mode === "repay" ? loanSymbol : collateralSymbol})
        </Typography>
        <Box sx={{ display: "flex", alignItems: "baseline", gap: 1 }}>
          <Typography variant="body2" fontWeight="600" sx={{ color: "white" }}>
            {mode === "repay"
              ? safeFormatAmount(currentBorrowed)
              : safeFormatAmount(currentCollateral)}
          </Typography>
          {mode === "borrow" && hasCollateralChange && (
            <>
              <Typography variant="caption" sx={{ color: "#8b949e" }}>
                →
              </Typography>
              <Typography
                variant="body2"
                fontWeight="600"
                sx={{
                  color: "#4caf50", // Green for collateral increase
                  display: "flex",
                  alignItems: "center",
                  gap: 0.25,
                }}
              >
                {safeFormatAmount(projectedCollateral)}
                <TrendingUpIcon sx={{ fontSize: 14, color: "#4caf50" }} />
              </Typography>
            </>
          )}
        </Box>
      </Box>

      {/* ✅ Borrow/Loan Position with Arrows */}
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
        <Typography variant="body2" sx={{ color: "#8b949e" }}>
          {mode === "repay" ? "Collateral" : "Loan"} (
          {mode === "repay" ? collateralSymbol : loanSymbol})
        </Typography>
        <Box sx={{ display: "flex", alignItems: "baseline", gap: 1 }}>
          <Typography variant="body2" fontWeight="600" sx={{ color: "white" }}>
            {mode === "repay"
              ? safeFormatAmount(currentCollateral)
              : safeFormatAmount(currentBorrowed)}
          </Typography>
          {mode === "borrow" && hasBorrowChange && (
            <>
              <Typography variant="caption" sx={{ color: "#8b949e" }}>
                →
              </Typography>
              <Typography
                variant="body2"
                fontWeight="600"
                sx={{
                  color: "#f59e0b", // Orange for borrow increase (warning/caution)
                  display: "flex",
                  alignItems: "center",
                  gap: 0.25,
                }}
              >
                {safeFormatAmount(projectedBorrowed)}
                <TrendingUpIcon sx={{ fontSize: 14, color: "#f59e0b" }} />
              </Typography>
            </>
          )}
        </Box>
      </Box>

      <Divider sx={{ borderColor: "#30363d", my: 1 }} />

      {mode === "borrow" ? (
        <>
          {/* ✅ LTV with Arrow */}
          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <Typography variant="body2" sx={{ color: "#8b949e" }}>
              LTV / Liq LTV
            </Typography>
            <Box sx={{ display: "flex", alignItems: "baseline", gap: 1 }}>
              <Typography
                variant="body2"
                fontWeight="600"
                sx={{ color: "white" }}
              >
                {(currentLTV * 100).toFixed(2)}% / {liquidationLtv}
              </Typography>
              {hasAnyChange && (
                <>
                  <Typography variant="caption" sx={{ color: "#8b949e" }}>
                    →
                  </Typography>
                  <Typography
                    variant="body2"
                    fontWeight="600"
                    sx={{
                      color: projectedLTV > currentLTV ? "#f59e0b" : "#4caf50",
                      display: "flex",
                      alignItems: "center",
                      gap: 0.25,
                    }}
                  >
                    {(projectedLTV * 100).toFixed(2)}%
                    {projectedLTV > currentLTV ? (
                      <TrendingUpIcon sx={{ fontSize: 14, color: "#f59e0b" }} />
                    ) : projectedLTV < currentLTV ? (
                      <TrendingDownIcon
                        sx={{ fontSize: 14, color: "#4caf50" }}
                      />
                    ) : null}
                  </Typography>
                </>
              )}
            </Box>
          </Box>

          {/* ✅ Health Factor with Arrow (for borrow mode if you want to show it) */}
          {hasAnyChange &&
            !(
              currentHealthFactor === Infinity &&
              projectedHealthFactor === Infinity
            ) && (
              <Box
                sx={{ display: "flex", justifyContent: "space-between", mt: 1 }}
              >
                <Typography variant="body2" sx={{ color: "#8b949e" }}>
                  Health Factor
                </Typography>
                <Box sx={{ display: "flex", alignItems: "baseline", gap: 1 }}>
                  <Typography
                    variant="body2"
                    fontWeight="600"
                    sx={{ color: getHealthFactorColor(currentHealthFactor) }}
                  >
                    {formatHealthFactor(currentHealthFactor)}
                  </Typography>
                  <>
                    <Typography variant="caption" sx={{ color: "#8b949e" }}>
                      →
                    </Typography>
                    <Typography
                      variant="body2"
                      fontWeight="600"
                      sx={{
                        color: getHealthFactorColor(projectedHealthFactor),
                        display: "flex",
                        alignItems: "center",
                        gap: 0.25,
                      }}
                    >
                      {formatHealthFactor(projectedHealthFactor)}
                      {projectedHealthFactor > currentHealthFactor ? (
                        <TrendingUpIcon
                          sx={{ fontSize: 14, color: "#4caf50" }}
                        />
                      ) : projectedHealthFactor < currentHealthFactor ? (
                        <TrendingDownIcon
                          sx={{ fontSize: 14, color: "#f44336" }}
                        />
                      ) : null}
                    </Typography>
                  </>
                </Box>
              </Box>
            )}
        </>
      ) : (
        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
          <Typography variant="body2" sx={{ color: "#8b949e" }}>
            Health Factor
          </Typography>
          <Typography
            variant="body2"
            fontWeight="600"
            sx={{ color: getHealthFactorColor(healthFactor) }}
          >
            {formatHealthFactor(healthFactor)}
          </Typography>
        </Box>
      )}
    </Box>
  );
};
