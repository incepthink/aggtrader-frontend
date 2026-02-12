// /components/lend-morpho/borrow/market/BorrowForm/BorrowTabContent.tsx
"use client";

import React from "react";
import { Box, Divider, Typography } from "@mui/material";
import { MarketData } from "@/hooks/lend-morpho/MarketDetailHooks";
import { UserPosition } from "@/hooks/lend-morpho/useMorphoPosition";
import EarnInput from "@/components/common/earn/EarnInput";
import { PositionSummary } from "./PositionSummary";
import { HealthFactorAlert } from "./HealthFactorAlert";
import { BorrowActionButton } from "./BorrowActionButton";
import { MarketInfoDisplay } from "./MarketInfoDisplay";

interface BorrowTabContentProps {
  market: MarketData;
  collateralAmount: string;
  borrowAmount: string;
  onCollateralAmountChange: (amount: string) => void;
  onBorrowAmountChange: (amount: string) => void;
  onMaxCollateral: () => void;
  onBorrow: () => void;
  onConnect: () => void;
  isConnected: boolean;
  isLoading: boolean;
  formattedCollateralBalance: string;
  formattedLoanBalance: string;
  collateralTokenPrice: number;
  loanTokenPrice: number;
  isLoadingCollateralBalance: boolean;
  needsApproval?: boolean;
  userPosition: UserPosition | null;
  calculations: {
    maxBorrowableAmount: number;
    maxSafeLTV: number;
    projectedCollateral: number;
    projectedBorrowed: number;
    projectedLTV: number;
    projectedHealthFactor: number;
    riskLevel: any;
    formatPercentage: (value: number) => string;
    formatNumber: (value: number) => string;
  };
  isLoadingLoanPrice?: boolean;
}

