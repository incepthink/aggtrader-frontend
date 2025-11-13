// /components/lend-morpho/borrow/market/BorrowForm/BorrowForm.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Box, Paper, Alert, Button, CircularProgress } from "@mui/material";
import { MarketData } from "@/hooks/lend-morpho/MarketDetailHooks";
import { useAccount, useBalance } from "wagmi";
import { formatUnits, Address } from "viem";
import { usePriceBackend } from "@/hooks/sushiswap/usePriceBackend";
import { useBorrowCalculations } from "@/hooks/lend-morpho/useBorrowCalculations";
import { useMorphoBorrow } from "@/hooks/lend-morpho/useMorphoBorrow";
import { useMorphoRepay } from "@/hooks/lend-morpho/useMorphoRepay";
import { useTokenApproval } from "@/hooks/lend-morpho/useTokenApproval";
import { useRepayTokenApproval } from "@/hooks/lend-morpho/useRepayTokenApproval";
import { useMorphoPosition } from "@/hooks/lend-morpho/useMorphoPosition";
import { BorrowRepayHeader } from "./BorrowRepayHeader";
import { BorrowTabContent } from "./BorrowTabContent";
import { RepayTabContent } from "./RepayTabContent";
import GlowBox from "@/components/common/ui/GlowBox";

interface BorrowFormProps {
  market: MarketData;
  onConnectWallet?: () => void;
}

const MORPHO_BLUE_ADDRESS = "0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb";

