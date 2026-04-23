// /components/lend-morpho/borrow/market/BorrowForm/PositionSummary.tsx
"use client";

import React from "react";
import { Box, Typography, Divider } from "@mui/material";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import { getToken } from "@/utils/katanaTokens";

interface PositionSummaryProps {
  collateralSymbol: string;
  loanSymbol: string;
  collateralAmount: string;
  borrowedAmount: string;
  ltv: string;
  liquidationLtv: string;
  healthFactor?: number;
  mode: "borrow" | "repay";

  // Optional: embed without its own container box
  hideContainer?: boolean;

  // Slider hooks (kept as-is; you said you’re okay not moving slider here)
  onLtvChange?: (ltv: number) => void;
  collateralPrice?: number;
  loanTokenPrice?: number;
  maxSafeLTV?: number;

  // Arrow display props
  currentCollateral?: number;
  currentBorrowed?: number; // In repay mode: current debt
  currentLTV?: number;
  currentHealthFactor?: number;

  projectedCollateral?: number;
  projectedBorrowed?: number; // In repay mode: projected debt
  projectedLTV?: number;
  projectedHealthFactor?: number;

  hasCollateralChange?: boolean; // In repay mode: withdraw collateral > 0
  hasBorrowChange?: boolean; // In repay mode: repay amount > 0
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

  hideContainer = false,

