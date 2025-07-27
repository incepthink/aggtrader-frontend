// /components/lend-morpho/borrow/market/PositionTab.tsx
"use client";

import React from "react";
import { Box, Typography, Avatar, Chip, Button, Alert } from "@mui/material";
import { MarketData } from "@/hooks/lend-morpho/MarketDetailHooks";
import { useUserMarketPositions } from "@/hooks/lend-morpho/useUserMarketPosition";
import { useAccount } from "wagmi";

interface PositionTabProps {
  market: MarketData;
}

// Helper function to get token color based on symbol
const getTokenColor = (symbol: string): string => {
  const colorMap: { [key: string]: string } = {
    USDC: "#2775CA",
    USDT: "#26A17B",
    DAI: "#F5AC37",
    WETH: "#627EEA",
    ETH: "#627EEA",
    WBTC: "#F7931A",
    cbBTC: "#F7931A",
    stETH: "#00A3FF",
    wstETH: "#00A3FF",
    sDAI: "#F5AC37",
    "PT-USDS": "#6366F1",
    weETH: "#627EEA",
    RLP: "#FF6B35",
    GMORPHO: "#8B8D98",
  };
  return colorMap[symbol] || "#8B8D98";
};

// Helper function to format numbers
const formatNumber = (num: number): string => {
  if (num >= 1e9) return `${(num / 1e9).toFixed(4)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(4)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(4)}K`;
  return num.toFixed(4);
};

// Helper function to format currency
const formatCurrency = (amount: number): string => {
  if (amount === 0) return "$0.00";
  if (amount < 0.01) return "<$0.01";
  return `$${formatNumber(amount)}`;
};

// Helper function to format percentage
const formatPercentage = (value: number): string => {
  return `${(value * 100).toFixed(2)}%`;
};

