// src/components/yearnfi/vaults-v3/actions/VaultActionPanel.tsx

"use client";

import React from "react";
import { Box, Typography, Tabs, Tab } from "@mui/material";
import { useVaultActions } from "@/lib/yearnfi/lib/contexts/useVaultActions";
import { ActionButtons } from "./ActionButtons";
import { useAccount } from "wagmi";
import type { TYDaemonVault } from "@/lib/yearnfi/lib/utils/schemas/yDaemonVaultsSchemas";
import { formatAmount } from "@/lib/yearnfi/lib/utils";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import GlowBox from "@/components/common/ui/GlowBox";

type VaultActionPanelProps = {
  vault: TYDaemonVault;
};

export function VaultActionPanel({ vault }: VaultActionPanelProps) {
  const { isConnected } = useAccount();
  const {
    amount,
    onChangeAmount,
    isDepositing,
    onToggleFlow,
    userTokenBalance,
    userVaultBalance,
    maxDepositPossible,
    maxWithdrawPossible,
    expectedOut,
    isLoadingPreview,
  } = useVaultActions();

  if (!isConnected) {
    return (
      <GlowBox sx={{ mt: 4, textAlign: "center" }}>
        <Typography variant="h6" gutterBottom>
          Connect Wallet
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Connect your wallet to deposit or withdraw from this vault
        </Typography>
      </GlowBox>
    );
  }

  const handleMaxClick = () => {
    if (isDepositing) {
      onChangeAmount(maxDepositPossible.normalized.toString());
    } else {
      onChangeAmount(maxWithdrawPossible.normalized.toString());
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === "" || /^\d*\.?\d*$/.test(val)) {
      onChangeAmount(val);
    }
  };

  return (
    <GlowBox sx={{ mt: 4, p: 0 }}>
      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: "divider", px: 3, pt: 2 }}>
        <Tabs
          value={isDepositing ? 0 : 1}
          onChange={(_, val) =>
            val !== (isDepositing ? 0 : 1) && onToggleFlow()
          }
        >
          <Tab label="Deposit" />
          <Tab label="Withdraw" />
        </Tabs>
      </Box>

      {/* Content */}
      <Box sx={{ p: 3 }}>
        {/* Desktop Layout (>= 1200px) */}
        <Box
          sx={{
            display: { xs: "none", xl: "flex" },
            gap: 2,
            alignItems: "center",
          }}
        >
          {/* From Wallet/Vault */}
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mb: 0.5, display: "block" }}
            >
              {isDepositing ? "From wallet" : "From vault"}
            </Typography>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                bgcolor: "rgba(255, 255, 255, 0.05)",
                borderRadius: 1,
                p: 1.5,
                height: "56px",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  minWidth: "120px",
                }}
              >
                <Box
                  sx={{
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    bgcolor: "primary.main",
                  }}
                />
                <Typography variant="body2" fontWeight={600}>
                  {isDepositing ? vault.token.symbol : vault.symbol}
                </Typography>
              </Box>
            </Box>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mt: 0.5, display: "block" }}
            >
              You have{" "}
              {formatAmount(
                isDepositing
                  ? userTokenBalance.normalized
                  : userVaultBalance.normalized,
                4
              )}{" "}
              {isDepositing ? vault.token.symbol : vault.symbol}
            </Typography>
          </Box>

          {/* Amount Input */}
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mb: 0.5, display: "block" }}
            >
              Amount
            </Typography>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                bgcolor: "rgba(255, 255, 255, 0.05)",
                borderRadius: 1,
                p: 1.5,
                height: "56px",
              }}
            >
              <input
                type="text"
                value={amount}
                onChange={handleInputChange}
                placeholder="0"
                style={{
                  flex: 1,
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  color: "inherit",
                  fontSize: "1.125rem",
                  fontWeight: 600,
                }}
              />
              <button
                onClick={handleMaxClick}
                style={{
                  background: "transparent",
                  border: "1px solid #00ffe9",
                  borderRadius: "4px",
                  padding: "2px 8px",
                  color: "#00ffe9",
                  cursor: "pointer",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                }}
              >
                Max
              </button>
            </Box>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mt: 0.5, display: "block" }}
            >
              $0.00
            </Typography>
          </Box>

          {/* Arrow */}
          <Box sx={{ display: "flex", alignItems: "center", pt: 2 }}>
            <ArrowForwardIcon sx={{ color: "primary.main" }} />
          </Box>

          {/* To Vault/Wallet */}
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mb: 0.5, display: "block" }}
            >
              {isDepositing ? "To vault" : "To wallet"}
            </Typography>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                bgcolor: "rgba(255, 255, 255, 0.05)",
                borderRadius: 1,
                p: 1.5,
                height: "56px",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  minWidth: "120px",
                }}
              >
                <Box
                  sx={{
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    bgcolor: "secondary.main",
                  }}
                />
                <Typography variant="body2" fontWeight={600}>
                  {isDepositing ? vault.symbol : vault.token.symbol}
                </Typography>
              </Box>
            </Box>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mt: 0.5, display: "block" }}
            >
              0.00%
            </Typography>
          </Box>

          {/* You will receive */}
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mb: 0.5, display: "block" }}
            >
              You will receive
            </Typography>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                bgcolor: "rgba(255, 255, 255, 0.05)",
                borderRadius: 1,
                p: 1.5,
                height: "56px",
              }}
            >
              {isLoadingPreview ? (
                <Typography variant="body2" color="text.secondary">
                  Calculating...
                </Typography>
              ) : (
                <Typography variant="h6" fontWeight={600}>
                  {formatAmount(expectedOut.normalized, 6)}
                </Typography>
              )}
            </Box>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mt: 0.5, display: "block" }}
            >
              $0.00
            </Typography>
          </Box>

          {/* Action Button */}
          <Box>
            <ActionButtons />
          </Box>
        </Box>

        {/* Tablet Layout (md to xl) - Buttons below */}
        <Box
          sx={{
            display: { xs: "none", md: "flex", xl: "none" },
            flexDirection: "column",
            gap: 2,
          }}
        >
          <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
            {/* From Wallet/Vault */}
            <Box sx={{ flex: 1 }}>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mb: 0.5, display: "block" }}
              >
                {isDepositing ? "From wallet" : "From vault"}
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  bgcolor: "rgba(255, 255, 255, 0.05)",
                  borderRadius: 1,
                  p: 1.5,
                  height: "56px",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    minWidth: "120px",
                  }}
                >
                  <Box
                    sx={{
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      bgcolor: "primary.main",
                    }}
                  />
                  <Typography variant="body2" fontWeight={600}>
                    {isDepositing ? vault.token.symbol : vault.symbol}
                  </Typography>
                </Box>
              </Box>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 0.5, display: "block" }}
              >
                You have{" "}
                {formatAmount(
                  isDepositing
                    ? userTokenBalance.normalized
                    : userVaultBalance.normalized,
                  4
                )}{" "}
                {isDepositing ? vault.token.symbol : vault.symbol}
              </Typography>
            </Box>

            {/* Amount Input */}
            <Box sx={{ flex: 1 }}>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mb: 0.5, display: "block" }}
              >
                Amount
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  bgcolor: "rgba(255, 255, 255, 0.05)",
                  borderRadius: 1,
                  p: 1.5,
                  height: "56px",
                }}
              >
                <input
                  type="text"
                  value={amount}
                  onChange={handleInputChange}
                  placeholder="0"
                  style={{
                    flex: 1,
                    background: "transparent",
                    border: "none",
                    outline: "none",
                    color: "inherit",
                    fontSize: "1.125rem",
                    fontWeight: 600,
                  }}
                />
                <button
                  onClick={handleMaxClick}
                  style={{
                    background: "transparent",
                    border: "1px solid #00ffe9",
                    borderRadius: "4px",
                    padding: "2px 8px",
                    color: "#00ffe9",
                    cursor: "pointer",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                  }}
                >
                  Max
                </button>
              </Box>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 0.5, display: "block" }}
              >
                $0.00
              </Typography>
            </Box>

            {/* Arrow */}
            <Box sx={{ display: "flex", alignItems: "center", pt: 2 }}>
              <ArrowForwardIcon sx={{ color: "primary.main" }} />
            </Box>

            {/* To Vault/Wallet */}
            <Box sx={{ flex: 1 }}>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mb: 0.5, display: "block" }}
              >
                {isDepositing ? "To vault" : "To wallet"}
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  bgcolor: "rgba(255, 255, 255, 0.05)",
                  borderRadius: 1,
                  p: 1.5,
                  height: "56px",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    minWidth: "120px",
                  }}
                >
                  <Box
                    sx={{
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      bgcolor: "secondary.main",
                    }}
                  />
                  <Typography variant="body2" fontWeight={600}>
                    {isDepositing ? vault.symbol : vault.token.symbol}
                  </Typography>
                </Box>
              </Box>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 0.5, display: "block" }}
              >
                0.00%
              </Typography>
            </Box>

            {/* You will receive */}
            <Box sx={{ flex: 1 }}>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mb: 0.5, display: "block" }}
              >
                You will receive
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  bgcolor: "rgba(255, 255, 255, 0.05)",
                  borderRadius: 1,
                  p: 1.5,
                  height: "56px",
                }}
              >
                {isLoadingPreview ? (
                  <Typography variant="body2" color="text.secondary">
                    Calculating...
                  </Typography>
                ) : (
                  <Typography variant="h6" fontWeight={600}>
                    {formatAmount(expectedOut.normalized, 6)}
                  </Typography>
                )}
              </Box>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 0.5, display: "block" }}
              >
                $0.00
              </Typography>
            </Box>
          </Box>

          {/* Action Button Below */}
          <Box>
            <ActionButtons />
          </Box>
        </Box>

        {/* Mobile Layout */}
        <Box
          sx={{
            display: { xs: "flex", md: "none" },
            flexDirection: "column",
            gap: 2,
          }}
        >
          {/* From */}
          <Box>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mb: 0.5, display: "block" }}
            >
              {isDepositing ? "From wallet" : "From vault"}
            </Typography>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                bgcolor: "transparent",
                borderRadius: 1,
                p: 1.5,
                border: 2,
                borderColor: "primary.main",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Box
                  sx={{
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    bgcolor: "primary.main",
                  }}
                />
                <Typography variant="body2" fontWeight={600}>
                  {isDepositing ? vault.token.symbol : vault.symbol}
                </Typography>
              </Box>
            </Box>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mt: 0.5, display: "block" }}
            >
              You have{" "}
              {formatAmount(
                isDepositing
                  ? userTokenBalance.normalized
                  : userVaultBalance.normalized,
                4
              )}{" "}
              {isDepositing ? vault.token.symbol : vault.symbol}
            </Typography>
          </Box>

          {/* Amount */}
          <Box>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mb: 0.5, display: "block" }}
            >
              Amount
            </Typography>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                bgcolor: "transparent",
                borderRadius: 1,
                p: 1.5,
                border: 2,
                borderColor: "primary.main",
              }}
            >
              <input
                type="text"
                value={amount}
                onChange={handleInputChange}
                placeholder="0"
                style={{
                  flex: 1,
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  color: "inherit",
                  fontSize: "1.125rem",
                  fontWeight: 600,
                }}
              />
              <button
                onClick={handleMaxClick}
                style={{
                  background: "rgba(0, 255, 233, 0.1)",
                  border: "2px solid #00ffe9",
                  borderRadius: "4px",
                  padding: "4px 12px",
                  color: "#00ffe9",
                  cursor: "pointer",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                }}
              >
                Max
              </button>
            </Box>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mt: 0.5, display: "block" }}
            >
              $0.00
            </Typography>
          </Box>

          {/* To */}
          <Box>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mb: 0.5, display: "block" }}
            >
              {isDepositing ? "To vault" : "To wallet"}
            </Typography>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                bgcolor: "transparent",
                borderRadius: 1,
                p: 1.5,
                border: 2,
                borderColor: "primary.main",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Box
                  sx={{
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    bgcolor: "secondary.main",
                  }}
                />
                <Typography variant="body2" fontWeight={600}>
                  {isDepositing ? vault.symbol : vault.token.symbol}
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* You will receive */}
          <Box>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mb: 0.5, display: "block" }}
            >
              You will receive
            </Typography>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                bgcolor: "transparent",
                borderRadius: 1,
                p: 1.5,
                border: 2,
                borderColor: "primary.main",
                minHeight: "56px",
              }}
            >
              {isLoadingPreview ? (
                <Typography variant="body2" color="text.secondary">
                  Calculating...
                </Typography>
              ) : (
                <Typography variant="h6" fontWeight={600}>
                  {formatAmount(expectedOut.normalized, 6)}
                </Typography>
              )}
            </Box>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mt: 0.5, display: "block" }}
            >
              $0.00
            </Typography>
          </Box>

          {/* Button */}
          <ActionButtons />
        </Box>
      </Box>
    </GlowBox>
  );
}
