"use client";

import React from "react";
import { Box, Typography, Chip, Skeleton } from "@mui/material";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import GlowBox from "@/components/common/ui/GlowBox";
import { useUserMarketPositions } from "@/hooks/lend-morpho/useUserMarketPosition";
import { useAccount } from "wagmi";

const formatNumber = (num: number): string => {
  if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
  return num.toFixed(2);
};

const formatCurrency = (amount: number): string => {
  if (amount === 0) return "$0.00";
  if (amount < 0.01) return "<$0.01";
  return `$${formatNumber(amount)}`;
};

const segmentSx = {
  flex: 1,
  p: { xs: 2, sm: 3 },
  display: "flex",
  flexDirection: "column" as const,
  justifyContent: "center",
  alignItems: "center",
};

const labelSx = {
  color: "#8b949e",
  fontSize: { xs: "0.75rem", sm: "0.875rem" },
  mb: 1,
  textTransform: "uppercase" as const,
  letterSpacing: "0.05em",
};

const LoadingSkeleton = () => (
  <GlowBox sx={{ marginBottom: 2 }} padding={0}>
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        alignItems: "stretch",
      }}
    >
      {[0, 1, 2].map((i) => (
        <React.Fragment key={i}>
          {i > 0 && (
            <Box sx={{ display: { xs: "none", sm: "flex" }, alignSelf: "stretch", alignItems: "center" }}>
              <Box sx={{ width: 2, my: 2, bgcolor: "rgba(0, 245, 224, 0.15)", borderRadius: "4px", alignSelf: "stretch" }} />
            </Box>
          )}
          <Box sx={segmentSx}>
            <Skeleton
              variant="text"
              width={90}
              height={16}
              sx={{ bgcolor: "rgba(55, 65, 81, 0.4)", mb: 1 }}
            />
            <Skeleton
              variant="text"
              width={140}
              height={44}
              sx={{ bgcolor: "rgba(55, 65, 81, 0.4)" }}
            />
            <Skeleton
              variant="text"
              width={70}
              height={20}
              sx={{ bgcolor: "rgba(55, 65, 81, 0.3)", mt: 0.5 }}
            />
          </Box>
        </React.Fragment>
      ))}
    </Box>
  </GlowBox>
);

const BorrowSummary: React.FC = () => {
  const { isConnected } = useAccount();
  const {
    data: userBorrowPositions,
    isLoading,
    error,
  } = useUserMarketPositions();

  if (isLoading && isConnected) return <LoadingSkeleton />;

  const totalLoans = userBorrowPositions?.totalBorrowedUsd || 0;
  const netRate = userBorrowPositions?.weightedBorrowRate || 0;
  const loanCount = userBorrowPositions?.positionCount || 0;
  const hasLoans = isConnected && totalLoans > 0;

  return (
    <GlowBox sx={{ marginBottom: 2 }} padding={0}>
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          alignItems: "stretch",
        }}
      >
        {/* Segment 1: Main metric */}
        <Box sx={segmentSx}>
          <Typography sx={labelSx}>Your loans</Typography>

          <Typography
            sx={{
              fontWeight: "bold",
              fontSize: { xs: "2rem", sm: "2.5rem" },
              color: "#ffffff",
              lineHeight: 1.1,
            }}
          >
            {isConnected ? formatCurrency(totalLoans) : "—"}
          </Typography>

          <Box sx={{ mt: 1 }}>
            {!isConnected ? (
              <Typography sx={{ color: "#8b949e", fontSize: "0.8rem" }}>
                Connect wallet to view
              </Typography>
            ) : error ? (
              <Typography sx={{ color: "#EF4444", fontSize: "0.8rem" }}>
                Failed to load
              </Typography>
            ) : (
              <Chip
                size="small"
                label={hasLoans ? "Active" : "No loans"}
                sx={{
                  height: 20,
                  fontSize: "0.7rem",
                  backgroundColor: hasLoans
                    ? "rgba(245, 158, 11, 0.15)"
                    : "rgba(107, 114, 128, 0.15)",
                  color: hasLoans ? "#F59E0B" : "#6B7280",
                  border: `1px solid ${hasLoans ? "rgba(245, 158, 11, 0.3)" : "rgba(107, 114, 128, 0.3)"}`,
                  "& .MuiChip-label": { px: 1 },
                }}
              />
            )}
          </Box>
        </Box>

        <Box sx={{ display: { xs: "none", sm: "flex" }, alignSelf: "stretch", alignItems: "center" }}>
          <Box sx={{ width: 2, my: 2, bgcolor: "rgba(0, 245, 224, 0.15)", borderRadius: "4px", alignSelf: "stretch" }} />
        </Box>

        {/* Segment 2: Borrow Rate */}
        <Box sx={segmentSx}>
          <Typography sx={labelSx}>Borrow Rate</Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography
              sx={{
                fontWeight: "bold",
                fontSize: { xs: "1.75rem", sm: "2rem" },
                color: isConnected && netRate > 0 ? "#EF4444" : "#8b949e",
                lineHeight: 1.1,
              }}
            >
              {isConnected && netRate > 0
                ? `${(netRate * 100).toFixed(2)}%`
                : "—"}
            </Typography>
            {isConnected && netRate > 0 && (
              <TrendingDownIcon sx={{ color: "#EF4444", fontSize: 22 }} />
            )}
          </Box>
          {isConnected && loanCount > 0 && (
            <Typography
              sx={{ color: "#8b949e", fontSize: "0.75rem", mt: 0.5 }}
            >
              weighted avg
            </Typography>
          )}
        </Box>

        <Box sx={{ display: { xs: "none", sm: "flex" }, alignSelf: "stretch", alignItems: "center" }}>
          <Box sx={{ width: 2, my: 2, bgcolor: "rgba(0, 245, 224, 0.15)", borderRadius: "4px", alignSelf: "stretch" }} />
        </Box>

        {/* Segment 3: Positions */}
        <Box sx={segmentSx}>
          <Typography sx={labelSx}>Positions</Typography>
          <Typography
            sx={{
              fontWeight: "bold",
              fontSize: { xs: "1.75rem", sm: "2rem" },
              color: loanCount > 0 ? "#ffffff" : "#8b949e",
              lineHeight: 1.1,
            }}
          >
            {isConnected ? loanCount : "—"}
          </Typography>
          <Typography sx={{ color: "#8b949e", fontSize: "0.75rem", mt: 0.5 }}>
            {isConnected
              ? loanCount > 0
                ? `loan${loanCount !== 1 ? "s" : ""}`
                : "No loans yet"
              : ""}
          </Typography>
        </Box>
      </Box>
    </GlowBox>
  );
};

export default BorrowSummary;