const PositionTab: React.FC<PositionTabProps> = ({ market }) => {
  const { isConnected } = useAccount();
  const { data: userPositions, isLoading, error } = useUserMarketPositions(1);

  // Find position for this specific market
  const currentPosition = userPositions?.positions?.find(
    (pos) =>
      pos.market.uniqueKey.toLowerCase() === market.uniqueKey.toLowerCase()
  );

  // Calculate health metrics
  const hasPosition = Boolean(currentPosition);
  const collateralAmount = parseFloat(
    currentPosition?.state?.collateral || "0"
  );
  const borrowAmount = parseFloat(currentPosition?.state?.borrowAssets || "0");
  const collateralUsd = currentPosition?.state?.collateralUsd || 0;
  const borrowUsd = currentPosition?.state?.borrowAssetsUsd || 0;

  // Calculate LTV and health factor
  const currentLtv = collateralUsd > 0 ? borrowUsd / collateralUsd : 0;
  const liquidationLtv = parseFloat(market.lltv) / 1e18; // Convert from wei
  const healthFactor = liquidationLtv > 0 ? liquidationLtv / currentLtv : 0;

  // Risk assessment
  const isHealthy = healthFactor > 1.5;
  const isAtRisk = healthFactor > 1.1 && healthFactor <= 1.5;
  const isDangerous = healthFactor > 0 && healthFactor <= 1.1;

  if (!isConnected) {
    return (
      <Box>
        <Alert
          severity="info"
          sx={{
            mb: 3,
            backgroundColor: "rgba(25, 118, 210, 0.1)",
            color: "#90caf9",
            border: "1px solid rgba(25, 118, 210, 0.3)",
            "& .MuiAlert-icon": { color: "#90caf9" },
          }}
        >
          Connect your wallet to view your position in this market.
        </Alert>
        <Box sx={{ textAlign: "center", py: 4 }}>
          <Typography variant="h6" sx={{ color: "#8b949e", mb: 2 }}>
            Wallet Not Connected
          </Typography>
          <Typography variant="body2" sx={{ color: "#6b7280" }}>
            Please connect your wallet to see your borrowing position
          </Typography>
        </Box>
      </Box>
    );
  }

  if (isLoading) {
    return (
      <Box sx={{ textAlign: "center", py: 4 }}>
        <Typography variant="h6" sx={{ color: "#8b949e" }}>
          Loading your position...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert
        severity="error"
        sx={{
          backgroundColor: "rgba(244, 67, 54, 0.1)",
          color: "#f87171",
          border: "1px solid rgba(244, 67, 54, 0.3)",
        }}
      >
        Failed to load position data. Please try again.
      </Alert>
    );
  }

  if (!hasPosition) {
    return (
      <Box>
        <Alert
          severity="info"
          sx={{
            mb: 3,
            backgroundColor: "rgba(25, 118, 210, 0.1)",
            color: "#90caf9",
            border: "1px solid rgba(25, 118, 210, 0.3)",
          }}
        >
          You don't have any position in this market yet.
        </Alert>

        {/* Market Information for New Users */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" },
            gap: 3,
            mt: 3,
          }}
        >
          {/* Collateral Token Info */}
          <Box
            sx={{
              p: 3,
              backgroundColor: "rgba(0, 245, 224, 0.1)",
              borderRadius: 2,
              border: "1px solid rgba(75, 85, 99, 0.3)",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  backgroundColor: getTokenColor(market.collateralAsset.symbol),
                  fontSize: "14px",
                  fontWeight: "600",
                }}
              >
                {market.collateralAsset.symbol.substring(0, 2).toUpperCase()}
              </Avatar>
              <Box>
                <Typography variant="body2" sx={{ color: "#9ca3af" }}>
                  Collateral Token
                </Typography>
                <Typography
                  variant="h6"
                  sx={{ color: "white", fontWeight: "600" }}
                >
                  {market.collateralAsset.symbol}
                </Typography>
              </Box>
            </Box>
            <Typography variant="body2" sx={{ color: "#6b7280" }}>
              Use {market.collateralAsset.name || market.collateralAsset.symbol}{" "}
              as collateral
            </Typography>
          </Box>

          {/* Loan Token Info */}
          <Box
            sx={{
              p: 3,
              backgroundColor: "rgba(0, 245, 224, 0.1)",
              borderRadius: 2,
              border: "1px solid rgba(75, 85, 99, 0.3)",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  backgroundColor: getTokenColor(market.loanAsset.symbol),
                  fontSize: "14px",
                  fontWeight: "600",
                }}
              >
                {market.loanAsset.symbol.substring(0, 2).toUpperCase()}
              </Avatar>
              <Box>
                <Typography variant="body2" sx={{ color: "#9ca3af" }}>
                  Loan Token
                </Typography>
                <Typography
                  variant="h6"
                  sx={{ color: "white", fontWeight: "600" }}
                >
                  {market.loanAsset.symbol}
                </Typography>
              </Box>
            </Box>
            <Typography variant="body2" sx={{ color: "#6b7280" }}>
              Borrow {market.loanAsset.name || market.loanAsset.symbol}
            </Typography>
          </Box>
        </Box>

        {/* Market Limits */}
        <Box
          sx={{
            mt: 3,
            p: 3,
            backgroundColor: "rgba(0, 245, 224, 0.1)",
            borderRadius: 2,
          }}
        >
          <Typography variant="h6" sx={{ color: "white", mb: 2 }}>
            Market Limits
          </Typography>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" },
              gap: 2,
            }}
          >
            <Box>
              <Typography variant="body2" sx={{ color: "#9ca3af" }}>
                Maximum LTV
              </Typography>
              <Typography
                variant="body1"
                sx={{ color: "white", fontWeight: "500" }}
              >
                {formatPercentage(liquidationLtv)}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" sx={{ color: "#9ca3af" }}>
                Current Borrow Rate
              </Typography>
              <Typography
                variant="body1"
                sx={{ color: "#f87171", fontWeight: "500" }}
              >
                {formatPercentage(market.borrowApy)}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      {/* Position Overview */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h5"
          sx={{ color: "white", mb: 3, fontWeight: "600" }}
        >
          Your Position
        </Typography>

        {/* Health Status Alert */}
        {isDangerous && (
          <Alert
            severity="error"
            sx={{
              mb: 3,
              backgroundColor: "rgba(244, 67, 54, 0.1)",
              color: "#f87171",
              border: "1px solid rgba(244, 67, 54, 0.3)",
            }}
          >
            ⚠️ Your position is at high risk of liquidation! Health factor:{" "}
            {healthFactor.toFixed(2)}
          </Alert>
        )}

        {isAtRisk && (
          <Alert
            severity="warning"
            sx={{
              mb: 3,
              backgroundColor: "rgba(255, 152, 0, 0.1)",
              color: "#ffb74d",
              border: "1px solid rgba(255, 152, 0, 0.3)",
            }}
          >
            Your position needs attention. Health factor:{" "}
            {healthFactor.toFixed(2)}
          </Alert>
        )}

        {isHealthy && (
          <Alert
            severity="success"
            sx={{
              mb: 3,
              backgroundColor: "rgba(76, 175, 80, 0.1)",
              color: "#81c784",
              border: "1px solid rgba(76, 175, 80, 0.3)",
            }}
          >
            Your position is healthy. Health factor: {healthFactor.toFixed(2)}
          </Alert>
        )}
      </Box>

      {/* Position Details Grid */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" },
          gap: 3,
          mb: 4,
        }}
      >
        {/* Collateral Position */}
        <Box
          sx={{
            p: 3,
            backgroundColor: "rgba(0, 245, 224, 0.1)",
            borderRadius: 2,
            border: "1px solid rgba(75, 85, 99, 0.3)",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
            <Avatar
              sx={{
                width: 32,
                height: 32,
                backgroundColor: getTokenColor(market.collateralAsset.symbol),
                fontSize: "14px",
                fontWeight: "600",
              }}
            >
              {market.collateralAsset.symbol.substring(0, 2).toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant="body2" sx={{ color: "#9ca3af" }}>
                Collateral Position
              </Typography>
              <Typography
                variant="h6"
                sx={{ color: "white", fontWeight: "600" }}
              >
                {market.collateralAsset.symbol}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ space: 2 }}>
            <Typography
              variant="h4"
              sx={{ color: "white", fontWeight: "700", mb: 1 }}
            >
              {formatNumber(collateralAmount)}
            </Typography>
            <Typography variant="body1" sx={{ color: "#9ca3af" }}>
              {formatCurrency(collateralUsd)}
            </Typography>
          </Box>
        </Box>

        {/* Loan Position */}
        <Box
          sx={{
            p: 3,
            backgroundColor: "rgba(0, 245, 224, 0.1)",
            borderRadius: 2,
            border: "1px solid rgba(75, 85, 99, 0.3)",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
            <Avatar
              sx={{
                width: 32,
                height: 32,
                backgroundColor: getTokenColor(market.loanAsset.symbol),
                fontSize: "14px",
                fontWeight: "600",
              }}
            >
              {market.loanAsset.symbol.substring(0, 2).toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant="body2" sx={{ color: "#9ca3af" }}>
                Loan Position
              </Typography>
              <Typography
                variant="h6"
                sx={{ color: "white", fontWeight: "600" }}
              >
                {market.loanAsset.symbol}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ space: 2 }}>
            <Typography
              variant="h4"
              sx={{ color: "white", fontWeight: "700", mb: 1 }}
            >
              {formatNumber(borrowAmount)}
            </Typography>
            <Typography variant="body1" sx={{ color: "#9ca3af" }}>
              {formatCurrency(borrowUsd)}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Risk Metrics */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
          gap: 3,
          mb: 4,
        }}
      >
        {/* Current LTV */}
        <Box
          sx={{
            p: 3,
            backgroundColor: "rgba(0, 245, 224, 0.1)",
            borderRadius: 2,
            textAlign: "center",
          }}
        >
          <Typography variant="body2" sx={{ color: "#9ca3af", mb: 1 }}>
            Current LTV
          </Typography>
          <Typography
            variant="h5"
            sx={{
              color: isDangerous ? "#f87171" : isAtRisk ? "#ffb74d" : "#81c784",
              fontWeight: "600",
            }}
          >
            {formatPercentage(currentLtv)}
          </Typography>
        </Box>

        {/* Liquidation LTV */}
        <Box
          sx={{
            p: 3,
            backgroundColor: "rgba(0, 245, 224, 0.1)",
            borderRadius: 2,
            textAlign: "center",
          }}
        >
          <Typography variant="body2" sx={{ color: "#9ca3af", mb: 1 }}>
            Liquidation LTV
          </Typography>
          <Typography variant="h5" sx={{ color: "white", fontWeight: "600" }}>
            {formatPercentage(liquidationLtv)}
          </Typography>
        </Box>

        {/* Health Factor */}
        <Box
          sx={{
            p: 3,
            backgroundColor: "rgba(0, 245, 224, 0.1)",
            borderRadius: 2,
            textAlign: "center",
          }}
        >
          <Typography variant="body2" sx={{ color: "#9ca3af", mb: 1 }}>
            Health Factor
          </Typography>
          <Typography
            variant="h5"
            sx={{
              color: isDangerous ? "#f87171" : isAtRisk ? "#ffb74d" : "#81c784",
              fontWeight: "600",
            }}
          >
            {healthFactor > 0 ? healthFactor.toFixed(2) : "∞"}
          </Typography>
        </Box>
      </Box>

      {/* Action Buttons */}
    </Box>
  );
};

export default PositionTab;
