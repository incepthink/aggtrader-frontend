// src/components/yearnfi/vaults-v3/actions/VaultActionsDebug.tsx

"use client";

import React from "react";
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Stack,
  Chip,
} from "@mui/material";
import { useVaultActions } from "@/lib/yearnfi/lib/contexts/useVaultActions";
import { formatAmount } from "@/lib/yearnfi/lib/utils";
import { useAccount } from "wagmi";

export function VaultActionsDebug() {
  const { address, isConnected } = useAccount();
  const {
    maxDepositPossible,
    maxWithdrawPossible,
    userTokenBalance,
    userVaultBalance,
    allowance,
    needsApproval,
    isLoading,
  } = useVaultActions();

  if (!isConnected || !address) {
    return (
      <Paper sx={{ p: 3, mt: 4, bgcolor: "primary.dark" }}>
        <Typography variant="h6" gutterBottom>
          Vault Actions (Debug View)
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Connect your wallet to see deposit/withdraw limits
        </Typography>
      </Paper>
    );
  }

  if (isLoading) {
    return (
      <Paper sx={{ p: 3, mt: 4, bgcolor: "primary.dark" }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <CircularProgress size={24} />
          <Typography variant="body2">Loading vault data...</Typography>
        </Stack>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3, mt: 4, bgcolor: "primary.dark" }}>
      <Typography variant="h6" gutterBottom>
        Vault Actions (Debug View - Phase 2)
      </Typography>

      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ mb: 2, display: "block" }}
      >
        This debug panel shows real blockchain data. UI components will be added
        in Phase 3+
      </Typography>

      <Stack spacing={2}>
        <Box>
          <Typography variant="subtitle2" color="primary.main" gutterBottom>
            💰 Deposit Information
          </Typography>
          <Stack spacing={1} sx={{ pl: 2 }}>
            <Typography variant="body2">
              <strong>Your Token Balance:</strong>{" "}
              {formatAmount(userTokenBalance.normalized, 4)} tokens
              <Chip
                label={`${userTokenBalance.raw.toString()} wei`}
                size="small"
                sx={{ ml: 1, fontSize: "0.7rem" }}
              />
            </Typography>
            <Typography variant="body2">
              <strong>Max You Can Deposit:</strong>{" "}
              {formatAmount(maxDepositPossible.normalized, 4)} tokens
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontSize: "0.85rem" }}
            >
              (Limited by min of your balance and vault's deposit limit)
            </Typography>
          </Stack>
        </Box>

        <Box>
          <Typography variant="subtitle2" color="secondary.main" gutterBottom>
            🏦 Withdraw Information
          </Typography>
          <Stack spacing={1} sx={{ pl: 2 }}>
            <Typography variant="body2">
              <strong>Your Vault Shares:</strong>{" "}
              {formatAmount(userVaultBalance.normalized, 4)} shares
            </Typography>
            <Typography variant="body2">
              <strong>Max You Can Withdraw:</strong>{" "}
              {formatAmount(maxWithdrawPossible.normalized, 4)} shares
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontSize: "0.85rem" }}
            >
              (Limited by vault liquidity and your balance)
            </Typography>
          </Stack>
        </Box>

        <Box>
          <Typography variant="subtitle2" color="info.main" gutterBottom>
            ✅ Approval Status
          </Typography>
          <Stack spacing={1} sx={{ pl: 2 }}>
            <Typography variant="body2">
              <strong>Current Allowance:</strong>{" "}
              {formatAmount(allowance.normalized, 4)} tokens
            </Typography>
            <Typography variant="body2">
              <strong>Needs Approval?</strong>{" "}
              {needsApproval ? (
                <Chip
                  label="YES - Approval Required"
                  color="warning"
                  size="small"
                />
              ) : (
                <Chip
                  label="NO - Already Approved"
                  color="success"
                  size="small"
                />
              )}
            </Typography>
          </Stack>
        </Box>

        <Box sx={{ pt: 2, borderTop: 1, borderColor: "divider" }}>
          <Typography variant="caption" color="text.secondary">
            ℹ️ Data refreshes every 10 seconds automatically
          </Typography>
        </Box>
      </Stack>
    </Paper>
  );
}