export const BorrowTabContent: React.FC<BorrowTabContentProps> = ({
  market,
  collateralAmount,
  borrowAmount,
  onCollateralAmountChange,
  onBorrowAmountChange,
  onMaxCollateral,
  onBorrow,
  onConnect,
  isConnected,
  isLoading,
  formattedCollateralBalance,
  formattedLoanBalance,
  collateralTokenPrice,
  loanTokenPrice,
  isLoadingCollateralBalance,
  needsApproval = false,
  userPosition,
  calculations,
  isLoadingLoanPrice = false,
}) => {
  const lltv = parseFloat(market.lltv) / 1e18;

  // Handle LTV slider change
  const handleLtvChange = (newLtvDecimal: number) => {
    // console.log("=== LTV SLIDER CHANGE ===");
    // console.log("New LTV:", newLtvDecimal);
    // console.log("User Position:", userPosition);
    // console.log("Collateral Amount Input:", collateralAmount);
    // console.log("Prices:", { collateralTokenPrice, loanTokenPrice });

    // Calculate total collateral (existing + new input)
    const existingCollateral = userPosition?.collateralAmount || 0;
    const newCollateralAmount = parseFloat(collateralAmount) || 0;
    const totalCollateral = existingCollateral + newCollateralAmount;

    // console.log("Total Collateral:", totalCollateral);

    if (totalCollateral > 0 && collateralTokenPrice > 0 && loanTokenPrice > 0) {
      // Calculate desired borrow amount based on LTV
      // LTV = (Total Borrowed × Loan Price) / (Total Collateral × Collateral Price)
      // Rearranged: Total Borrowed = (LTV × Total Collateral × Collateral Price) / Loan Price

      const collateralValueUSD = totalCollateral * collateralTokenPrice;
      const desiredTotalBorrowValueUSD = newLtvDecimal * collateralValueUSD;
      const desiredTotalBorrowAmount =
        desiredTotalBorrowValueUSD / loanTokenPrice;

      // console.log("Calculation:", {
      //   collateralValueUSD,
      //   desiredTotalBorrowValueUSD,
      //   desiredTotalBorrowAmount,
      // });

      // Subtract existing borrowed amount to get new borrow amount
      const existingBorrowed = userPosition?.borrowedAmount || 0;
      const newBorrowAmount = Math.max(
        0,
        desiredTotalBorrowAmount - existingBorrowed,
      );

      // Update borrow amount, ensuring it doesn't exceed max borrowable
      const maxBorrowable = calculations.maxBorrowableAmount;
      const finalBorrowAmount = Math.min(newBorrowAmount, maxBorrowable);

      // console.log("Final amounts:", {
      //   existingBorrowed,
      //   newBorrowAmount,
      //   maxBorrowable,
      //   finalBorrowAmount,
      // });

      onBorrowAmountChange(finalBorrowAmount.toString());
    } else {
      console.log("Missing data for calculation");
    }
  };

  // ✅ Calculate current vs projected values for arrow display
  const currentCollateral = userPosition?.collateralAmount || 0;
  const currentBorrowed = userPosition?.borrowedAmount || 0;
  const currentLTV = userPosition?.ltv || 0;
  const currentHealthFactor = userPosition?.healthFactor || Infinity;

  // Input amounts
  const collateralInput = parseFloat(collateralAmount) || 0;
  const borrowInput = parseFloat(borrowAmount) || 0;

  // Check if there are changes to show arrows
  const hasCollateralChange = collateralInput > 0;
  const hasBorrowChange = borrowInput > 0;
  const hasAnyChange = hasCollateralChange || hasBorrowChange;

  // ✅ Format number with appropriate precision
  const formatAmount = (amount: number): string => {
    if (amount === 0) return "0.00";
    if (amount < 0.0001) return amount.toFixed(8);
    if (amount < 0.01) return amount.toFixed(6);
    if (amount < 1) return amount.toFixed(4);
    return amount.toFixed(4);
  };

  // Show current position values when user has existing position
  const displayCollateralAmount = userPosition?.hasPosition
    ? calculations.formatNumber(calculations.projectedCollateral)
    : calculations.formatNumber(parseFloat(collateralAmount) || 0);

  const displayBorrowAmount = userPosition?.hasPosition
    ? calculations.formatNumber(calculations.projectedBorrowed)
    : calculations.formatNumber(parseFloat(borrowAmount) || 0);

  const displayLTV = calculations.formatPercentage(calculations.projectedLTV);

  return (
    <>
      <EarnInput
        amount={collateralAmount}
        onAmountChange={onCollateralAmountChange}
        onMaxClick={onMaxCollateral}
        symbol={market.collateralAsset.symbol}
        balance={formattedCollateralBalance}
        tokenPrice={collateralTokenPrice}
        isConnected={isConnected}
        isLoadingBalance={isLoadingCollateralBalance}
        title={
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
            <Typography variant="body2">Supply Collateral</Typography>
          </Box>
        }
        errorDisplay={
          collateralAmount &&
          parseFloat(collateralAmount) >
            parseFloat(formattedCollateralBalance) &&
          isConnected ? (
            <Typography variant="caption" sx={{ color: "#ef4444" }}>
              Insufficient balance
            </Typography>
          ) : undefined
        }
      />

      {/* Divider with Arrow */}
      {/* <Box sx={{ display: "flex", justifyContent: "center", my: 2 }}>
        <SwapHoriz sx={{ color: "#8b949e" }} />
      </Box> */}

      <EarnInput
        amount={borrowAmount}
        onAmountChange={onBorrowAmountChange}
        symbol={market.loanAsset.symbol}
        balance={formattedLoanBalance}
        tokenPrice={loanTokenPrice}
        isConnected={isConnected}
        isLoadingPrice={isLoadingLoanPrice}
        title={
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
            <Typography variant="body2">Borrow</Typography>
          </Box>
        }
        errorDisplay={
          borrowAmount &&
          calculations.maxBorrowableAmount > 0 &&
          parseFloat(borrowAmount) > calculations.maxBorrowableAmount && (
            <Typography
              variant="caption"
              sx={{
                color: "#ef4444",
                display: "block",
                textAlign: "right",
              }}
            >
              Exceeds max borrowable
            </Typography>
          )
        }
        topSlot={
          <>
            {calculations.maxBorrowableAmount > 0 &&
              collateralAmount &&
              parseFloat(collateralAmount) > 0 && (
                <Typography
                  data-testid="max-borrowable-button"
                  variant="caption"
                  sx={{
                    color: "#3b82f6",
                    cursor: "pointer",
                    display: "block",
                    textAlign: "right",
                    "&:hover": { textDecoration: "underline" },
                  }}
                  onClick={() =>
                    onBorrowAmountChange(
                      calculations.maxBorrowableAmount.toFixed(6),
                    )
                  }
                >
                  Max borrowable: {calculations.maxBorrowableAmount.toFixed(4)}{" "}
                  {market.loanAsset.symbol}
                </Typography>
              )}
          </>
        }
      />

      {/* ✅ Updated PositionSummary with arrow data */}
      <PositionSummary
        collateralSymbol={market.collateralAsset.symbol}
        loanSymbol={market.loanAsset.symbol}
        collateralAmount={displayCollateralAmount}
        borrowedAmount={displayBorrowAmount}
        ltv={displayLTV}
        liquidationLtv={calculations.formatPercentage(lltv)}
        mode="borrow"
        onLtvChange={handleLtvChange}
        collateralPrice={collateralTokenPrice}
        loanTokenPrice={loanTokenPrice}
        maxSafeLTV={calculations.maxSafeLTV}
        // ✅ New props for arrow display
        currentCollateral={currentCollateral}
        currentBorrowed={currentBorrowed}
        currentLTV={currentLTV}
        currentHealthFactor={currentHealthFactor}
        projectedCollateral={calculations.projectedCollateral}
        projectedBorrowed={calculations.projectedBorrowed}
        projectedLTV={calculations.projectedLTV}
        projectedHealthFactor={calculations.projectedHealthFactor}
        hasCollateralChange={hasCollateralChange}
        hasBorrowChange={hasBorrowChange}
        hasAnyChange={hasAnyChange}
        formatAmount={formatAmount}
      />

      <HealthFactorAlert
        healthFactor={calculations.projectedHealthFactor}
        borrowAmount={parseFloat(borrowAmount) || 0}
        riskLevel={calculations.riskLevel}
      />

      <BorrowActionButton
        isConnected={isConnected}
        collateralAmount={collateralAmount}
        borrowAmount={borrowAmount}
        isLoading={isLoading}
        onBorrow={onBorrow}
        onConnect={onConnect}
        mode="borrow"
        buttonText={needsApproval ? "Approve Collateral" : "Borrow"}
      />

      {/* <Divider sx={{ borderColor: "#2d3748", my: 3 }} /> */}

      {/* <MarketInfoDisplay
        borrowApy={market.borrowApy}
        maxLtv={calculations.formatPercentage(calculations.maxSafeLTV)}
        mode="borrow"
      /> */}
    </>
  );
};