export function BorrowForm({
  market,
  onConnectWallet = () => console.log("Connect wallet clicked"),
}: BorrowFormProps) {
  const [activeTab, setActiveTab] = useState<"borrow" | "repay">("borrow");
  const [collateralAmount, setCollateralAmount] = useState("");
  const [borrowAmount, setBorrowAmount] = useState("");
  const [repayAmount, setRepayAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");

  const { isConnected, address } = useAccount();

  // Get token prices first (needed for position hook)
  const {
    tokenPrice: collateralTokenPrice,
    isLoading: isLoadingCollateralPrice,
    error: collateralPriceError,
  } = usePriceBackend(market.collateralAsset.address as Address);

  const {
    tokenPrice: loanTokenPrice,
    isLoading: isLoadingLoanPrice,
    error: loanPriceError,
  } = usePriceBackend(market.loanAsset.address as Address);

  // Morpho hooks
  const morphoBorrow = useMorphoBorrow();
  const morphoRepay = useMorphoRepay();

  // Token approval hooks
  const tokenApproval = useTokenApproval(); // For collateral (borrow)
  const repayTokenApproval = useRepayTokenApproval(); // For loan token (repay)

  // Get real user position via GraphQL API
  const {
    data: userPosition,
    isLoading: isLoadingPosition,
    error: positionError,
    refetch: refetchPosition,
  } = useMorphoPosition(
    market,
    address,
    collateralTokenPrice || 0,
    loanTokenPrice || 0
  );

  // Get wallet balances
  const collateralBalanceQuery = useBalance({
    address,
    token: market.collateralAsset.address as `0x${string}`,
    query: { enabled: isConnected && !!address },
  });

  const loanBalanceQuery = useBalance({
    address,
    token: market.loanAsset.address as `0x${string}`,
    query: { enabled: isConnected && !!address },
  });

  // Process balance data
  const collateralBalance = collateralBalanceQuery.data
    ? parseFloat(
        formatUnits(
          collateralBalanceQuery.data.value,
          collateralBalanceQuery.data.decimals
        )
      )
    : 0;

  const loanBalance = loanBalanceQuery.data
    ? parseFloat(
        formatUnits(loanBalanceQuery.data.value, loanBalanceQuery.data.decimals)
      )
    : 0;

  const formattedCollateralBalance = collateralBalance.toFixed(5);
  const formattedLoanBalance = loanBalance.toFixed(2);

  // Use real position data instead of mock (handle undefined)
  const currentCollateral = userPosition?.collateralAmount || 0;
  const currentBorrowed = userPosition?.borrowedAmount || 0;

  // Use calculations hook (with fallback for prices)
  const calculations = useBorrowCalculations({
    collateralAmount,
    borrowAmount,
    repayAmount,
    collateralPrice: collateralTokenPrice || 0,
    loanTokenPrice: loanTokenPrice || 0,
    lltv: parseFloat(market.lltv) / 1e18,
    currentCollateral,
    currentBorrowed,
    activeTab,
  });

  // Wallet connection status
  const isWalletProperlyConnected = Boolean(
    isConnected &&
      address &&
      address !== "0x0000000000000000000000000000000000000000" &&
      address.startsWith("0x") &&
      address.length === 42
  );

  // Loading states
  const isLoadingBalances =
    collateralBalanceQuery.isLoading || loanBalanceQuery.isLoading;
  const isLoadingPrices = isLoadingCollateralPrice || isLoadingLoanPrice;
  const isLoadingData =
    isLoadingBalances || isLoadingPrices || isLoadingPosition;
  const hasPriceError = collateralPriceError || loanPriceError;
  const hasDebt = userPosition?.hasDebt || false;
  const hasPosition = userPosition?.hasPosition || false;

  // Check token approval when amounts change
  useEffect(() => {
    if (
      activeTab === "borrow" &&
      collateralAmount &&
      parseFloat(collateralAmount) > 0
    ) {
      tokenApproval.checkApproval({
        tokenAddress: market.collateralAsset.address as Address,
        spenderAddress: MORPHO_BLUE_ADDRESS as Address,
        amount: collateralAmount,
        decimals: market.collateralAsset.decimals,
      });
    }
  }, [collateralAmount, market.collateralAsset, activeTab]);

  useEffect(() => {
    if (activeTab === "repay" && repayAmount && parseFloat(repayAmount) > 0) {
      repayTokenApproval.checkApproval({
        tokenAddress: market.loanAsset.address as Address,
        spenderAddress: MORPHO_BLUE_ADDRESS as Address,
        amount: repayAmount,
        decimals: market.loanAsset.decimals,
      });
    }
  }, [repayAmount, market.loanAsset, activeTab]);

  // Reset form when switching tabs
  useEffect(() => {
    setCollateralAmount("");
    setBorrowAmount("");
    setRepayAmount("");
    setWithdrawAmount("");
    morphoBorrow.reset();
    morphoRepay.reset();
    tokenApproval.reset();
    repayTokenApproval.reset();
  }, [activeTab]);

  // Refetch position after successful transactions
  useEffect(() => {
    if (morphoBorrow.txHash || morphoRepay.txHash) {
      // Refetch position after a short delay to allow blockchain to update
      setTimeout(() => {
        refetchPosition();
      }, 3000);
    }
  }, [morphoBorrow.txHash, morphoRepay.txHash, refetchPosition]);

  const handleTabChange = (tab: "borrow" | "repay") => {
    setActiveTab(tab);
  };

  const handleMaxCollateral = () => {
    if (isWalletProperlyConnected && !collateralBalanceQuery.isLoading) {
      setCollateralAmount(collateralBalance.toString());
    }
  };

  const handleMaxRepay = () => {
    if (userPosition?.borrowedAmount) {
      setRepayAmount(userPosition.borrowedAmount.toString());
    }
  };

  const handleApprove = async () => {
    if (!collateralAmount) return;

    await tokenApproval.approve({
      tokenAddress: market.collateralAsset.address as Address,
      spenderAddress: MORPHO_BLUE_ADDRESS as Address,
      amount: collateralAmount,
      decimals: market.collateralAsset.decimals,
    });
  };

  const handleRepayApprove = async () => {
    if (!repayAmount) return;

    await repayTokenApproval.approve({
      tokenAddress: market.loanAsset.address as Address,
      spenderAddress: MORPHO_BLUE_ADDRESS as Address,
      amount: repayAmount,
      decimals: market.loanAsset.decimals,
    });
  };

  const handleBorrow = async () => {
    if (!collateralAmount || !borrowAmount) return;

    await morphoBorrow.borrow({
      market,
      collateralAmount,
      borrowAmount,
    });

    // Reset form on success
    if (morphoBorrow.txHash) {
      setCollateralAmount("");
      setBorrowAmount("");
    }
  };

  const handleRepay = async () => {
    if (!repayAmount && !withdrawAmount) {
      return;
    }

    await morphoRepay.repay({
      market,
      repayAmount: repayAmount || "0",
      withdrawAmount: withdrawAmount || "0",
    });

    // Reset form on success
    if (morphoRepay.txHash) {
      setRepayAmount("");
      setWithdrawAmount("");
    }
  };

  // Get current error state (convert Error objects to strings)
  const currentError =
    morphoBorrow.error ||
    morphoRepay.error ||
    tokenApproval.error ||
    repayTokenApproval.error ||
    (positionError ? positionError.message : null);

  const isLoading =
    morphoBorrow.isLoading ||
    morphoRepay.isLoading ||
    tokenApproval.isLoading ||
    repayTokenApproval.isLoading;

  console.log("Position Data:", {
    userPosition,
    hasPosition,
    hasDebt,
    currentCollateral,
    currentBorrowed,
    ltv: userPosition?.ltv,
    healthFactor: userPosition?.healthFactor,
  });

  return (
    <GlowBox
      sx={{
        height: "fit-content",
        position: { xs: "relative", lg: "sticky" },
        top: { xs: 0, lg: 100 },
      }}
    >
      <Paper
        sx={{
          backgroundColor: "transparent",
          borderRadius: 2,
          position: { xs: "relative", lg: "sticky" },
          top: { xs: 0, lg: 100 },
          alignSelf: "flex-start",
          width: "100%",
        }}
      >
        <Box sx={{ p: 2 }}>
          <BorrowRepayHeader
            currentTab={activeTab}
            onTabChange={handleTabChange}
            collateralSymbol={market.collateralAsset.symbol}
            loanSymbol={market.loanAsset.symbol}
            hasPosition={hasPosition}
          />

          {/* Wallet connection warning */}
          {isConnected && !isWalletProperlyConnected && (
            <Alert
              severity="warning"
              sx={{
                mb: 3,
                backgroundColor: "#f59e0b",
                color: "white",
                "& .MuiAlert-icon": { color: "white" },
              }}
            >
              Wallet connection issue. Please disconnect and reconnect your
              wallet.
            </Alert>
          )}

          {/* Loading states */}
          {isLoadingData && isWalletProperlyConnected && (
            <Alert
              severity="info"
              sx={{
                mb: 3,
                backgroundColor: "#3b82f6",
                color: "white",
                "& .MuiAlert-icon": { color: "white" },
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <CircularProgress size={16} sx={{ color: "white" }} />
                Loading {isLoadingBalances && "wallet balances"}
                {isLoadingBalances && isLoadingPrices && " and "}
                {isLoadingPrices && "token prices"}
                {isLoadingPosition && " and position data"}...
              </Box>
            </Alert>
          )}

          {/* Price error warning */}
          {hasPriceError && !isLoadingPrices && (
            <Alert
              severity="warning"
              sx={{
                mb: 3,
                backgroundColor: "#f59e0b",
                color: "white",
                "& .MuiAlert-icon": { color: "white" },
              }}
            >
              Unable to load token prices. USD values may be inaccurate.
            </Alert>
          )}

          {/* Error display */}
          {currentError && (
            <Alert
              severity="error"
              sx={{
                mb: 3,
                backgroundColor: "#dc2626",
                color: "white",
                "& .MuiAlert-icon": { color: "white" },
              }}
            >
              {currentError}
            </Alert>
          )}

          {/* Success message */}
          {(morphoBorrow.txHash || morphoRepay.txHash) && !currentError && (
            <Alert
              severity="success"
              sx={{
                mb: 3,
                backgroundColor: "#16a34a",
                color: "white",
                "& .MuiAlert-icon": { color: "white" },
              }}
            >
              Transaction successful! Hash:{" "}
              {(morphoBorrow.txHash || morphoRepay.txHash)?.slice(0, 10)}...
              <Button
                size="small"
                onClick={() =>
                  window.open(
                    `https://etherscan.io/tx/${
                      morphoBorrow.txHash || morphoRepay.txHash
                    }`,
                    "_blank"
                  )
                }
                sx={{
                  color: "white",
                  textDecoration: "underline",
                  ml: 1,
                  p: 0,
                  minWidth: "auto",
                }}
              >
                View on Etherscan
              </Button>
            </Alert>
          )}

          {/* Tab Content */}
          {activeTab === "borrow" ? (
            <BorrowTabContent
              market={market}
              collateralAmount={collateralAmount}
              borrowAmount={borrowAmount}
              onCollateralAmountChange={setCollateralAmount}
              onBorrowAmountChange={setBorrowAmount}
              onMaxCollateral={handleMaxCollateral}
              onBorrow={tokenApproval.isApproved ? handleBorrow : handleApprove}
              onConnect={onConnectWallet}
              isConnected={isWalletProperlyConnected}
              isLoading={isLoading}
              formattedCollateralBalance={formattedCollateralBalance}
              formattedLoanBalance={formattedLoanBalance}
              collateralTokenPrice={collateralTokenPrice || 0}
              loanTokenPrice={loanTokenPrice || 0}
              isLoadingCollateralBalance={collateralBalanceQuery.isLoading}
              calculations={calculations}
              needsApproval={
                !tokenApproval.isApproved && parseFloat(collateralAmount) > 0
              }
              userPosition={userPosition || null}
            />
          ) : (
            <RepayTabContent
              market={market}
              repayAmount={repayAmount}
              withdrawAmount={withdrawAmount}
              onRepayAmountChange={setRepayAmount}
              onWithdrawAmountChange={setWithdrawAmount}
              onMaxRepay={handleMaxRepay}
              onRepay={
                repayTokenApproval.isApproved ? handleRepay : handleRepayApprove
              }
              onConnect={onConnectWallet}
              isConnected={isWalletProperlyConnected}
              isLoading={isLoading}
              isLoadingData={isLoadingData}
              formattedLoanBalance={formattedLoanBalance}
              loanTokenPrice={loanTokenPrice || 0}
              hasDebt={hasDebt}
              userPosition={userPosition || null}
              calculations={calculations}
              collateralTokenPrice={collateralTokenPrice || 0}
              needsApproval={
                !repayTokenApproval.isApproved && parseFloat(repayAmount) > 0
              }
            />
          )}
        </Box>
      </Paper>
    </GlowBox>
  );
}
