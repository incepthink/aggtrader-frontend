"use client";

import React from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  Skeleton,
  Divider,
} from "@mui/material";
import { useAccount } from "wagmi";
import { useUserVaultPosition } from "@/hooks/lend-morpho/useUserVaultPosition";
import { VaultDetail } from "@/hooks/lend-morpho/ValutDescriptionHooks";

interface YourPositionTabProps {
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
const formatCurrency = (amount: number): string => {
  if (amount === 0) return "0.00";
  if (amount < 0.01) return "<0.01";
  return formatNumber(amount);
};

// Helper function to convert shares/assets to number
const convertToNumber = (value: string | number): number => {
  if (typeof value === "number") return value;
  return parseFloat(value) || 0;
};

const YourPositionTab: React.FC<YourPositionTabProps> = ({ vault }) => {
  const { address, isConnected } = useAccount();
  const {
    data: userPosition,
    isLoading,
    error,
  } = useUserVaultPosition(vault.address); // Ethereum mainnet

  // Calculate projected earnings based on position and APY
  const calculateProjectedEarnings = (positionUsd: number, apy: number) => {
    const monthlyEarnings = (positionUsd * apy) / 12;
    const yearlyEarnings = positionUsd * apy;
    return { monthlyEarnings, yearlyEarnings };
  };

  // Loading state
  if (isLoading && isConnected) {
    return (
      <Box>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ color: "white", mb: 1 }}>
            My Deposit
          </Typography>
          <Skeleton
            variant="text"
            width={120}
            height={48}
            sx={{ bgcolor: "rgba(55, 65, 81, 0.3)" }}
          />
        </Box>

        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
          <Paper sx={{ p: 2, backgroundColor: "rgba(55, 65, 81, 0.2)" }}>
            <Skeleton
              variant="text"
              width="100%"
              height={24}
              sx={{ bgcolor: "rgba(55, 65, 81, 0.3)", mb: 1 }}
            />
            <Skeleton
              variant="text"
              width="60%"
              height={32}
              sx={{ bgcolor: "rgba(55, 65, 81, 0.3)" }}
            />
          </Paper>
          <Paper sx={{ p: 2, backgroundColor: "rgba(55, 65, 81, 0.2)" }}>
            <Skeleton
              variant="text"
              width="100%"
              height={24}
              sx={{ bgcolor: "rgba(55, 65, 81, 0.3)", mb: 1 }}
            />
            <Skeleton
              variant="text"
              width="60%"
              height={32}
              sx={{ bgcolor: "rgba(55, 65, 81, 0.3)" }}
            />
          </Paper>
        </Box>
      </Box>
    );
  }

  // Not connected state
  if (!isConnected) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          py: 6,
          textAlign: "center",
        }}
      >
        <Typography variant="h6" sx={{ color: "#9CA3AF", mb: 2 }}>
          Connect your wallet to view your position
        </Typography>
        <Typography variant="body2" sx={{ color: "#6B7280", mb: 3 }}>
          See your deposits, earnings, and manage your vault position
        </Typography>
        <Button
          variant="contained"
          sx={{
            backgroundColor: "#06B6D4",
            color: "white",
            textTransform: "none",
            px: 4,
            py: 1,
            "&:hover": {
              backgroundColor: "#0891B2",
            },
          }}
        >
          Connect Wallet
        </Button>
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Box sx={{ textAlign: "center", py: 4 }}>
        <Typography variant="body1" sx={{ color: "#EF4444", mb: 2 }}>
          Failed to load position data
        </Typography>
        <Typography variant="body2" sx={{ color: "#9CA3AF" }}>
          Please try refreshing the page
        </Typography>
      </Box>
    );
  }

  // Get position data or defaults
  const positionUsd = userPosition?.assetsUsd || 0;
  const shares = convertToNumber(userPosition?.shares || 0);
  const assets = convertToNumber(userPosition?.assets || 0);
  const netApy = vault.state.netApy || 0;

  // Calculate token amount (assets normalized by decimals)
  const tokenAmount = assets / Math.pow(10, vault.asset.decimals);

  // Calculate projected earnings
  const { monthlyEarnings, yearlyEarnings } = calculateProjectedEarnings(
    positionUsd,
    netApy
  );

  // No position state
  if (positionUsd === 0) {
    return (
      <Box>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ color: "white", mb: 1 }}>
            My Deposit
          </Typography>
          <Typography variant="h3" sx={{ color: "white", fontWeight: "bold" }}>
            $0.00
          </Typography>
        </Box>

        <Box
          sx={{
            backgroundColor: "rgba(59, 130, 246, 0.1)",
            border: "1px solid rgba(59, 130, 246, 0.3)",
            borderRadius: 2,
            p: 3,
            textAlign: "center",
          }}
        >
          <Typography variant="body1" sx={{ color: "#60A5FA", mb: 1 }}>
            No position in this vault
          </Typography>
          <Typography variant="body2" sx={{ color: "#9CA3AF" }}>
            Deposit {vault.asset.symbol} to start earning{" "}
            {(netApy * 100).toFixed(2)}% APY
          </Typography>
        </Box>
      </Box>
    );
  }

  // Has position state
  return (
    <Box>
      {/* Main Position Display */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ color: "#9CA3AF", mb: 1 }}>
          My Deposit
        </Typography>
        <Typography
          variant="h3"
          sx={{ color: "white", fontWeight: "bold", mb: 1 }}
        >
          ${formatCurrency(positionUsd)}
        </Typography>
        <Typography variant="body2" sx={{ color: "#9CA3AF" }}>
          {formatCurrency(tokenAmount)} {vault.asset.symbol}
        </Typography>
      </Box>

      <Divider sx={{ borderColor: "rgba(55, 65, 81, 0.5)", mb: 3 }} />

      {/* Position Details Grid */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" },
          gap: 2,
          mb: 3,
        }}
      >
        {/* APY */}
        <Paper
          sx={{
            p: 2,
            backgroundColor: "rgba(55, 65, 81, 0.2)",
            borderRadius: 2,
          }}
        >
          <Typography variant="body2" sx={{ color: "#9CA3AF", mb: 1 }}>
            APY
          </Typography>
          <Typography
            variant="h6"
            sx={{
              color: netApy > 0 ? "#10B981" : "#EF4444",
              fontWeight: "bold",
            }}
          >
            {(netApy * 100).toFixed(2)}%
          </Typography>
        </Paper>

        {/* Vault Shares */}
        <Paper
          sx={{
            p: 2,
            backgroundColor: "rgba(55, 65, 81, 0.2)",
            borderRadius: 2,
          }}
        >
          <Typography variant="body2" sx={{ color: "#9CA3AF", mb: 1 }}>
            Vault Shares
          </Typography>
          <Typography variant="h6" sx={{ color: "white", fontWeight: "bold" }}>
            {formatCurrency(shares / Math.pow(10, 18))}{" "}
            {/* Assuming 18 decimals for shares */}
          </Typography>
        </Paper>
      </Box>

      {/* Projected Earnings */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ color: "white", mb: 2 }}>
          Projected Earnings
        </Typography>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" },
            gap: 2,
          }}
        >
          {/* Monthly Earnings */}
          <Paper
            sx={{
              p: 2,
              backgroundColor: "rgba(16, 185, 129, 0.1)",
              border: "1px solid rgba(16, 185, 129, 0.2)",
              borderRadius: 2,
            }}
          >
            <Typography variant="body2" sx={{ color: "#9CA3AF", mb: 1 }}>
              Projected Earnings / Month (USD)
            </Typography>
            <Typography
              variant="h6"
              sx={{ color: "#10B981", fontWeight: "bold" }}
            >
              ${formatCurrency(monthlyEarnings)}
            </Typography>
          </Paper>

          {/* Yearly Earnings */}
          <Paper
            sx={{
              p: 2,
              backgroundColor: "rgba(16, 185, 129, 0.1)",
              border: "1px solid rgba(16, 185, 129, 0.2)",
              borderRadius: 2,
            }}
          >
            <Typography variant="body2" sx={{ color: "#9CA3AF", mb: 1 }}>
              Projected Earnings / Year (USD)
            </Typography>
            <Typography
              variant="h6"
              sx={{ color: "#10B981", fontWeight: "bold" }}
            >
              ${formatCurrency(yearlyEarnings)}
            </Typography>
          </Paper>
        </Box>

        <Typography
          variant="caption"
          sx={{
            color: "#6B7280",
            display: "block",
            mt: 1,
            fontSize: "0.75rem",
          }}
        >
          * Projections are estimates based on current APY and may vary with
          market conditions
        </Typography>
      </Box>
    </Box>
  );
};

export default YourPositionTab;
