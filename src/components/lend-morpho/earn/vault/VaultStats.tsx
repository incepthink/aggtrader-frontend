"use client";

import React from "react";
import { Box, Typography, Paper, Tooltip, IconButton } from "@mui/material";
import InfoIcon from "@mui/icons-material/Info";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import { VaultDetail } from "@/hooks/lend-morpho/ValutDescriptionHooks";

interface VaultStatsProps {
  vault: VaultDetail;
}

// Helper function to format large numbers
const formatNumber = (num: number): string => {
  if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
  return num.toFixed(2);
};

// Helper function to format currency
const formatCurrency = (amount: string | number, decimals: number): string => {
  const num =
    (typeof amount === "string" ? parseFloat(amount) : amount) /
    Math.pow(10, decimals);
  return formatNumber(num);
};

const VaultStats: React.FC<VaultStatsProps> = ({ vault }) => {
  // Calculate liquidity correctly
  const totalDepositsUsd = vault.state.totalAssetsUsd;

  // Calculate total allocated USD across all markets
  const allocatedUsd =
    vault.state.allocation?.reduce(
      (sum, alloc) => sum + (alloc.supplyAssetsUsd || 0),
      0
    ) || 0;

  // Liquidity = Total Assets - Allocated Assets (money not currently deployed)
  const liquidityUsd = vault.liquidity.usd;

  // Calculate liquidity in native token terms
  const totalAssetsInToken =
    parseFloat(vault.state.totalAssets) / Math.pow(10, vault.asset.decimals);
  const allocatedInToken =
    vault.state.allocation?.reduce((sum, alloc) => {
      // Convert supplyAssets from string to number and normalize by decimals
      const supplyAssets =
        parseFloat(alloc.supplyAssets || "0") /
        Math.pow(10, vault.asset.decimals);
      return sum + supplyAssets;
    }, 0) || 0;

  const liquidityInToken = Math.max(totalAssetsInToken - allocatedInToken, 0);

  console.log("VAULT DEBUG:", {
    totalDepositsUsd,
    allocatedUsd,
    liquidityUsd,
    totalAssetsInToken,
    allocatedInToken,
    liquidityInToken,
    allocation: vault.state.allocation,
    vault,
  });

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "1fr",
          sm: "repeat(2, 1fr)",
          md: "repeat(3, 1fr)",
        },
        gap: 3,
      }}
    >
      {/* Total Deposits */}
      <Paper
        sx={{
          p: 3,
          backgroundColor: "rgba(0, 245, 224, 0.1)",
          borderRadius: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
          <Typography variant="body2" sx={{ color: "#8b949e" }}>
            Total Deposits
          </Typography>
        </Box>
        <Typography
          variant="h4"
          sx={{ fontWeight: "bold", color: "white", mb: 1 }}
        >
          ${formatNumber(totalDepositsUsd)}
        </Typography>
        <Typography variant="body2" sx={{ color: "#8b949e" }}>
          {formatNumber(totalAssetsInToken)} {vault.asset.symbol}
        </Typography>
      </Paper>

      {/* Liquidity */}
      <Paper
        sx={{
          p: 3,
          backgroundColor: "rgba(0, 245, 224, 0.1)",
          borderRadius: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
          <Typography variant="body2" sx={{ color: "#8b949e" }}>
            Liquidity
          </Typography>
        </Box>
        <Typography
          variant="h4"
          sx={{ fontWeight: "bold", color: "white", mb: 1 }}
        >
          ${formatNumber(liquidityUsd)}
        </Typography>
        <Typography variant="body2" sx={{ color: "#8b949e" }}>
          {formatNumber(liquidityInToken)} {vault.asset.symbol}
        </Typography>
      </Paper>

      {/* APY */}
      <Paper
        sx={{
          p: 3,
          backgroundColor: "rgba(0, 245, 224, 0.1)",
          borderRadius: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
          <Typography variant="body2" sx={{ color: "#8b949e" }}>
            APY
          </Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: "bold",
              color: vault.state.avgNetApy > 0 ? "#4caf50" : "#f44336",
            }}
          >
            {(vault.state.avgNetApy * 100).toFixed(2)}%
          </Typography>
          {vault.state.avgNetApy > 0 && (
            <TrendingUpIcon sx={{ color: "#4caf50", fontSize: 20 }} />
          )}
        </Box>
        {vault.asset.yield?.apr && (
          <Typography variant="body2" sx={{ color: "#8b949e" }}>
            Base: {(vault.asset.yield.apr * 100).toFixed(2)}%
          </Typography>
        )}
      </Paper>
    </Box>
  );
};

export default VaultStats;
