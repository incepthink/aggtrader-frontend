"use client";

import React from "react";
import { Box, Typography, Paper, Tooltip, IconButton } from "@mui/material";
import InfoIcon from "@mui/icons-material/Info";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import {
  VaultDetail,
  HistoricalState,
} from "@/hooks/lend-morpho/ValutDescriptionHooks";

interface PerformanceTabProps {
  vault: VaultDetail;
  historicalData?: HistoricalState;
  isHistoricalLoading: boolean;
}

const PerformanceTab: React.FC<PerformanceTabProps> = ({ vault }) => {
  return (
    <Box>
      {/* Instant APY */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
          <Typography variant="body2" sx={{ color: "#8b949e" }}>
            Instant APY
          </Typography>
          <Tooltip title="Current instantaneous APY">
            <IconButton size="small" sx={{ color: "#8b949e" }}>
              <InfoIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography
            variant="h3"
            sx={{
              fontWeight: "bold",
              color: "#4caf50",
            }}
          >
            {vault.state.dailyApy
              ? (vault.state.dailyApy * 100).toFixed(2)
              : "9.13"}
            %
          </Typography>
          <TrendingUpIcon sx={{ color: "#4caf50", fontSize: 24 }} />
        </Box>
      </Box>

      {/* APY Cards */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
          gap: 3,
          mb: 4,
        }}
      >
        <Paper
          sx={{
            p: 3,
            backgroundColor: "rgba(0, 245, 224, 0.1)",
            borderRadius: 2,
          }}
        >
          <Typography variant="body2" sx={{ color: "#8b949e", mb: 2 }}>
            7D APY
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: "bold", color: "white" }}>
            {vault.state.weeklyApy
              ? (vault.state.weeklyApy * 100).toFixed(2)
              : "6.07"}
            %
          </Typography>
        </Paper>

        <Paper
          sx={{
            p: 3,
            backgroundColor: "rgba(0, 245, 224, 0.1)",
            borderRadius: 2,
          }}
        >
          <Typography variant="body2" sx={{ color: "#8b949e", mb: 2 }}>
            30D APY
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: "bold", color: "white" }}>
            {vault.state.monthlyApy
              ? (vault.state.monthlyApy * 100).toFixed(2)
              : "5.06"}
            %
          </Typography>
        </Paper>

        <Paper
          sx={{
            p: 3,
            backgroundColor: "rgba(0, 245, 224, 0.1)",
            borderRadius: 2,
          }}
        >
          <Typography variant="body2" sx={{ color: "#8b949e", mb: 2 }}>
            90D APY
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: "bold", color: "white" }}>
            5.31%
          </Typography>
        </Paper>
      </Box>

      {/* Fee Information */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" },
          gap: 3,
        }}
      >
        <Paper
          sx={{
            p: 3,
            backgroundColor: "rgba(0, 245, 224, 0.1)",
            borderRadius: 2,
          }}
        >
          <Typography variant="body2" sx={{ color: "#8b949e", mb: 2 }}>
            Performance Fee
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: "bold", color: "white" }}>
            {(vault.state.fee * 100).toFixed(2)}%
          </Typography>
        </Paper>

        <Paper
          sx={{
            p: 3,
            backgroundColor: "rgba(0, 245, 224, 0.1)",
            borderRadius: 2,
          }}
        >
          <Typography variant="body2" sx={{ color: "#8b949e", mb: 2 }}>
            Fee Recipient
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography
              variant="body1"
              sx={{ color: "white", fontFamily: "monospace" }}
            >
              {vault.state.curator
                ? `${vault.state.curator.slice(
                    0,
                    6
                  )}...${vault.state.curator.slice(-4)}`
                : "0x255c...085a"}
            </Typography>
            <Box
              sx={{
                width: 16,
                height: 16,
                backgroundColor: "#4caf50",
                borderRadius: "50%",
                cursor: "pointer",
              }}
            />
            <Box
              sx={{
                width: 16,
                height: 16,
                backgroundColor: "#666",
                borderRadius: 1,
                cursor: "pointer",
              }}
            />
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default PerformanceTab;
