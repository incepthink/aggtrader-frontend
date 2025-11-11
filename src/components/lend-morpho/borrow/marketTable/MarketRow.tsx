// components/lend/markets/MarketRow.tsx
import React from "react";
import {
  TableRow,
  TableCell,
  Box,
  Typography,
  Avatar,
  Chip,
} from "@mui/material";
import { BorrowRateSummary } from "./BorrowRateSummary";
// import { VaultListingSummary } from "./VaultListingSummary";

// Helper function to get token color based on symbol
export const getTokenColor = (symbol: string): string => {
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

interface MarketRowProps {
  market: any;
  index: number;
  isLastRow: boolean;
  favorites: Set<string>;
  onRowClick: (market: any) => void;
  onToggleFavorite: (marketId: string, event: React.MouseEvent) => void;
}

const MarketRow: React.FC<MarketRowProps> = ({
  market,
  index,
  isLastRow,
  favorites,
  onRowClick,
  onToggleFavorite,
}) => {
  const TokenInfo = ({ asset }: { asset: any }) => (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <Avatar
        sx={{
          width: 24,
          height: 24,
          fontSize: "12px",
          fontWeight: 600,
          backgroundColor: getTokenColor(asset?.symbol || ""),
        }}
      >
        {(asset?.symbol || "").substring(0, 2).toUpperCase()}
      </Avatar>
      <Typography
        sx={{
          color: "#FFFFFF",
          fontSize: "14px",
          fontWeight: "500",
        }}
      >
        {asset?.symbol || "Unknown"}
      </Typography>
    </Box>
  );

  const VaultChip = ({ vaults }: { vaults: any }) =>
    vaults.map((vault: any, i: any) => {
      return (
        <Chip
          label={vault.symbol || vault.name || "Vault"}
          size="small"
          sx={{
            backgroundColor: "primary.light",
            color: "#FFFFFF",
            fontSize: "10px",
            fontWeight: "600",
            height: "20px",
            "& .MuiChip-label": {
              padding: "0 6px",
            },
          }}
        />
      );
    });

  return (
    <TableRow
      onClick={() => onRowClick(market)}
      sx={{
        cursor: "pointer",
        "&:hover": {
          backgroundColor: "rgba(55, 65, 81, 0.3)",
        },
        borderBottom: isLastRow ? "none" : "1px solid rgba(55, 65, 81, 0.3)",
      }}
    >
      {/* Collateral */}
      <TableCell
        sx={{
          color: "white",
          borderBottom: "none",
          py: 2,
        }}
      >
        <TokenInfo asset={market.collateralAsset} />
      </TableCell>

      {/* Loan */}
      <TableCell
        sx={{
          color: "white",
          borderBottom: "none",
          py: 2,
        }}
      >
        <TokenInfo asset={market.loanAsset} />
      </TableCell>

      {/* LLTV */}
      <TableCell
        sx={{
          color: "white",
          borderBottom: "none",
          py: 2,
        }}
      >
        <Typography sx={{ color: "#FFFFFF", fontWeight: "500" }}>
          {((market.lltv / 1e18) * 100).toFixed(2)}%
        </Typography>
      </TableCell>

      {/* Total Market Size */}
      <TableCell
        sx={{
          color: "white",
          borderBottom: "none",
          py: 2,
        }}
      >
        <Box>
          <Typography
            sx={{
              color: "#FFFFFF",
              fontSize: "14px",
              fontWeight: "500",
            }}
          >
            {formatUsd(
              (market.state?.supplyAssetsUsd || 0) / market.loanAsset.priceUsd
            ).replace("$", "")}{" "}
            {market.loanAsset?.symbol || ""}
          </Typography>
          <Typography sx={{ color: "#8B8D98", fontSize: "12px" }}>
            {formatUsd(market.state?.supplyAssetsUsd || 0)}
          </Typography>
        </Box>
      </TableCell>

      {/* Total Liquidity */}
      <TableCell
        sx={{
          color: "white",
          borderBottom: "none",
          py: 2,
        }}
      >
        <Box>
          <Typography
            sx={{
              color: "#FFFFFF",
              fontSize: "14px",
              fontWeight: "500",
            }}
          >
            {formatUsd(
              (market.state?.liquidityAssetsUsd || 0) /
                market.loanAsset.priceUsd
            ).replace("$", "")}{" "}
            {market.loanAsset?.symbol || ""}
          </Typography>
          <Typography sx={{ color: "#8B8D98", fontSize: "12px" }}>
            {formatUsd(market.state?.liquidityAssetsUsd || 0)}
          </Typography>
        </Box>
      </TableCell>

      {/* Borrow Rate */}
      <TableCell
        sx={{
          color: "white",
          borderBottom: "none",
          py: 2,
        }}
      >
        <BorrowRateSummary
          nativeApr={market.state?.borrowApy || 0}
          rewards={market.state?.rewards}
        />
      </TableCell>

      {/* Vault Listing */}
      {/* <TableCell
        sx={{
          color: "white",
          borderBottom: "none",
          py: 2,
        }}
      >
        <VaultListingSummary supplyingVaults={market.supplyingVaults} />
      </TableCell> */}

      {/* Favorite Button */}
      {/* <TableCell
        sx={{
          color: "white",
          borderBottom: "none",
          py: 2,
        }}
      >
        <Button
          onClick={(e) => onToggleFavorite(market.uniqueKey, e)}
          sx={{ minWidth: "auto", p: 1 }}
        >
          {favorites.has(market.uniqueKey) ? (
            <StarIcon sx={{ color: "#F59E0B", fontSize: "20px" }} />
          ) : (
            <StarBorderIcon sx={{ color: "#8B8D98", fontSize: "20px" }} />
          )}
        </Button>
      </TableCell> */}
    </TableRow>
  );
};

export default MarketRow;
