"use client";

import React from "react";
import { Box, Typography, LinearProgress, Skeleton } from "@mui/material";
import GlowBox from "@/components/common/ui/GlowBox";
import { useUserVaultPositions } from "@/hooks/lend-morpho/useUserVaultPosition";
import { useAccount } from "wagmi";

// Helper function to format large numbers
const formatNumber = (num: number): string => {
  if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
  return num.toFixed(2);
};

// Helper function to format currency
const formatCurrency = (amount: number): string => {
  if (amount === 0) return "$0.00";
  if (amount < 0.01) return "<$0.01";
  return `$${formatNumber(amount)}`;
};

const DepositSummary = () => {
  const { isConnected } = useAccount();
  const { data: userPositions, isLoading, error } = useUserVaultPositions(); // Ethereum mainnet

  // Show loading state
  if (isLoading && isConnected) {
    return (
      <GlowBox sx={{ marginBottom: 2 }}>
        <Box
          sx={{
            p: { xs: 2, sm: 3 },
            backgroundColor: "transparent",
            color: "white",
            borderRadius: 0,
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              justifyContent: "space-between",
              alignItems: { xs: "flex-start", md: "flex-start" },
              gap: { xs: 3, md: 0 },
            }}
          >
            <Box>
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <Typography variant="body2" sx={{ color: "#9CA3AF", mr: 1 }}>
                  Your deposits
                </Typography>
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    backgroundColor: "#10B981",
                  }}
                />
              </Box>
              <Box sx={{ width: { xs: 140, sm: 180 }, height: { xs: 56, sm: 72 } }}>
                <Skeleton
                  variant="text"
                  width="100%"
                  height="100%"
                  sx={{ bgcolor: "rgba(55, 65, 81, 0.3)" }}
                />
              </Box>
            </Box>

            <Box sx={{ textAlign: { xs: "left", md: "right" }, width: { xs: "100%", md: "auto" } }}>
              <Typography variant="body2" sx={{ color: "#9CA3AF", mb: 1 }}>
                Net APY
              </Typography>
              <Box sx={{ width: { xs: 60, sm: 80 }, height: { xs: 28, sm: 32 }, mb: 2 }}>
                <Skeleton
                  variant="text"
                  width="100%"
                  height="100%"
                  sx={{ bgcolor: "rgba(55, 65, 81, 0.3)" }}
                />
              </Box>
              <Box sx={{ width: { xs: "100%", sm: "200px" }, maxWidth: "100%" }}>
                <LinearProgress
                  variant="indeterminate"
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: "rgba(55, 65, 81, 0.6)",
                    "& .MuiLinearProgress-bar": {
                      backgroundColor: "#06B6D4",
                    },
                  }}
                />
              </Box>
            </Box>
          </Box>
        </Box>
      </GlowBox>
    );
  }

  // Get data or use defaults
  const totalDeposits = userPositions?.totalDepositsUsd || 0;
  const netApy = userPositions?.weightedNetApy || 0;
  const positionCount = userPositions?.positionCount || 0;

  // Calculate progress bar value (capped at 100 for display)
  const progressValue = Math.min(netApy * 100, 100);

  return (
    <GlowBox sx={{ marginBottom: 2 }}>
      <Box
        sx={{
          p: { xs: 2, sm: 3 },
          backgroundColor: "transparent",
          color: "white",
          borderRadius: 0,
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            justifyContent: "space-between",
            alignItems: { xs: "flex-start", md: "center" },
            gap: { xs: 3, md: 0 },
          }}
        >
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", mb: 1, flexWrap: "wrap", gap: 0.5 }}>
              <Typography variant="body2" sx={{ color: "#9CA3AF", mr: 1 }}>
                Your deposits
              </Typography>
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  backgroundColor:
                    isConnected && totalDeposits > 0 ? "#10B981" : "#6B7280",
                }}
              />
              {positionCount > 0 && (
                <Typography
                  variant="caption"
                  sx={{
                    color: "#9CA3AF",
                    ml: 1,
                    fontSize: { xs: "0.7rem", sm: "0.75rem" },
                  }}
                >
                  {positionCount} vault{positionCount !== 1 ? "s" : ""}
                </Typography>
              )}
            </Box>

            <Typography
              variant="h3"
              sx={{
                fontWeight: "bold",
                fontSize: { xs: "2rem", sm: "2.5rem", md: "3rem" },
                color: "#ffffff",
              }}
            >
              {formatCurrency(totalDeposits)}
            </Typography>

            {/* Show connection prompt if not connected */}
            {!isConnected && (
              <Typography
                variant="caption"
                sx={{
                  color: "#9CA3AF",
                  fontSize: "0.8rem",
                  mt: 1,
                  display: "block",
                }}
              >
                Connect wallet to view your positions
              </Typography>
            )}

            {/* Show error if any */}
            {error && isConnected && (
              <Typography
                variant="caption"
                sx={{
                  color: "#EF4444",
                  fontSize: "0.8rem",
                  mt: 1,
                  display: "block",
                }}
              >
                Failed to load positions
              </Typography>
            )}
          </Box>

          <Box sx={{ textAlign: { xs: "left", md: "right" }, width: { xs: "100%", md: "auto" } }}>
            <Typography variant="body2" sx={{ color: "#9CA3AF", mb: 0.5 }}>
              Net APY
            </Typography>
            <Typography
              variant="h6"
              sx={{
                fontWeight: "bold",
                fontSize: { xs: "1.25rem", sm: "1.5rem" },
                color: netApy > 0 ? "#10B981" : "#ffffff",
              }}
            >
              {netApy > 0 ? `${(netApy * 100).toFixed(2)}%` : "0%"}
            </Typography>

            <Box sx={{ width: { xs: "100%", sm: "200px" }, maxWidth: "100%", mt: 1 }}>
              <LinearProgress
                variant="determinate"
                value={progressValue}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: "rgba(55, 65, 81, 0.6)",
                  "& .MuiLinearProgress-bar": {
                    backgroundColor: netApy > 0 ? "#10B981" : "#06B6D4",
                  },
                }}
              />
              {netApy > 0 && (
                <Typography
                  sx={{
                    color: "#9CA3AF",
                    fontSize: { xs: "0.7rem", sm: "0.75rem" },
                    mt: 2,
                    display: "block",
                  }}
                >
                  Weighted average across {positionCount} position
                  {positionCount !== 1 ? "s" : ""}
                </Typography>
              )}
            </Box>
          </Box>
        </Box>
      </Box>
    </GlowBox>
  );
};

export default DepositSummary;
