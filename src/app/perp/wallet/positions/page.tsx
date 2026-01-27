"use client";

import { useEffect } from "react";
import { Box, Typography, Button, Tooltip } from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { usePerpBalanceStore } from "@/store/perpBalanceStore";
import { useKumaBalance } from "@/hooks/perp/useKumaBalance";

const LoadingSpinner = ({ size = "md" }: { size?: "sm" | "md" | "lg" }) => {
  const sizeClasses = {
    sm: "w-4 h-4 border-2",
    md: "w-5 h-5 border-2",
    lg: "w-6 h-6 border-[3px]",
  };
  return (
    <span
      className={`inline-block ${sizeClasses[size]} border-white/30 border-t-white rounded-full animate-spin`}
    />
  );
};

export default function PositionsPage() {
  const accountBalance = usePerpBalanceStore((state) => state.accountBalance);
  const setAccountBalance = usePerpBalanceStore((state) => state.setAccountBalance);
  const { balance: fetchedBalance, isLoading, isAssociated } = useKumaBalance();

  console.log('[PositionsPage] Render:', {
    accountBalance,
    fetchedBalance,
    isLoading,
    isAssociated,
  });

  // Always sync fetched balance to store when it updates
  useEffect(() => {
    console.log('[PositionsPage] Sync effect:', { fetchedBalance });
    if (fetchedBalance) {
      console.log('[PositionsPage] Syncing fetchedBalance to store');
      setAccountBalance(fetchedBalance);
    }
  }, [fetchedBalance, setAccountBalance]);

  // Use fetched balance as fallback if store is empty
  const displayBalance = accountBalance || fetchedBalance;
  const showLoading = isLoading && !displayBalance;
  console.log('[PositionsPage] displayBalance:', displayBalance);

  const formatCurrency = (value: string | number) => {
    const numValue = typeof value === "string" ? parseFloat(value) : value;
    return `$${numValue.toFixed(2)}`;
  };

  const formatPercentage = (value: string | number) => {
    const numValue = typeof value === "string" ? parseFloat(value) : value;
    return `${numValue.toFixed(2)}%`;
  };

  return (
    <Box>
      {/* First Row: Title + Buttons */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          py: 1.5,
          px: 2,
          borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
        }}
      >
        <Typography sx={{ color: "#fff", fontSize: "1.125rem", fontWeight: 500 }}>
          Positions
        </Typography>
        <Box sx={{ display: "flex", gap: 1.5 }}>
          <Button
            disabled
            sx={{
              px: 3,
              py: 0.75,
              background: "transparent",
              border: "1px solid rgba(255, 255, 255, 0.3)",
              color: "#fff",
              fontSize: "0.875rem",
              fontWeight: 500,
              textTransform: "none",
              borderRadius: "4px",
              minWidth: "100px",
              "&.Mui-disabled": {
                color: "rgba(255, 255, 255, 0.5)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
              },
            }}
          >
            Withdraw
          </Button>
          <Button
            disabled
            sx={{
              px: 3,
              py: 0.75,
              background: "transparent",
              border: "1px solid #00F5E0",
              color: "#00F5E0",
              fontSize: "0.875rem",
              fontWeight: 500,
              textTransform: "none",
              borderRadius: "4px",
              minWidth: "100px",
              "&.Mui-disabled": {
                color: "rgba(0, 245, 224, 0.5)",
                border: "1px solid rgba(0, 245, 224, 0.3)",
              },
            }}
          >
            Deposit
          </Button>
        </Box>
      </Box>

      {/* Second Row: Balance Stats */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          py: 2,
          px: 2,
          borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
        }}
      >
        {/* Balance */}
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.5 }}>
            <Typography
              sx={{
                color: "rgba(255, 255, 255, 0.5)",
                fontSize: "0.75rem",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Balance
            </Typography>
            <Tooltip title="Total account equity including all positions and unrealized P&L">
              <InfoOutlinedIcon
                sx={{
                  fontSize: 12,
                  color: "rgba(255, 255, 255, 0.4)",
                  cursor: "help",
                }}
              />
            </Tooltip>
          </Box>
          <Typography
            sx={{
              color: "#fff",
              fontSize: "1.75rem",
              fontWeight: 600,
              lineHeight: 1.2,
            }}
          >
            {showLoading ? <LoadingSpinner size="lg" /> : displayBalance ? formatCurrency(displayBalance.equity) : "$0.00"}
          </Typography>
          <Typography
            sx={{
              color: "rgba(255, 255, 255, 0.4)",
              fontSize: "0.8rem",
              mt: 0.25,
            }}
          >
            $0.00 (0.00%) Last 24H
          </Typography>
        </Box>

        {/* Right side stats */}
        <Box sx={{ display: "flex", gap: 8 }}>
          {/* Free Collateral */}
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.5 }}>
              <Typography
                sx={{
                  color: "rgba(255, 255, 255, 0.5)",
                  fontSize: "0.75rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                Free Collateral
              </Typography>
              <Tooltip title="Collateral available for new positions">
                <InfoOutlinedIcon
                  sx={{
                    fontSize: 12,
                    color: "rgba(255, 255, 255, 0.4)",
                    cursor: "help",
                  }}
                />
              </Tooltip>
            </Box>
            <Typography
              sx={{
                color: "#fff",
                fontSize: "1.25rem",
                fontWeight: 500,
              }}
            >
              {showLoading ? <LoadingSpinner /> : displayBalance
                ? formatCurrency(displayBalance.freeCollateral)
                : "$0.00"}
            </Typography>
          </Box>

          {/* Margin Ratio */}
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.5 }}>
              <Typography
                sx={{
                  color: "rgba(255, 255, 255, 0.5)",
                  fontSize: "0.75rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                Margin Ratio
              </Typography>
              <Tooltip title="Ratio of your equity to total position value">
                <InfoOutlinedIcon
                  sx={{
                    fontSize: 12,
                    color: "rgba(255, 255, 255, 0.4)",
                    cursor: "help",
                  }}
                />
              </Tooltip>
            </Box>
            <Typography
              sx={{
                color: "#fff",
                fontSize: "1.25rem",
                fontWeight: 500,
              }}
            >
              {showLoading ? <LoadingSpinner /> : displayBalance
                ? formatPercentage(displayBalance.marginRatio)
                : "0.00%"}
            </Typography>
          </Box>

          {/* Leverage */}
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.5 }}>
              <Typography
                sx={{
                  color: "rgba(255, 255, 255, 0.5)",
                  fontSize: "0.75rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                Leverage
              </Typography>
              <Tooltip title="Current leverage ratio across all positions">
                <InfoOutlinedIcon
                  sx={{
                    fontSize: 12,
                    color: "rgba(255, 255, 255, 0.4)",
                    cursor: "help",
                  }}
                />
              </Tooltip>
            </Box>
            <Typography
              sx={{
                color: "#fff",
                fontSize: "1.25rem",
                fontWeight: 500,
              }}
            >
              {showLoading ? <LoadingSpinner /> : displayBalance
                ? parseFloat(displayBalance.leverage).toFixed(2)
                : "0.00"}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
