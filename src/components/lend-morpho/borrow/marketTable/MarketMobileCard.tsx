import React from "react";
import { Box, Typography, Chip, Avatar, Button } from "@mui/material";
import { BorrowRateSummary } from "./BorrowRateSummary";

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

// Helper function to format large numbers with better error handling
const formatNumber = (
  value: string | number,
  decimals: number = 18
): string => {
  try {
    const numValue = typeof value === "string" ? parseFloat(value) : value;
    if (isNaN(numValue) || numValue === 0) return "0.00";

    const num = numValue / Math.pow(10, decimals);

    if (num >= 1e9) {
      return `${(num / 1e9).toFixed(2)}B`;
    } else if (num >= 1e6) {
      return `${(num / 1e6).toFixed(2)}M`;
    } else if (num >= 1e3) {
      return `${(num / 1e3).toFixed(2)}K`;
    }

    return num.toFixed(2);
  } catch (error) {
    console.warn("Error formatting number:", value, error);
    return "0.00";
  }
};

// Helper function to format USD values with better error handling
const formatUsd = (value: number): string => {
  try {
    if (isNaN(value) || value === 0) return "$0.00";

    if (value >= 1e9) {
      return `$${(value / 1e9).toFixed(2)}B`;
    } else if (value >= 1e6) {
      return `$${(value / 1e6).toFixed(2)}M`;
    } else if (value >= 1e3) {
      return `$${(value / 1e3).toFixed(2)}K`;
    }

    return `$${value.toFixed(2)}`;
  } catch (error) {
    console.warn("Error formatting USD value:", value, error);
    return "$0.00";
  }
};

interface MarketMobileCardProps {
  market: any;
  favorites: Set<string>;
  onMarketClick: (market: any) => void;
  onToggleFavorite: (marketId: string, event: React.MouseEvent) => void;
}

const MarketMobileCard: React.FC<MarketMobileCardProps> = ({
  market,
  favorites,
  onMarketClick,
  onToggleFavorite,
}) => {
  return (
    <Box
      sx={{
        // backgroundColor: "rgba(31, 41, 55, 0.8)",
        // borderRadius: 2,
        py: 3,
        borderBottom: "2px solid rgba(55, 65, 81, 1)",
        // cursor: "pointer",
        transition: "all 0.2s ease-in-out",
        // "&:hover": {
        //   backgroundColor: "rgba(55, 65, 81, 0.4)",
        //   transform: "translateY(-1px)",
        // },
      }}
      // onClick={() => onMarketClick(market)}
    >
      {/* Header with Token Pair and Borrow Button */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {/* Collateral Token */}
          <Avatar
            sx={{
              width: 24,
              height: 24,
              fontSize: "12px",
              fontWeight: 600,
              backgroundColor: getTokenColor(
                market.collateralAsset?.symbol || ""
              ),
            }}
          >
            {(market.collateralAsset?.symbol || "")
              .substring(0, 2)
              .toUpperCase()}
          </Avatar>

          {/* Loan Token */}
          <Avatar
            sx={{
              width: 24,
              height: 24,
              fontSize: "12px",
              fontWeight: 600,
              backgroundColor: getTokenColor(market.loanAsset?.symbol || ""),
              ml: -0.5, // Slight overlap like in the image
            }}
          >
            {(market.loanAsset?.symbol || "").substring(0, 2).toUpperCase()}
          </Avatar>

          {/* Token Pair Text */}
          <Typography
            sx={{
              color: "#FFFFFF",
              fontSize: "1rem",
              fontWeight: "600",
              ml: 1,
            }}
          >
            {market.collateralAsset?.symbol} / {market.loanAsset?.symbol}
          </Typography>
        </Box>

        <BorrowRateSummary
          nativeApr={market.state?.borrowApy || 0}
          rewards={market.state?.rewards}
        />

        {/* <Button
          variant="contained"
          size="small"
          sx={{
            backgroundColor: "#3B82F6",
            color: "white",
            fontSize: "0.75rem",
            textTransform: "none",
            borderRadius: "6px",
            px: 2,
            py: 0.5,
            minWidth: "60px",
            "&:hover": {
              backgroundColor: "#2563EB",
            },
          }}
          onClick={(e) => {
            e.stopPropagation();
            onMarketClick(market);
          }}
        >
          Borrow
        </Button> */}
      </Box>

      {/* Stats Row */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        {/* Market Size */}
        <Box>
          <Typography
            variant="body1"
            sx={{
              fontWeight: 600,
              fontSize: "1rem",
              color: "white",
              mb: 0.5,
            }}
          >
            {formatUsd(
              (market.state?.supplyAssetsUsd || 0) / market.loanAsset.priceUsd
            ).replace("$", "")}{" "}
            {market.loanAsset?.symbol || ""}
          </Typography>
          <div className="flex gap-2">
            <Typography
              variant="caption"
              sx={{
                color: "#9CA3AF",
                fontSize: "0.8rem",
              }}
            >
              Market Size:
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: "#9CA3AF",
                fontSize: "0.8rem",
              }}
            >
              {formatUsd(market.state?.supplyAssetsUsd || 0)}
            </Typography>
          </div>
        </Box>

        {/* LLTV */}
        <div className="flex gap-2 items-end">
          <Typography
            variant="caption"
            sx={{
              color: "#9CA3AF",
              fontSize: "0.8rem",
            }}
          >
            LLTV
          </Typography>
          <Typography
            sx={{
              color: "#FFFFFF",
              fontSize: "1rem",
              fontWeight: "600",
            }}
          >
            {((market.lltv / 1e18) * 100).toFixed(2)}%
          </Typography>
        </div>
      </Box>
      <Button
        variant="contained"
        sx={{
          width: "100%",
          backgroundColor: "#3B82F6",
          color: "white",
          fontSize: "0.75rem",
          textTransform: "none",
          borderRadius: "6px",
          mt: 2,
          minWidth: "60px",
          "&:hover": {
            backgroundColor: "#2563EB",
          },
        }}
        onClick={(e) => {
          e.stopPropagation();
          onMarketClick(market);
        }}
      >
        Borrow
      </Button>
    </Box>
  );
};

export default MarketMobileCard;