  onLtvChange,
  collateralPrice = 0,
  loanTokenPrice = 0,
  maxSafeLTV = 0.915,

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
    if (hf === undefined || hf === null) return "∞";
    if (hf === 0 || hf === Infinity) return "∞";
    return hf.toFixed(2);
  };

  const getHealthFactorColor = (hf?: number) => {
    if (hf === undefined || hf === null) return "#4caf50";
    if (hf === 0 || hf === Infinity) return "#4caf50";
    if (hf > 2) return "#4caf50";
    if (hf > 1.5) return "#f59e0b";
    return "#f44336";
  };

  // Default format function if not provided
  const defaultFormatAmount = (amount: number): string => {
    if (amount === 0) return "0.00";
    if (amount < 0.0001) return amount.toFixed(8);
    if (amount < 0.01) return amount.toFixed(6);
    if (amount < 1) return amount.toFixed(4);
    return amount.toFixed(4);
  };

  const safeFormatAmount = formatAmount || defaultFormatAmount;

  const { image: collateralLogo } = getToken(collateralSymbol) || {};
  const { image: loanLogo } = getToken(loanSymbol) || {};

  const content = (
    <>
      {/* Row 1 */}
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
        <Typography
          variant="body2"
          sx={{
            color: "#8b949e",
            display: "flex",
            alignItems: "center",
            gap: 0.5,
          }}
        >
          {mode === "repay" ? "Current debt" : "Collateral"} (
          {mode === "repay" ? (
            <>
              {loanSymbol}
              <div className="inline-block">
                {loanLogo ? (
                  <img src={loanLogo} alt={loanSymbol} className="w-4 h-4" />
                ) : null}
              </div>
            </>
          ) : (
            <>
              {collateralSymbol}
              <div className="inline-block">
                {collateralLogo ? (
                  <img
                    src={collateralLogo}
                    alt={collateralSymbol}
                    className="w-4 h-4"
                  />
                ) : null}
              </div>
            </>
          )}
          )
        </Typography>

        <Box sx={{ display: "flex", alignItems: "baseline", gap: 1 }}>
          <Typography variant="body2" fontWeight="600" sx={{ color: "white" }}>
            {mode === "repay"
              ? safeFormatAmount(currentBorrowed) // debt
              : safeFormatAmount(currentCollateral)}
          </Typography>

          {/* Arrow for row 1:
              - borrow mode: collateral increases (up, green)
              - repay mode: debt decreases (down, green)
          */}
          {mode === "borrow" && hasCollateralChange && (
            <>
              <Typography variant="caption" sx={{ color: "#8b949e" }}>
                →
              </Typography>
              <Typography
                variant="body2"
                fontWeight="600"
                sx={{
                  color: "#4caf50",
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

          {mode === "repay" && hasBorrowChange && (
            <>
              <Typography variant="caption" sx={{ color: "#8b949e" }}>
                →
              </Typography>
              <Typography
                variant="body2"
                fontWeight="600"
                sx={{
                  color: "#4caf50",
                  display: "flex",
                  alignItems: "center",
                  gap: 0.25,
                }}
              >
                {safeFormatAmount(projectedBorrowed)}
                <TrendingDownIcon sx={{ fontSize: 14, color: "#4caf50" }} />
              </Typography>
            </>
          )}
        </Box>
      </Box>

      {/* Row 2 */}
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
        <Typography
          variant="body2"
          sx={{
            color: "#8b949e",
            display: "flex",
            alignItems: "center",
            gap: 0.5,
          }}
        >
          {mode === "repay" ? "Collateral" : "Loan"} (
          {mode === "repay" ? (
            <>
              {collateralSymbol}
              <div className="inline-block">
                {collateralLogo ? (
                  <img
                    src={collateralLogo}
                    alt={collateralSymbol}
                    className="w-4 h-4"
                  />
                ) : null}
              </div>
            </>
          ) : (
            <>
              {loanSymbol}
              <div className="inline-block">
                {loanLogo ? (
                  <img src={loanLogo} alt={loanSymbol} className="w-4 h-4" />
                ) : null}
              </div>
            </>
          )}
          )
        </Typography>

        <Box sx={{ display: "flex", alignItems: "baseline", gap: 1 }}>
          <Typography variant="body2" fontWeight="600" sx={{ color: "white" }}>
            {mode === "repay"
              ? safeFormatAmount(currentCollateral)
              : safeFormatAmount(currentBorrowed)}
          </Typography>

          {/* Arrow for row 2:
              - borrow mode: loan increases (up, orange)
              - repay mode: collateral decreases (down, orange)
          */}
          {mode === "borrow" && hasBorrowChange && (
            <>
              <Typography variant="caption" sx={{ color: "#8b949e" }}>
                →
              </Typography>
              <Typography
                variant="body2"
                fontWeight="600"
                sx={{
                  color: "#f59e0b",
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

          {mode === "repay" && hasCollateralChange && (
            <>
              <Typography variant="caption" sx={{ color: "#8b949e" }}>
                →
              </Typography>
              <Typography
                variant="body2"
                fontWeight="600"
                sx={{
                  color: "#f59e0b",
                  display: "flex",
                  alignItems: "center",
                  gap: 0.25,
                }}
              >
                {safeFormatAmount(projectedCollateral)}
                <TrendingDownIcon sx={{ fontSize: 14, color: "#f59e0b" }} />
              </Typography>
            </>
          )}
        </Box>
      </Box>

      <Divider sx={{ borderColor: "rgba(0, 245, 224, 0.08)", my: 1 }} />

      {/* Health Factor:
          - borrow mode already had arrow logic (keep)
          - add arrow logic for repay mode too (using projected/current + hasAnyChange)
      */}
      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
        <Typography variant="body2" sx={{ color: "#8b949e" }}>
          Health Factor
        </Typography>

        {/* If there are changes and projected/current differ, show arrow */}
        {hasAnyChange ? (
          <Box sx={{ display: "flex", alignItems: "baseline", gap: 1 }}>
            <Typography
              variant="body2"
              fontWeight="600"
              sx={{ color: getHealthFactorColor(currentHealthFactor) }}
            >
              {formatHealthFactor(currentHealthFactor)}
            </Typography>

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
                <TrendingUpIcon sx={{ fontSize: 14, color: "#4caf50" }} />
              ) : projectedHealthFactor < currentHealthFactor ? (
                <TrendingDownIcon sx={{ fontSize: 14, color: "#f44336" }} />
              ) : null}
            </Typography>
          </Box>
        ) : (
          <Typography
            variant="body2"
            fontWeight="600"
            sx={{ color: getHealthFactorColor(healthFactor) }}
          >
            {formatHealthFactor(healthFactor)}
          </Typography>
        )}
      </Box>
    </>
  );

  if (hideContainer) return <>{content}</>;

  return (
    <Box sx={{ mb: 2 }}>
      <Typography
        variant="caption"
        sx={{
          color: "#8b949e",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          fontSize: "11px",
          fontWeight: 500,
          display: "block",
          mb: 1.5,
        }}
      >
        Position Overview
      </Typography>
      <Box
        sx={{
          backgroundColor: "rgba(0, 245, 224, 0.03)",
          borderRadius: 2,
          p: 2,
          border: "1px solid rgba(0, 245, 224, 0.1)",
        }}
      >
        {content}
      </Box>
    </Box>
  );
};
