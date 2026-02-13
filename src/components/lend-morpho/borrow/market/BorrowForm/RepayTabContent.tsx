// /components/lend-morpho/borrow/market/BorrowForm/RepayTabContent.tsx
"use client";

import React from "react";
import { Box, Typography, Divider, Slider, Alert, Button } from "@mui/material";
import { MarketData } from "@/hooks/lend-morpho/MarketDetailHooks";
import { UserPosition } from "@/hooks/lend-morpho/useMorphoPosition";
import EarnInput from "@/components/common/earn/EarnInput";
import { MarketInfoDisplay } from "./MarketInfoDisplay";
import { PositionSummary } from "./PositionSummary";

interface RepayTabContentProps {
  market: MarketData;
  repayAmount: string;
  withdrawAmount: string;
  onRepayAmountChange: (amount: string) => void;
  onWithdrawAmountChange: (amount: string) => void;
  onMaxRepay: () => void;
  onRepay: () => void;
  onConnect: () => void;
  isConnected: boolean;
  isLoading: boolean;
  isLoadingData: boolean;
  formattedLoanBalance: string;
  loanTokenPrice: number;
  hasDebt: boolean;
  userPosition: UserPosition | null;
  calculations: {
    projectedCollateral: number;
    projectedBorrowed: number;
    projectedLTV: number;
    projectedHealthFactor: number;
    formatPercentage: (value: number) => string;
    formatNumber: (value: number) => string;
  };
  collateralTokenPrice?: number;
  needsApproval?: boolean;
  isLoadingLoanPrice?: boolean;
}

