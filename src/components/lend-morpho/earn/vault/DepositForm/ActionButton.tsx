// components/ActionButton.tsx
"use client";
import React from "react";
import {
  Button,
  Box,
  Typography,
  CircularProgress,
  Alert,
} from "@mui/material";
import { GradientConnectButton } from "@/components/common/navbar/Navbar";

interface ActionButtonProps {
  isConnected: boolean;
  amount: string;
  balance: number;
  symbol: string;
  isLoading: boolean;
  isApproving: boolean;
  needsApproval: boolean;
  txHash: string | null;
  error: string | null;
  onDeposit: () => void;
  onApprove: () => void;
  onConnect: () => void;
  onReset: () => void;
}

export const ActionButton: React.FC<ActionButtonProps> = ({
  isConnected,
  amount,
  balance,
  symbol,
  isLoading,
  isApproving,
  needsApproval,
  txHash,
  error,
  onDeposit,
  onApprove,
  onConnect,
  onReset,
}) => {
  const depositAmount = parseFloat(amount) || 0;

  // Show wallet reconnection warning for zero address error
  if (error && error.includes("zero address")) {
    return (
      <Box>
        <Alert
          severity="warning"
          sx={{
            mb: 2,
            backgroundColor: "#f59e0b",
            color: "white",
            "& .MuiAlert-icon": { color: "white" },
          }}
        >
          Wallet connection issue detected. Please disconnect and reconnect your
          wallet.
        </Alert>
        <Button
          fullWidth
          variant="outlined"
          onClick={onReset}
          sx={{
            color: "#f59e0b",
            borderColor: "#f59e0b",
            textTransform: "none",
            fontSize: "14px",
          }}
        >
          Try Again
        </Button>
      </Box>
    );
  }

  // Show success state
  if (txHash && !isLoading) {
    return (
      <Box>
        <Button
          fullWidth
          variant="contained"
          sx={{
            backgroundColor: "#4caf50",
            color: "white",
            py: 1.5,
            borderRadius: 2,
            textTransform: "none",
            fontSize: "16px",
            fontWeight: "bold",
            mb: 2,
          }}
          disabled
        >
          ✅ Transaction Successful
        </Button>
        <Typography
          variant="caption"
          sx={{ color: "#4caf50", display: "block", mb: 1 }}
        >
          Tx: {txHash.slice(0, 10)}...{txHash.slice(-8)}
        </Typography>
        <Button
          fullWidth
          variant="outlined"
          onClick={onReset}
          sx={{
            color: "#3b82f6",
            borderColor: "#3b82f6",
            textTransform: "none",
            fontSize: "14px",
          }}
        >
          Make Another Deposit
        </Button>
      </Box>
    );
  }

  // Show error state
  if (error) {
    return (
      <Box>
        <Button
          fullWidth
          variant="contained"
          sx={{
            backgroundColor: "#dc2626",
            color: "white",
            py: 1.5,
            borderRadius: 2,
            textTransform: "none",
            fontSize: "16px",
            fontWeight: "bold",
            mb: 2,
          }}
          disabled
        >
          ❌ Transaction Failed
        </Button>
        <Typography
          variant="caption"
          sx={{ color: "#dc2626", display: "block", mb: 2 }}
        >
          {error}
        </Typography>
        <Button
          fullWidth
          variant="outlined"
          onClick={onReset}
          sx={{
            color: "#3b82f6",
            borderColor: "#3b82f6",
            textTransform: "none",
            fontSize: "14px",
          }}
        >
          Try Again
        </Button>
      </Box>
    );
  }

  if (!isConnected) {
    return <GradientConnectButton variant="form" fullWidth />;
  }

  const isDisabled = !amount || depositAmount === 0 || depositAmount > balance;

  // Show approval button if needed
  if (needsApproval && !isApproving && !isLoading) {
    return (
      <Button
        fullWidth
        variant="contained"
        onClick={onApprove}
        disabled={isDisabled}
        sx={{
          backgroundColor: "#f59e0b",
          color: "white",
          py: 1.5,
          borderRadius: 2,
          textTransform: "none",
          fontSize: "16px",
          fontWeight: "bold",
          "&:hover": {
            backgroundColor: "#d97706",
          },
          "&:disabled": {
            backgroundColor: "#2d3748",
            color: "#8b949e",
          },
        }}
      >
        {isDisabled
          ? !amount || depositAmount === 0
            ? "Enter an amount"
            : "Insufficient balance"
          : `Approve ${symbol}`}
      </Button>
    );
  }

  // Show approving state
  if (isApproving) {
    return (
      <Button
        fullWidth
        variant="contained"
        disabled
        sx={{
          backgroundColor: "#f59e0b",
          color: "white",
          py: 1.5,
          borderRadius: 2,
          textTransform: "none",
          fontSize: "16px",
          fontWeight: "bold",
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        <CircularProgress size={20} sx={{ color: "white" }} />
        Approving {symbol}...
      </Button>
    );
  }

  // Show deposit button
  const getButtonText = () => {
    if (isLoading) return "Processing Deposit...";
    if (!amount || depositAmount === 0) return "Enter an amount";
    if (depositAmount > balance) return "Insufficient balance";
    return `Deposit ${amount} ${symbol}`;
  };

  return (
    <Button
      id="deposit-action-btn"
      fullWidth
      variant="contained"
      onClick={onDeposit}
      disabled={isDisabled || isLoading}
      sx={{
        backgroundColor: "#4caf50",
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
          backgroundColor: "#388e3c",
        },
        "&:disabled": {
          backgroundColor: "#2d3748",
          color: "#8b949e",
        },
      }}
    >
      {isLoading && <CircularProgress size={20} sx={{ color: "white" }} />}
      {getButtonText()}
    </Button>
  );
};
