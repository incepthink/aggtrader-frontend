// components/DepositForm.tsx
"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
  Paper,
  Divider,
  Alert,
  Box,
  Typography,
  Button,
  CircularProgress,
} from "@mui/material";
import { useAccount, useBalance } from "wagmi";
import { formatUnits, Address } from "viem";
import { VaultDetail } from "./vault";
import { usePriceBackend } from "@/hooks/sushiswap/usePriceBackend";
import { useMorphoDeposit } from "@/hooks/lend-morpho/useMorphoDeposit";
import { useMorphoWithdraw } from "@/hooks/lend-morpho/useMorphoWithdraw";
import {
  useUserVaultPosition,
  type UserPosition,
} from "@/hooks/lend-morpho/useUserVaultPosition";
import { calculateProjectedEarnings } from "./formatters";
import { DepositWithdrawHeader } from "./DepositWithdrawHeader";
import { AmountInput } from "./AmountInput";
import { PositionDisplay } from "./PositionDisplay";
import { ProjectedEarnings } from "./ProjectedEarnings";
import { ActionButton } from "./ActionButton";
import { VaultInfoCard } from "./VaultInfoCard";
import GlowBox from "@/components/common/ui/GlowBox";

interface DepositFormProps {
  vault: VaultDetail;
  onConnectWallet?: () => void;
}

