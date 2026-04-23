"use client";

import React from "react";
import { Box, Typography, Chip, Skeleton } from "@mui/material";
import GlowBox from "@/components/common/ui/GlowBox";
import { useWeb3 } from "@/lib/yearnfi/lib/contexts/useWeb3";
import { useWallet } from "@/lib/yearnfi/lib/contexts/useWallet";
import { useYearn } from "@/lib/yearnfi/lib/contexts/useYearn";

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

const Divider = () => (
  <Box sx={{ display: { xs: "none", sm: "flex" }, alignSelf: "stretch", alignItems: "center" }}>
    <Box sx={{ width: 2, my: 2, bgcolor: "rgba(0, 245, 224, 0.15)", borderRadius: "4px", alignSelf: "stretch" }} />
  </Box>
);

const LoadingSkeleton = () => (
  <GlowBox sx={{ marginBottom: 2 }} padding={0}>
    <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, alignItems: "stretch" }}>
      {[0, 1, 2].map((i) => (
        <React.Fragment key={i}>
          {i > 0 && <Divider />}
          <Box sx={segmentSx}>
            <Skeleton variant="text" width={90} height={16} sx={{ bgcolor: "rgba(55, 65, 81, 0.4)", mb: 1 }} />
            <Skeleton variant="text" width={140} height={44} sx={{ bgcolor: "rgba(55, 65, 81, 0.4)" }} />
            <Skeleton variant="text" width={70} height={20} sx={{ bgcolor: "rgba(55, 65, 81, 0.3)", mt: 0.5 }} />
          </Box>
        </React.Fragment>
      ))}
    </Box>
  </GlowBox>
);

export function PortfolioCard() {
  const { isActive } = useWeb3();
  const { cumulatedValueInV3Vaults, isLoading, balances } = useWallet();
  const { assetVaults } = useYearn();

  if (isLoading && isActive) return <LoadingSkeleton />;

  const totalDeposited = cumulatedValueInV3Vaults || 0;
  const hasPositions = isActive && totalDeposited > 0;

  const activeVaultCount = isActive
    ? assetVaults.filter((vault) => {
        const bal = balances?.[vault.chainID]?.[vault.address]?.balance?.normalized;
        return typeof bal === "number" && bal > 0;
      }).length
    : 0;

  const availableVaultCount = assetVaults.length;

  return (
    <GlowBox sx={{ marginBottom: 2 }} padding={0}>
      <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, alignItems: "stretch" }}>
        {/* Segment 1: Portfolio Value */}
        <Box sx={segmentSx}>
          <Typography sx={labelSx}>Your Portfolio</Typography>
          <Typography
            sx={{
              fontWeight: "bold",
              fontSize: { xs: "2rem", sm: "2.5rem" },
              color: "#ffffff",
              lineHeight: 1.1,
            }}
          >
            {isActive ? formatCurrency(totalDeposited) : "—"}
          </Typography>
          <Box sx={{ mt: 1 }}>
            {!isActive ? (
              <Typography sx={{ color: "#8b949e", fontSize: "0.8rem" }}>
                Connect wallet to view
              </Typography>
            ) : (
              <Chip
                size="small"
                label={hasPositions ? "Active" : "No positions"}
                sx={{
                  height: 20,
                  fontSize: "0.7rem",
                  backgroundColor: hasPositions
                    ? "rgba(16, 185, 129, 0.15)"
                    : "rgba(107, 114, 128, 0.15)",
                  color: hasPositions ? "#10B981" : "#6B7280",
                  border: `1px solid ${hasPositions ? "rgba(16, 185, 129, 0.3)" : "rgba(107, 114, 128, 0.3)"}`,
                  "& .MuiChip-label": { px: 1 },
                }}
              />
            )}
          </Box>
        </Box>

        <Divider />

        {/* Segment 2: Active Vaults */}
        <Box sx={segmentSx}>
          <Typography sx={labelSx}>Active Vaults</Typography>
          <Typography
            sx={{
              fontWeight: "bold",
              fontSize: { xs: "1.75rem", sm: "2rem" },
              color: activeVaultCount > 0 ? "#ffffff" : "#8b949e",
              lineHeight: 1.1,
            }}
          >
            {isActive ? activeVaultCount : "—"}
          </Typography>
          <Typography sx={{ color: "#8b949e", fontSize: "0.75rem", mt: 0.5 }}>
            {isActive
              ? activeVaultCount > 0
                ? `vault${activeVaultCount !== 1 ? "s" : ""}`
                : "No vaults yet"
              : ""}
          </Typography>
        </Box>

        <Divider />

        {/* Segment 3: Available Vaults */}
        <Box sx={segmentSx}>
          <Typography sx={labelSx}>Available</Typography>
          <Typography
            sx={{
              fontWeight: "bold",
              fontSize: { xs: "1.75rem", sm: "2rem" },
              color: availableVaultCount > 0 ? "#ffffff" : "#8b949e",
              lineHeight: 1.1,
            }}
          >
            {availableVaultCount || "—"}
          </Typography>
          <Typography sx={{ color: "#8b949e", fontSize: "0.75rem", mt: 0.5 }}>
            {availableVaultCount > 0 ? `total vault${availableVaultCount !== 1 ? "s" : ""}` : ""}
          </Typography>
        </Box>
      </Box>
    </GlowBox>
  );
}
