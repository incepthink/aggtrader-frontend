"use client";

import React from "react";
import {
  Box,
  Typography,
  LinearProgress,
  Button,
  Skeleton,
} from "@mui/material";
import GlowBox from "@/components/common/ui/GlowBox";
import { useUserMarketPositions } from "@/hooks/lend-morpho/useUserMarketPosition";
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

const BorrowSummary: React.FC = () => {
  const { isConnected } = useAccount();
  const {
    data: userBorrowPositions,
    isLoading,
    error,
  } = useUserMarketPositions(1); // Ethereum mainnet

  // Show loading state
  if (isLoading && isConnected) {
    return (
      <GlowBox sx={{ marginBottom: 2 }}>
        <Box
          sx={{
            p: 3,
            backgroundColor: "transparent",
            color: "white",
            borderRadius: 0,
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <Box>
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <Typography variant="body2" sx={{ color: "#9CA3AF", mr: 1 }}>
                  Your loans
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
              <Skeleton
                variant="text"
                width={180}
                height={72}
                sx={{ bgcolor: "rgba(55, 65, 81, 0.3)" }}
              />
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
              <Box sx={{ textAlign: "right" }}>
                <Typography variant="body2" sx={{ color: "#9CA3AF", mb: 1 }}>
                  Net Rate
                </Typography>
                <Skeleton
                  variant="text"
                  width={80}
                  height={32}
                  sx={{ bgcolor: "rgba(55, 65, 81, 0.3)", mb: 2 }}
                />
                <Box sx={{ width: 200 }}>
                  <LinearProgress
                    variant="indeterminate"
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: "rgba(55, 65, 81, 0.6)",
                      "& .MuiLinearProgress-bar": {
                        backgroundColor: "#EF4444",
                      },
                    }}
                  />
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>
      </GlowBox>
    );
  }

  // Get data or use defaults
  const totalLoans = userBorrowPositions?.totalBorrowedUsd || 0;
  const netRate = userBorrowPositions?.weightedBorrowRate || 0;
  const loanCount = userBorrowPositions?.positionCount || 0;

  // Calculate progress bar value (capped at 100 for display)
  const progressValue = Math.min(netRate * 100, 100);

  return (
    <GlowBox sx={{ marginBottom: 2 }}>
      <Box
        sx={{
          p: 3,
          backgroundColor: "transparent",
          color: "white",
          borderRadius: 0,
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
              <Typography variant="body2" sx={{ color: "#9CA3AF", mr: 1 }}>
                Your loans
              </Typography>
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  backgroundColor:
                    isConnected && totalLoans > 0 ? "#10B981" : "#6B7280",
                }}
              />
              {loanCount > 0 && (
                <Typography
                  variant="caption"
                  sx={{
                    color: "#9CA3AF",
                    ml: 1,
                    fontSize: "0.75rem",
                  }}
                >
                  {loanCount} loan{loanCount !== 1 ? "s" : ""}
                </Typography>
              )}
            </Box>

            <Typography
              variant="h3"
              sx={{
                fontWeight: "bold",
                fontSize: "3rem",
                color: "#ffffff",
              }}
            >
              {formatCurrency(totalLoans)}
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
                Connect wallet to view your loans
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
                Failed to load loan positions
              </Typography>
            )}
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
            <Box sx={{ textAlign: "right" }}>
              <Typography variant="body2" sx={{ color: "#9CA3AF", mb: 0.5 }}>
                Net Rate
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: "bold",
                  color: netRate > 0 ? "#EF4444" : "#ffffff", // Red for borrowing costs
                }}
              >
                {netRate > 0 ? `${(netRate * 100).toFixed(2)}%` : "0%"}
              </Typography>

              <Box sx={{ width: 200, mt: 1 }}>
                <LinearProgress
                  variant="determinate"
                  value={progressValue}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: "rgba(55, 65, 81, 0.6)",
                    "& .MuiLinearProgress-bar": {
                      backgroundColor: netRate > 0 ? "#EF4444" : "#06B6D4", // Red for loans
                    },
                  }}
                />
                {netRate > 0 && (
                  <Typography
                    sx={{
                      color: "#9CA3AF",
                      fontSize: "0.75rem",
                      mt: 2,
                      display: "block",
                    }}
                  >
                    Weighted average across {loanCount} loan
                    {loanCount !== 1 ? "s" : ""}
                  </Typography>
                )}
              </Box>
            </Box>

            {/* <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <Button
                variant="outlined"
                sx={{
                  color: "#FFFFFF",
                  borderColor: "rgba(156, 163, 175, 0.3)",
                  backgroundColor: "transparent",
                  "&:hover": {
                    borderColor: "#06B6D4",
                    backgroundColor: "rgba(6, 182, 212, 0.1)",
                  },
                  textTransform: "none",
                  fontSize: "14px",
                  px: 2,
                  py: 0.5,
                }}
              >
                APY
              </Button>
              <Button
                variant="outlined"
                sx={{
                  color: "#FFFFFF",
                  borderColor: "rgba(156, 163, 175, 0.3)",
                  backgroundColor: "transparent",
                  "&:hover": {
                    borderColor: "#06B6D4",
                    backgroundColor: "rgba(6, 182, 212, 0.1)",
                  },
                  textTransform: "none",
                  fontSize: "14px",
                  px: 2,
                  py: 0.5,
                }}
              >
                Rewards
              </Button>
            </Box> */}
          </Box>
        </Box>
      </Box>
    </GlowBox>
  );
};

export default BorrowSummary;
