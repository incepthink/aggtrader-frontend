// /components/lend-morpho/borrow/market/MarketStats.tsx
"use client";

import React from "react";
import { Box, Typography, Paper, Tooltip, IconButton } from "@mui/material";
import { InfoOutlined, TrendingUp } from "@mui/icons-material";
import { MarketData } from "@/hooks/lend-morpho/MarketDetailHooks";

interface MarketStatsProps {
  market: MarketData;
}

// Helper function to format large numbers from wei/raw values
const formatTokenAmount = (
  value: string | number,
  decimals: number = 18
): number => {
  try {
    if (!value) return 0;
    const numValue = typeof value === "string" ? parseFloat(value) : value;
    if (isNaN(numValue)) return 0;

    // Convert from wei to token amount
    return numValue / Math.pow(10, decimals);
  } catch (error) {
    console.warn("Error formatting token amount:", error);
    return 0;
  }
};

// Helper function to format display numbers
const formatNumber = (num: number): string => {
  if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
  return num.toFixed(2);
};

export default function MarketStats({ market }: MarketStatsProps) {
  const formatCurrency = (value: number) => {
    return `$${formatNumber(value)}`;
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(2)}%`;
  };

  // Safe number parsing with proper decimal handling
  const supplyAssetsUsd = market?.state?.supplyAssetsUsd || 0;
  const borrowAssetsUsd = market?.state?.borrowAssetsUsd || 0;
  const liquidityAssetsUsd = market?.state?.liquidityAssetsUsd || 0;

  // Format token amounts properly (convert from wei)
  const supplyAssets = formatTokenAmount(
    market?.state?.supplyAssets || "0",
    market?.loanAsset?.decimals || 18
  );

  const borrowAssets = formatTokenAmount(
    market?.state?.borrowAssets || "0",
    market?.loanAsset?.decimals || 18
  );

  const liquidityAssets = formatTokenAmount(
    market?.state?.liquidityAssets || "0",
    market?.loanAsset?.decimals || 18
  );

  // Calculate utilization safely
  const utilization = market?.state?.utilization || 0;

  // Format LLTV properly
  const formatLLTV = () => {
    try {
      if (!market?.lltv) return "0.00%";
      const lltv =
        typeof market.lltv === "string" ? parseFloat(market.lltv) : market.lltv;
      if (isNaN(lltv)) return "0.00%";

      // Convert from wei to percentage
      const percentage = (lltv / 1e18) * 100;
      return `${percentage.toFixed(2)}%`;
    } catch (error) {
      console.warn("Error formatting LLTV:", error);
      return "0.00%";
    }
  };

  // Safe APY formatting
  const borrowApy = market?.state?.borrowApy || market?.borrowApy || 0;
  const supplyApy = market?.state?.supplyApy || market?.supplyApy || 0;

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "1fr",
          sm: "repeat(2, 1fr)",
          md: "repeat(4, 1fr)",
        },
        gap: 3,
      }}
    >
      {/* Total Market Size */}
      <Paper
        sx={{
          p: 3,
          backgroundColor: "rgba(0, 245, 224, 0.1)",
          borderRadius: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
          <Typography variant="body2" sx={{ color: "#8b949e" }}>
            Total Market Size
          </Typography>
          <Tooltip title="Total value of assets supplied to this market">
            <IconButton size="small" sx={{ color: "#8b949e" }}>
              <InfoOutlined fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
        <Typography
          variant="h4"
          sx={{ fontWeight: "bold", color: "white", mb: 1 }}
        >
          {formatCurrency(supplyAssetsUsd)}
        </Typography>
        <Typography variant="body2" sx={{ color: "#8b949e" }}>
          {formatNumber(supplyAssets)} {market?.loanAsset?.symbol || ""}
        </Typography>
      </Paper>

      {/* Total Liquidity */}
      <Paper
        sx={{
          p: 3,
          backgroundColor: "rgba(0, 245, 224, 0.1)",
          borderRadius: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
          <Typography variant="body2" sx={{ color: "#8b949e" }}>
            Total Liquidity
          </Typography>
          <Tooltip title="Available assets for borrowing">
            <IconButton size="small" sx={{ color: "#8b949e" }}>
              <InfoOutlined fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
        <Typography
          variant="h4"
          sx={{ fontWeight: "bold", color: "white", mb: 1 }}
        >
          {formatCurrency(liquidityAssetsUsd)}
        </Typography>
        <Typography variant="body2" sx={{ color: "#8b949e" }}>
          {formatNumber(liquidityAssets)} {market?.loanAsset?.symbol || ""}
        </Typography>
      </Paper>

      {/* Borrow Rate */}
      <Paper
        sx={{
          p: 3,
          backgroundColor: "rgba(0, 245, 224, 0.1)",
          borderRadius: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
          <Typography variant="body2" sx={{ color: "#8b949e" }}>
            Borrow Rate
          </Typography>
          <Tooltip title="Current annual borrowing rate">
            <IconButton size="small" sx={{ color: "#8b949e" }}>
              <InfoOutlined fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: "bold",
              color: "#f44336",
            }}
          >
            {formatPercentage(borrowApy)}
          </Typography>
          {borrowApy > 0 && (
            <TrendingUp sx={{ color: "#4caf50", fontSize: 20 }} />
          )}
        </Box>
      </Paper>

      {/* LLTV */}
      <Paper
        sx={{
          p: 3,
          backgroundColor: "rgba(0, 245, 224, 0.1)",
          borderRadius: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
          <Typography variant="body2" sx={{ color: "#8b949e" }}>
            Liq. Loan-To-Value (LLTV)
          </Typography>
          <Tooltip title="Maximum loan-to-value ratio before liquidation">
            <IconButton size="small" sx={{ color: "#8b949e" }}>
              <InfoOutlined fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
        <Typography variant="h4" sx={{ fontWeight: "bold", color: "white" }}>
          {formatLLTV()}
        </Typography>
      </Paper>

      {/* Total Borrow */}
      <Paper
        sx={{
          p: 3,
          backgroundColor: "rgba(0, 245, 224, 0.1)",
          borderRadius: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
          <Typography variant="body2" sx={{ color: "#8b949e" }}>
            Total Borrow (USD)
          </Typography>
          <Tooltip title="Total value of borrowed assets">
            <IconButton size="small" sx={{ color: "#8b949e" }}>
              <InfoOutlined fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
        <Typography
          variant="h4"
          sx={{ fontWeight: "bold", color: "white", mb: 1 }}
        >
          {formatCurrency(borrowAssetsUsd)}
        </Typography>
        <Typography variant="body2" sx={{ color: "#8b949e" }}>
          {formatNumber(borrowAssets)} {market?.loanAsset?.symbol || ""}
        </Typography>
      </Paper>

      {/* Utilization */}
      <Paper
        sx={{
          p: 3,
          backgroundColor: "rgba(0, 245, 224, 0.1)",
          borderRadius: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
          <Typography variant="body2" sx={{ color: "#8b949e" }}>
            Utilization
          </Typography>
          <Tooltip title="Percentage of supplied assets currently borrowed">
            <IconButton size="small" sx={{ color: "#8b949e" }}>
              <InfoOutlined fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
        <Typography
          variant="h4"
          sx={{ fontWeight: "bold", color: "white", mb: 2 }}
        >
          {formatPercentage(utilization)}
        </Typography>

        {/* Utilization Bar */}
        <Box
          sx={{
            width: "100%",
            height: 8,
            backgroundColor: "#2d3748",
            borderRadius: 1,
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              width: `${Math.min(utilization * 100, 100)}%`,
              height: "100%",
              backgroundColor:
                utilization > 0.9
                  ? "#f44336"
                  : utilization > 0.7
                  ? "#ff9800"
                  : "#4caf50",
              borderRadius: 1,
              transition: "all 0.3s ease",
            }}
          />
        </Box>
      </Paper>

      {/* Supply APY (Additional metric) */}
      <Paper
        sx={{
          p: 3,
          backgroundColor: "rgba(0, 245, 224, 0.1)",
          borderRadius: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
          <Typography variant="body2" sx={{ color: "#8b949e" }}>
            Supply APY
          </Typography>
          <Tooltip title="Annual percentage yield for suppliers">
            <IconButton size="small" sx={{ color: "#8b949e" }}>
              <InfoOutlined fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: "bold",
              color: "#4caf50",
            }}
          >
            {formatPercentage(supplyApy)}
          </Typography>
          {supplyApy > 0 && (
            <TrendingUp sx={{ color: "#4caf50", fontSize: 20 }} />
          )}
        </Box>
      </Paper>

      {/* Oracle Fee (Additional metric) */}
      {/* <Paper
        sx={{
          p: 3,
          backgroundColor: "rgba(0, 245, 224, 0.1)",
          borderRadius: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
          <Typography variant="body2" sx={{ color: "#8b949e" }}>
            Oracle Fee
          </Typography>
          <Tooltip title="Fee charged by the market">
            <IconButton size="small" sx={{ color: "#8b949e" }}>
              <InfoOutlined fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
        <Typography variant="h4" sx={{ fontWeight: "bold", color: "white" }}>
          {formatPercentage(market?.state?.fee || 0)}
        </Typography>
      </Paper> */}
    </Box>
  );
}
