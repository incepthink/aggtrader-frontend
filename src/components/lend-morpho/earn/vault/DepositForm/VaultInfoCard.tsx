"use client";
import React from "react";
import { Box, Typography, Paper } from "@mui/material";
import { formatNumber } from "./formatters";

interface VaultInfoCardProps {
  fee: number;
  sharePriceUsd: number;
  totalAssetsUsd: number;
  weeklyApy: number;
  monthlyApy: number;
}

export const VaultInfoCard: React.FC<VaultInfoCardProps> = ({
  fee,
  sharePriceUsd,
  totalAssetsUsd,
  weeklyApy,
  monthlyApy,
}) => (
  <>
    <Paper sx={{ mt: 3, p: 2, backgroundColor: "#0f1419", borderRadius: 2 }}>
      <Typography variant="caption" sx={{ color: "#8b949e", lineHeight: 1.4 }}>
        By depositing, you agree to the terms and conditions. Your funds will be
        automatically allocated across multiple markets based on the vault's
        strategy. Earnings are automatically reinvested to maximize your
        returns.
      </Typography>
    </Paper>

    <Box sx={{ mt: 2, p: 2, backgroundColor: "#2d3748", borderRadius: 2 }}>
      <Box
        sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, mb: 2 }}
      >
        <Box>
          <Typography
            variant="caption"
            sx={{ color: "#8b949e", display: "block" }}
          >
            7D APY
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: "#4caf50", fontWeight: "bold" }}
          >
            {(weeklyApy * 100).toFixed(2)}%
          </Typography>
        </Box>
        <Box>
          <Typography
            variant="caption"
            sx={{ color: "#8b949e", display: "block" }}
          >
            30D APY
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: "#4caf50", fontWeight: "bold" }}
          >
            {(monthlyApy * 100).toFixed(2)}%
          </Typography>
        </Box>
      </Box>

      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
        <Typography variant="caption" sx={{ color: "#8b949e" }}>
          Performance Fee
        </Typography>
        <Typography variant="caption" sx={{ color: "white" }}>
          {(fee * 100).toFixed(2)}%
        </Typography>
      </Box>

      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
        <Typography variant="caption" sx={{ color: "#8b949e" }}>
          Share Price
        </Typography>
        <Typography variant="caption" sx={{ color: "white" }}>
          ${sharePriceUsd.toFixed(4)}
        </Typography>
      </Box>

      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
        <Typography variant="caption" sx={{ color: "#8b949e" }}>
          Total Deposits
        </Typography>
        <Typography variant="caption" sx={{ color: "white" }}>
          ${formatNumber(totalAssetsUsd)}
        </Typography>
      </Box>
    </Box>
  </>
);