export const RepayTabContent: React.FC<RepayTabContentProps> = ({
  market,
  repayAmount,
  withdrawAmount,
  onRepayAmountChange,
  onWithdrawAmountChange,
  onMaxRepay,
  onRepay,
  onConnect,
  isConnected,
  isLoading,
  isLoadingData,
  formattedLoanBalance,
  loanTokenPrice,
  hasDebt,
  userPosition,
  calculations,
  collateralTokenPrice = 0,
  needsApproval = false,
  isLoadingLoanPrice = false,
}) => {
  const lltv = parseFloat(market.lltv) / 1e18;

  // Current position values
  const currentDebt = userPosition?.borrowedAmount || 0;
  const currentCollateral = userPosition?.collateralAmount || 0;
  const currentHealthFactor = userPosition?.healthFactor || Infinity;

  // Input amounts
  const repayAmountNum = parseFloat(repayAmount) || 0;
  const withdrawAmountNum = parseFloat(withdrawAmount) || 0;

  // Projected values after repay/withdraw
  const projectedDebt = Math.max(0, currentDebt - repayAmountNum);
  const projectedCollateral = Math.max(
    0,
    currentCollateral - withdrawAmountNum,
  );

  // Changes flags (for arrows)
  const hasDebtChange = repayAmountNum > 0;
  const hasCollateralChange = withdrawAmountNum > 0;
  const hasAnyChange = hasDebtChange || hasCollateralChange;

  // Calculate projected LTV and health factor
  let projectedLTV = 0;
  let projectedHealthFactor = Infinity;

  if (
    projectedCollateral > 0 &&
    collateralTokenPrice > 0 &&
    loanTokenPrice > 0
  ) {
    const collateralValueUSD = projectedCollateral * collateralTokenPrice;
    const debtValueUSD = projectedDebt * loanTokenPrice;

    if (collateralValueUSD > 0 && debtValueUSD > 0) {
      projectedLTV = debtValueUSD / collateralValueUSD;
      projectedHealthFactor = projectedLTV > 0 ? lltv / projectedLTV : Infinity;
    }
  }

  if (projectedDebt === 0) {
    projectedLTV = 0;
    projectedHealthFactor = Infinity;
  }

  // LTV slider change: sets repay amount to hit target LTV
  const handleLtvChange = (_event: Event, newValue: number | number[]) => {
    if (typeof newValue !== "number") return;

    const targetLTV = newValue / 100;

    if (
      projectedCollateral > 0 &&
      collateralTokenPrice > 0 &&
      loanTokenPrice > 0
    ) {
      const collateralValue = projectedCollateral * collateralTokenPrice;
      const targetDebtValueUSD = targetLTV * collateralValue;
      const targetDebtAmount = targetDebtValueUSD / loanTokenPrice;

      const requiredRepayAmount = Math.max(0, currentDebt - targetDebtAmount);
      onRepayAmountChange(requiredRepayAmount.toFixed(6));
    }
  };

  const handleMaxRepay = () => {
    if (currentDebt > 0) onRepayAmountChange(currentDebt.toString());
  };

  const handleMaxWithdraw = () => {
    if (currentCollateral > 0)
      onWithdrawAmountChange(currentCollateral.toString());
  };

  const getHealthFactorColor = (hf: number) => {
    if (hf === Infinity || hf > 2) return "#4caf50";
    if (hf > 1.5) return "#f59e0b";
    return "#f44336";
  };

  const getLtvColor = (ltv: number) => {
    const ratio = ltv / lltv;
    if (ratio <= 0.7) return "#4caf50";
    if (ratio <= 0.85) return "#f59e0b";
    return "#f44336";
  };

  const canRepay =
    isConnected && hasDebt && (repayAmountNum > 0 || withdrawAmountNum > 0);

  // Calculate current LTV (before changes)
  let currentLTVDisplay = 0;
  if (
    currentCollateral > 0 &&
    collateralTokenPrice > 0 &&
    loanTokenPrice > 0 &&
    currentDebt > 0
  ) {
    const collateralValueUSD = currentCollateral * collateralTokenPrice;
    const debtValueUSD = currentDebt * loanTokenPrice;
    currentLTVDisplay = debtValueUSD / collateralValueUSD;
  }

  // Display projected if any change, else current
  const displayLTV = hasAnyChange ? projectedLTV : currentLTVDisplay;

  // Format amount
  const formatAmount = (amount: number): string => {
    if (amount === 0) return "0.00";
    if (amount < 0.0001) return amount.toFixed(8);
    if (amount < 0.01) return amount.toFixed(6);
    if (amount < 1) return amount.toFixed(4);
    return amount.toFixed(4);
  };

  return (
    <Box>
      {/* Repay Loan Input */}
      <EarnInput
        amount={repayAmount}
        onAmountChange={onRepayAmountChange}
        symbol={market.loanAsset.symbol}
        balance={currentDebt > 0 ? currentDebt.toString() : "0.00"}
        tokenPrice={loanTokenPrice}
        isConnected={isConnected}
        onMaxClick={handleMaxRepay}
        maxButtonColor="#ef4444"
        maxButtonHoverBg="rgba(239, 68, 68, 0.1)"
        isLoadingPrice={isLoadingLoanPrice}
        balanceLabel="Current debt"
        title={
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
            <Typography variant="body2">Repay</Typography>
          </Box>
        }
        errorDisplay={
          repayAmount && repayAmountNum > currentDebt ? (
            <Typography variant="caption" sx={{ color: "#ef4444" }}>
              Amount exceeds debt
            </Typography>
          ) : undefined
        }
      />

      {/* Withdraw Collateral Input */}
      <EarnInput
        amount={withdrawAmount}
        onAmountChange={onWithdrawAmountChange}
        onMaxClick={handleMaxWithdraw}
        symbol={market.collateralAsset.symbol}
        balance={formatAmount(currentCollateral)}
        tokenPrice={collateralTokenPrice}
        isConnected={isConnected}
        balanceLabel="Collateral"
        title={
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
            <Typography variant="body2">Withdraw Collateral</Typography>
          </Box>
        }
        errorDisplay={
          withdrawAmount &&
          withdrawAmountNum > currentCollateral &&
          isConnected ? (
            <Typography variant="caption" sx={{ color: "#ef4444" }}>
              Insufficient collateral
            </Typography>
          ) : undefined
        }
      />

      {/* Position Summary Box (same as before), now reusing PositionSummary */}
      <Box
        sx={{
          backgroundColor: "transparent",
          borderRadius: 2,
          p: 2,
          mb: 3,
          border: "1px solid #30363d",
        }}
      >
        {/* ✅ Common UI block */}
        <PositionSummary
          hideContainer
          mode="repay"
          collateralSymbol={market.collateralAsset.symbol}
          loanSymbol={market.loanAsset.symbol}
          collateralAmount={formatAmount(currentCollateral)}
          borrowedAmount={formatAmount(currentDebt)}
          ltv={`${(displayLTV * 100).toFixed(2)}%`}
          liquidationLtv={`${(lltv * 100).toFixed(2)}%`}
          healthFactor={currentHealthFactor}
          // Arrow data
          currentCollateral={currentCollateral}
          currentBorrowed={currentDebt}
          currentHealthFactor={currentHealthFactor}
          projectedCollateral={projectedCollateral}
          projectedBorrowed={projectedDebt}
          projectedHealthFactor={projectedHealthFactor}
          hasCollateralChange={hasCollateralChange}
          hasBorrowChange={hasDebtChange}
          hasAnyChange={hasAnyChange}
          formatAmount={formatAmount}
        />

        {/* LTV Display and Slider (kept in repay tab as you wanted) */}
        <Box>
          <Box sx={{ display: "flex", justifyContent: "space-between", my: 1 }}>
            <Typography variant="body2" sx={{ color: "#8b949e" }}>
              LTV / Liq LTV
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: getLtvColor(displayLTV),
                fontWeight: 600,
              }}
            >
              {(displayLTV * 100).toFixed(2)}% / {(lltv * 100).toFixed(2)}%
            </Typography>
          </Box>

          <Box sx={{ px: 1 }}>
            <Slider
              value={Math.min(displayLTV * 100, lltv * 95)}
              onChange={handleLtvChange}
              min={0}
              max={lltv * 95}
              step={0.1}
              disabled={
                !hasDebt ||
                currentCollateral === 0 ||
                collateralTokenPrice === 0
              }
              sx={{
                color: "#3b82f6",
                height: 6,
                "& .MuiSlider-track": {
                  border: "none",
                  backgroundColor: getLtvColor(displayLTV),
                },
                "& .MuiSlider-rail": {
                  backgroundColor: "#30363d",
                  border: "none",
                },
                "& .MuiSlider-thumb": {
                  height: 16,
                  width: 16,
                  backgroundColor: "white",
                  border: `2px solid ${getLtvColor(displayLTV)}`,
                  "&:focus, &:hover, &.Mui-active, &.Mui-focusVisible": {
                    boxShadow: `0 0 0 8px ${getLtvColor(displayLTV)}20`,
                  },
                },
                "&.Mui-disabled": {
                  "& .MuiSlider-thumb": {
                    backgroundColor: "#8b949e",
                    border: "2px solid #8b949e",
                  },
                  "& .MuiSlider-track": {
                    backgroundColor: "#8b949e",
                  },
                },
              }}
            />
          </Box>
        </Box>

        {/* Action Button */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {!isConnected ? (
            <Button
              fullWidth
              variant="contained"
              onClick={onConnect}
              sx={{
                backgroundColor: "#3b82f6",
                color: "white",
                py: 1.5,
                fontSize: "16px",
                fontWeight: 600,
                "&:hover": {
                  backgroundColor: "#2563eb",
                },
              }}
            >
              Connect Wallet
            </Button>
          ) : (
            <Button
              fullWidth
              variant="contained"
              onClick={onRepay}
              disabled={!canRepay || isLoading}
              sx={{
                backgroundColor: canRepay ? "#16a34a" : "#8b949e",
                color: "white",
                py: 1.5,
                fontSize: "16px",
                fontWeight: 600,
                "&:hover": {
                  backgroundColor: canRepay ? "#15803d" : "#8b949e",
                },
                "&:disabled": {
                  backgroundColor: "#8b949e",
                  color: "#ffffff80",
                },
              }}
            >
              {isLoading
                ? "Processing..."
                : !hasDebt
                  ? "No Debt to Repay"
                  : (!repayAmount || repayAmountNum === 0) &&
                      (!withdrawAmount || withdrawAmountNum === 0)
                    ? "Enter Amount"
                    : needsApproval
                      ? "Approve Token"
                      : "Repay"}
            </Button>
          )}

          <Typography
            variant="caption"
            sx={{
              color: "#8b949e",
              textAlign: "center",
              mt: 1,
            }}
          >
            Enter an amount to repay your debt or withdraw collateral.
          </Typography>
        </Box>
      </Box>

      {/* No debt warning */}
      {!hasDebt && isConnected && !isLoadingData && (
        <Alert
          severity="info"
          sx={{
            mb: 3,
            backgroundColor: "#3b82f6",
            color: "white",
            "& .MuiAlert-icon": { color: "white" },
          }}
        >
          You don't have any outstanding debt in this market. Switch to the
          Borrow tab to borrow assets.
        </Alert>
      )}

      <MarketInfoDisplay
        borrowApy={market.borrowApy}
        maxLtv={calculations.formatPercentage(lltv)}
        mode="repay"
        healthFactor={projectedHealthFactor}
      />
    </Box>
  );
};