export const DepositForm: React.FC<DepositFormProps> = ({
  vault,
  onConnectWallet = () => console.log("Connect wallet clicked"),
}) => {
  const [amount, setAmount] = useState("");
  const [activeTab, setActiveTab] = useState<"deposit" | "withdraw">("deposit");
  const [walletError, setWalletError] = useState<string | null>(null);
  const { isConnected, address } = useAccount();

  // Fetch token balance
  const balanceQuery = useBalance({
    address,
    token: vault.asset.address as `0x${string}`,
    query: { enabled: isConnected && !!address },
  });

  // Fetch token price
  const {
    tokenPrice,
    isLoading: isLoadingPrice,
    error: priceError,
  } = usePriceBackend(vault.asset.address as Address);

  // Parse balance data
  const balance = balanceQuery.data
    ? parseFloat(
        formatUnits(balanceQuery.data.value, balanceQuery.data.decimals)
      )
    : 0;

  const decimals = balanceQuery.data?.decimals || 18;
  const formattedBalance = balance.toFixed(5);
  const isLoadingBalance = balanceQuery.isLoading;
  const isLoadingBalances = balanceQuery.isLoading;
  const isLoadingPrices = isLoadingPrice;

  const formatTokenAmount = (amount: number): string => {
    if (!amount || amount === 0) return "0.00";

    // Use decimals to determine precision
    if (decimals >= 18) {
      // High precision tokens (like ETH, most ERC-20s)
      if (amount < 0.0001) return amount.toFixed(6);
      if (amount < 0.01) return amount.toFixed(4);
      if (amount < 1) return amount.toFixed(3);
      return amount.toFixed(2);
    } else if (decimals >= 6) {
      // Medium precision tokens (like USDC)
      if (amount < 0.01) return amount.toFixed(6);
      if (amount < 1) return amount.toFixed(4);
      return amount.toFixed(2);
    } else {
      // Low precision tokens
      return amount.toFixed(decimals);
    }
  };

  // Single source of truth for position data
  const {
    data: userPosition,
    isLoading: isLoadingPosition,
    refetch: refetchPosition,
  } = useUserVaultPosition(vault.address);

  // Separate hooks for deposit and withdraw
  const {
    deposit,
    approve,
    checkAllowance,
    isLoading: isDepositing,
    isApproving,
    needsApproval,
    error: depositError,
    txHash: depositTxHash,
    reset: resetDeposit,
  } = useMorphoDeposit(
    vault.address,
    vault.asset.address,
    vault.asset.decimals
  );

  // Pass userPosition from API to withdraw hook (handles undefined)
  const {
    withdraw,
    getMaxWithdrawable,
    getMaxWithdrawableTokens,
    hasWithdrawablePosition,
    isLoading: isWithdrawing,
    error: withdrawError,
    txHash: withdrawTxHash,
    userShares,
    userAssets,
    userAssetsUsd,
    hasPosition,
    reset: resetWithdraw,
  } = useMorphoWithdraw(
    vault.address,
    vault.asset.address,
    vault.asset.decimals,
    userPosition // Can be undefined, hook handles it
  );

  const depositAmount = parseFloat(amount) || 0;
  const depositAmountUsd = depositAmount * (tokenPrice || 0);

  // Position data - handle when no position exists with safe fallbacks
  const currentPositionTokens = userPosition
    ? parseFloat(String(userPosition.assets)) / 10 ** decimals || 0
    : 0;
  const currentPositionUsd = userPosition ? userPosition.assetsUsd || 0 : 0;

  // Calculate projected position based on active tab
  const projectedPositionUsd =
    activeTab === "deposit"
      ? currentPositionUsd + depositAmountUsd
      : Math.max(0, currentPositionUsd - depositAmountUsd);
  console.log("POSITIONDEBUG::", currentPositionTokens, depositAmount);

  const projectedPositionTokens =
    activeTab === "deposit"
      ? currentPositionTokens + depositAmount
      : Math.max(0, currentPositionTokens - depositAmount);

  // Calculate earnings using USD position amounts for display
  const currentEarnings = calculateProjectedEarnings(
    currentPositionUsd,
    vault,
    1
  );
  const projectedEarnings = calculateProjectedEarnings(
    projectedPositionUsd,
    vault,
    1
  );

  // ✅ Same wallet connection check as BorrowForm
  const isWalletProperlyConnected = Boolean(
    isConnected &&
      address &&
      address !== "0x0000000000000000000000000000000000000000" &&
      address.startsWith("0x") &&
      address.length === 42
  );

  // Loading states (similar to BorrowForm)
  const isLoadingData =
    isLoadingBalances || isLoadingPrices || isLoadingPosition;

  // ✅ Remove automatic checkAllowance - let it be checked only when needed
  // (BorrowForm doesn't have automatic allowance checking)

  // No useEffect for checkAllowance here!

  // ✅ Reset form when switching tabs (exactly like BorrowForm)
  useEffect(() => {
    setAmount("");
    setWalletError(null);
    resetDeposit();
    resetWithdraw();
  }, [activeTab, resetDeposit, resetWithdraw]);

  // ✅ Refetch position after successful transactions (like BorrowForm)
  useEffect(() => {
    if (depositTxHash || withdrawTxHash) {
      setTimeout(() => {
        refetchPosition();
      }, 3000);
    }
  }, [depositTxHash, withdrawTxHash, refetchPosition]);

  const handleTabChange = (tab: "deposit" | "withdraw") => {
    setActiveTab(tab);
  };

  // ✅ Simple handlers without pre-emptive wallet checks (like BorrowForm)
  const handleAmountChange = (value: string) => {
    setAmount(value);
  };

  const handleMaxClick = () => {
    if (isWalletProperlyConnected) {
      if (activeTab === "deposit") {
        setAmount(balance.toString());
      } else {
        const maxTokens = getMaxWithdrawableTokens();
        setAmount(maxTokens);
      }
    }
  };

  const handleApprove = async () => {
    if (!amount) return;
    // ✅ Clear any existing errors before approval
    if (depositError) {
      resetDeposit();
    }
    await approve(amount);
  };

  const handleDeposit = async () => {
    if (!amount) return;
    // ✅ Clear any existing errors before deposit
    if (depositError) {
      resetDeposit();
    }
    const success = await deposit(amount);
    if (success) {
      setAmount("");
    }
  };

  const handleWithdraw = async () => {
    if (!amount) return;

    const success = await withdraw(amount);
    if (success) {
      setAmount("");
    }
  };

  // ✅ Simple error handling like BorrowForm
  const currentError = depositError || withdrawError;

  const isLoading = isDepositing || isWithdrawing || isApproving;

  // Enhanced withdraw button component
  const WithdrawButton = () => {
    if (!isWalletProperlyConnected) {
      return (
        <Button
          fullWidth
          variant="contained"
          onClick={onConnectWallet}
          sx={{
            backgroundColor: "#3b82f6",
            color: "white",
            py: 1.5,
            borderRadius: 2,
            textTransform: "none",
            fontSize: "16px",
            fontWeight: "bold",
            "&:hover": {
              backgroundColor: "#2563eb",
            },
          }}
        >
          Connect Wallet
        </Button>
      );
    }

    const maxWithdrawableTokens = parseFloat(getMaxWithdrawableTokens() || "0");
    const withdrawAmount = parseFloat(amount) || 0;

    const isDisabled =
      !amount ||
      withdrawAmount === 0 ||
      withdrawAmount > maxWithdrawableTokens ||
      isWithdrawing ||
      !hasWithdrawablePosition() ||
      isLoadingPosition;

    const getButtonText = () => {
      if (isWithdrawing) return "Processing Withdrawal...";
      if (isLoadingPosition) return "Loading Position...";
      if (!hasWithdrawablePosition()) return "No position to withdraw";
      if (!amount || withdrawAmount === 0) return "Enter an amount";
      if (withdrawAmount > maxWithdrawableTokens) return "Insufficient balance";
      return `Withdraw ${amount} ${vault.asset.symbol}`;
    };

    return (
      <Button
        fullWidth
        variant="contained"
        onClick={handleWithdraw}
        disabled={isDisabled}
        sx={{
          backgroundColor: "#4f46e5",
          color: "white",
          py: 1.5,
          borderRadius: 2,
          textTransform: "none",
          fontSize: "16px",
          fontWeight: "bold",
          display: "flex",
          alignItems: "center",
          gap: 1,
          "&:hover": {
            backgroundColor: "#4338ca",
          },
          "&:disabled": {
            backgroundColor: "#2d3748",
            color: "#8b949e",
          },
        }}
      >
        {(isWithdrawing || isLoadingPosition) && (
          <CircularProgress size={20} sx={{ color: "white" }} />
        )}
        {getButtonText()}
      </Button>
    );
  };

  return (
    <GlowBox
      sx={{
        height: "fit-content",
        position: { xs: "relative", lg: "sticky" },
        top: { xs: 0, lg: 100 },
        maxHeight: { xs: "none", lg: "calc(100vh - 120px)" },
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
          <DepositWithdrawHeader
            symbol={vault.asset.symbol}
            currentTab={activeTab}
            onTabChange={handleTabChange}
            hasPosition={hasPosition}
            userPosition={currentPositionUsd}
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

          {/* ✅ Loading states (like BorrowForm) */}
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
                Loading {isLoadingBalance && "wallet balance"}
                {isLoadingBalance && isLoadingPosition && " and "}
                {isLoadingPosition && "position data"}...
              </Box>
            </Alert>
          )}

          {/* No position warning for withdraw tab */}
          {activeTab === "withdraw" &&
            !hasWithdrawablePosition() &&
            isWalletProperlyConnected &&
            !isLoadingPosition && (
              <Alert
                severity="info"
                sx={{
                  mb: 3,
                  backgroundColor: "#3b82f6",
                  color: "white",
                  "& .MuiAlert-icon": { color: "white" },
                }}
              >
                You don't have any {vault.asset.symbol} deposited in this vault.
                Switch to the Deposit tab to start earning.
              </Alert>
            )}

          {/* ✅ Error display (like BorrowForm) */}
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

          {/* ✅ Success message (like BorrowForm) */}
          {(depositTxHash || withdrawTxHash) && !currentError && (
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
              {(depositTxHash || withdrawTxHash)?.slice(0, 10)}...
              <Button
                size="small"
                onClick={() =>
                  window.open(
                    `https://etherscan.io/tx/${
                      depositTxHash || withdrawTxHash
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

          <AmountInput
            amount={amount}
            onAmountChange={handleAmountChange}
            onMaxClick={handleMaxClick}
            symbol={vault.asset.symbol}
            balance={
              activeTab === "deposit"
                ? formattedBalance
                : hasWithdrawablePosition()
                ? getMaxWithdrawableTokens() || "0"
                : "0"
            }
            tokenPrice={tokenPrice || 0}
            isConnected={isWalletProperlyConnected}
            isLoadingBalance={
              activeTab === "deposit" ? isLoadingBalance : isLoadingPosition
            }
            mode={activeTab}
            userPosition={currentPositionTokens}
            userPositionUsd={currentPositionUsd}
            walletError={null} // ✅ Don't pass wallet errors to AmountInput
          />

          <Divider sx={{ borderColor: "#2d3748", mb: 3 }} />

          <PositionDisplay
            symbol={vault.asset.symbol}
            currentPosition={Number(formatTokenAmount(currentPositionTokens))} // ✅ Better formatting
            projectedPosition={Number(
              formatTokenAmount(projectedPositionTokens)
            )} // ✅ Better formatting
            currentPositionUsd={currentPositionUsd}
            projectedPositionUsd={projectedPositionUsd}
            netApy={vault.state.avgNetApy}
            dailyApy={vault.state.dailyNetApy || vault.state.netApy}
            mode={activeTab}
            decimals={decimals} // ✅ Pass decimals to component
          />

          <ProjectedEarnings
            current={currentEarnings}
            projected={projectedEarnings}
            hasAmount={depositAmount > 0}
            mode={activeTab}
          />

          <Divider sx={{ borderColor: "#2d3748", mb: 3 }} />

          {/* Action Button - Different for Deposit vs Withdraw */}
          {activeTab === "deposit" ? (
            <ActionButton
              isConnected={isWalletProperlyConnected}
              amount={amount}
              balance={balance}
              symbol={vault.asset.symbol}
              isLoading={isDepositing || isApproving} // ✅ Show loading for both states
              isApproving={isApproving}
              needsApproval={false} // ✅ Always false - handle approval internally
              txHash={depositTxHash}
              error={currentError}
              onDeposit={handleDeposit} // ✅ Always call deposit (handles approval internally)
              onApprove={handleApprove} // ✅ Not used but required by interface
              onConnect={onConnectWallet}
              onReset={() => {
                setWalletError(null);
                resetDeposit();
              }}
            />
          ) : (
            <WithdrawButton />
          )}
        </Box>
      </Paper>
    </GlowBox>
  );
};
