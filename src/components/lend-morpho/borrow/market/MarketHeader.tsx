// /components/lend-morpho/borrow/market/MarketHeader.tsx
"use client";

import React from "react";
import {
  Box,
  Typography,
  Avatar,
  Chip,
  IconButton,
  Tooltip,
} from "@mui/material";
import { ContentCopy, OpenInNew } from "@mui/icons-material";
import { MarketData } from "@/hooks/lend-morpho/MarketDetailHooks";

interface MarketHeaderProps {
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

export default function MarketHeader({ market }: MarketHeaderProps) {
  const handleCopyAddress = () => {
    if (market?.uniqueKey) {
      navigator.clipboard.writeText(market.uniqueKey);
    }
  };

  const handleOpenEtherscan = () => {
    if (market?.uniqueKey) {
      window.open(`https://etherscan.io/address/${market.uniqueKey}`, "_blank");
    }
  };

  const formatMarketName = () => {
    const collateralSymbol = market?.collateralAsset?.symbol || "Unknown";
    const loanSymbol = market?.loanAsset?.symbol || "Unknown";
    return `${collateralSymbol} / ${loanSymbol}`;
  };

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

  // Safe access to market properties with fallbacks
  const collateralSymbol = market?.collateralAsset?.symbol || "Unknown";
  const collateralLogo = market?.collateralAsset?.logoURI;
  const loanSymbol = market?.loanAsset?.symbol || "Unknown";
  const loanLogo = market?.loanAsset?.logoURI;
  const collateralName = market?.collateralAsset?.name || collateralSymbol;
  const loanName = market?.loanAsset?.name || loanSymbol;
  const isWhitelisted = Boolean(market?.whitelisted);
  const marketAddress = market?.uniqueKey || "";
  const oracleType =
    market?.oracle?.type || market?.oracleInfo?.type || "Unknown";
  const warnings = market?.warnings || [];

  return (
    <Box>
      {/* Market Title and Assets */}
      <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 1, sm: 2 }, mb: 2, flexWrap: "wrap" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 0.5, sm: 1 } }}>
          {/* Collateral Asset Avatar */}
          <Box sx={{ width: { xs: 32, sm: 40 }, height: { xs: 32, sm: 40 }, borderRadius: "50%", overflow: "hidden" }}>
            <img src={collateralLogo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </Box>
          <Typography variant="h5" sx={{ color: "white", fontSize: { xs: "1.25rem", sm: "1.5rem", md: "2rem" } }}>
            {collateralSymbol}
          </Typography>
          <Typography variant="h5" sx={{ color: "white", mx: { xs: 0.5, sm: 1 }, fontSize: { xs: "1.25rem", sm: "1.5rem", md: "2rem" } }}>
            /
          </Typography>
          {/* Loan Asset Avatar */}
          <Box sx={{ width: { xs: 32, sm: 40 }, height: { xs: 32, sm: 40 }, borderRadius: "50%", overflow: "hidden" }}>
            <img src={loanLogo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </Box>
          <Typography variant="h5" sx={{ color: "white", fontSize: { xs: "1.25rem", sm: "1.5rem", md: "2rem" } }}>
            {loanSymbol}
          </Typography>
        </Box>
      </Box>

      {/* Market Info Row */}
      <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 1, sm: 2 }, mb: 2, flexWrap: "wrap" }}>
        {/* LLTV Badge */}
        <Chip
          label={`LLTV: ${formatLLTV()}`}
          size="small"
          sx={{
            backgroundColor: "#2d3748",
            color: "white",
            fontWeight: "500",
            fontSize: { xs: "0.7rem", sm: "0.75rem" },
          }}
        />

        {/* Whitelisted Badge */}
        {isWhitelisted && (
          <Chip
            label="Whitelisted"
            size="small"
            sx={{
              backgroundColor: "rgba(46, 125, 50, 0.1)",
              color: "#4caf50",
              fontWeight: "500",
              border: "1px solid rgba(76, 175, 80, 0.3)",
              fontSize: { xs: "0.7rem", sm: "0.75rem" },
            }}
          />
        )}

        <Tooltip title="View on Etherscan">
          <IconButton
            size="small"
            onClick={handleOpenEtherscan}
            sx={{
              color: "#8b949e",
              "&:hover": { color: "white" },
              p: { xs: 0.5, sm: 1 },
            }}
          >
            <OpenInNew fontSize="small" />
          </IconButton>
        </Tooltip>

        {/* Market Address with Copy/Open Actions */}
        {/* {marketAddress && (
          <Box
            sx={{ display: "flex", alignItems: "center", gap: 1, ml: "auto" }}
          >
            <Tooltip title="View on Etherscan">
              <IconButton
                size="small"
                onClick={handleOpenEtherscan}
                sx={{
                  color: "#8b949e",
                  "&:hover": { color: "white" },
                }}
              >
                <OpenInNew fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        )} */}
      </Box>

      {/* Asset Details Row */}
      <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, alignItems: { xs: "flex-start", sm: "center" }, gap: { xs: 2, sm: 4 }, mb: 2 }}>
        {/* Collateral Asset Details */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box sx={{ width: 20, height: 20, borderRadius: "50%", overflow: "hidden", flexShrink: 0 }}>
            <img src={collateralLogo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </Box>
          <Box>
            <Typography
              variant="body2"
              sx={{ color: "#8b949e", fontSize: { xs: "0.7rem", sm: "0.75rem" } }}
            >
              Collateral Token
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: "white", fontWeight: "500", fontSize: { xs: "0.875rem", sm: "0.875rem" } }}
            >
              {collateralName}
            </Typography>
          </Box>
        </Box>

        {/* Loan Asset Details */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box sx={{ width: 20, height: 20, borderRadius: "50%", overflow: "hidden", flexShrink: 0 }}>
            <img src={loanLogo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </Box>
          <Box>
            <Typography
              variant="body2"
              sx={{ color: "#8b949e", fontSize: { xs: "0.7rem", sm: "0.75rem" } }}
            >
              Loan Token
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: "white", fontWeight: "500", fontSize: { xs: "0.875rem", sm: "0.875rem" } }}
            >
              {loanName}
            </Typography>
          </Box>
        </Box>

        {/* Oracle Info */}
        {/* {oracleType && oracleType !== "Unknown" && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Avatar
              sx={{
                width: 20,
                height: 20,
                backgroundColor: "#6366f1",
                fontSize: "10px",
                fontWeight: "600",
              }}
            >
              O
            </Avatar>
            <Box>
              <Typography
                variant="body2"
                sx={{ color: "#8b949e", fontSize: "0.75rem" }}
              >
                Oracle Type
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: "white", fontWeight: "500" }}
              >
                {oracleType}
              </Typography>
            </Box>
          </Box>
        )} */}
      </Box>

      {/* Warnings */}
      {warnings.length > 0 && (
        <Box sx={{ display: "flex", gap: { xs: 0.5, sm: 1 }, mb: 2, flexWrap: "wrap" }}>
          {warnings.map((warning, index) => (
            <Chip
              key={index}
              label={
                warning.type?.replace(/_/g, " ").toUpperCase() || "WARNING"
              }
              size="small"
              sx={{
                backgroundColor:
                  warning.level === "RED" ? "#d32f2f" : "#ed6c02",
                color: "white",
                fontSize: { xs: "0.7rem", sm: "0.75rem" },
                fontWeight: "500",
              }}
            />
          ))}
        </Box>
      )}

      {/* Market Description/Status */}
      <Typography
        variant="body2"
        sx={{
          color: "#8b949e",
          lineHeight: 1.6,
          mb: 2,
          fontSize: { xs: "0.8rem", sm: "0.875rem" },
        }}
      >
        This market allows you to use {collateralSymbol} as collateral to borrow{" "}
        {loanSymbol} with a maximum loan-to-value ratio of {formatLLTV()}.
        {isWhitelisted && " This market is whitelisted by Morpho."}
      </Typography>
    </Box>
  );
}
