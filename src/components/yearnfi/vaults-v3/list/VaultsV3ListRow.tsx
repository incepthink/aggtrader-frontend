"use client";

import React from "react";
import { Box, Typography, useTheme, useMediaQuery } from "@mui/material";
import type { TYDaemonVault } from "@/lib/yearnfi/lib/utils/schemas/yDaemonVaultsSchemas";
import { formatAmount } from "@/lib/yearnfi/lib/utils";
import Link from "next/link";

type VaultsV3ListRowProps = {
  currentVault: TYDaemonVault;
  isHoldings?: boolean;
};

export function VaultsV3ListRow({
  currentVault,
  isHoldings = false,
}: VaultsV3ListRowProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // Mobile Card View
  if (isMobile) {
    return (
      <Link
        href={`/lend/vault/${currentVault.chainID}/${currentVault.address}`}
        style={{ textDecoration: "none", color: "inherit" }}
      >
        <Box
          sx={{
            p: 2,
            backgroundColor: isHoldings
              ? "rgba(0, 245, 224, 0.05)"
              : "rgba(0, 0, 0, 0.2)",
            borderRadius: 1,
            border: isHoldings
              ? "1px solid rgba(0, 245, 224, 0.2)"
              : "1px solid transparent",
            mb: 2,
            transition: "all 0.2s",
            "&:hover": {
              backgroundColor: "rgba(0, 245, 224, 0.1)",
              borderColor: "#00F5E0",
            },
          }}
        >
          <Typography
            sx={{ fontSize: "1rem", fontWeight: 600, color: "white", mb: 0.5 }}
          >
            {currentVault.name}
          </Typography>
          <Typography
            sx={{
              fontSize: "0.75rem",
              color: "rgba(255, 255, 255, 0.5)",
              mb: 2,
            }}
          >
            {currentVault.symbol}
          </Typography>

          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
            <Box>
              <Typography
                sx={{
                  fontSize: "0.7rem",
                  color: "rgba(255, 255, 255, 0.5)",
                  mb: 0.5,
                }}
              >
                EST. APY
              </Typography>
              <Typography sx={{ fontSize: "0.875rem", color: "white" }}>
                {currentVault.apy?.gross_apr
                  ? `${formatAmount(currentVault.apy.gross_apr * 100, 2, 2)}%`
                  : "-"}
              </Typography>
            </Box>

            <Box>
              <Typography
                sx={{
                  fontSize: "0.7rem",
                  color: "rgba(255, 255, 255, 0.5)",
                  mb: 0.5,
                }}
              >
                HIST. APY
              </Typography>
              <Typography sx={{ fontSize: "0.875rem", color: "white" }}>
                {currentVault.apy?.net_apy
                  ? `${formatAmount(currentVault.apy.net_apy * 100, 2, 2)}%`
                  : "-"}
              </Typography>
            </Box>

            <Box>
              <Typography
                sx={{
                  fontSize: "0.7rem",
                  color: "rgba(255, 255, 255, 0.5)",
                  mb: 0.5,
                }}
              >
                AVAILABLE
              </Typography>
              <Typography sx={{ fontSize: "0.875rem", color: "white" }}>
                ${formatAmount(currentVault.tvl?.tvl || 0, 0, 0)}
              </Typography>
            </Box>

            <Box>
              <Typography
                sx={{
                  fontSize: "0.7rem",
                  color: "rgba(255, 255, 255, 0.5)",
                  mb: 0.5,
                }}
              >
                DEPOSITS
              </Typography>
              <Typography sx={{ fontSize: "0.875rem", color: "white" }}>
                ${formatAmount(currentVault.tvl?.tvl || 0, 0, 0)}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Link>
    );
  }

  // Desktop Table Row
  return (
    <Link
      href={`/lend/vault/${currentVault.chainID}/${currentVault.address}`}
      style={{ textDecoration: "none", color: "inherit" }}
    >
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(12, 1fr)",
            md: "repeat(16, 1fr)",
          },
          gap: 2,
          p: 2,
          backgroundColor: isHoldings
            ? "rgba(0, 245, 224, 0.05)"
            : "rgba(0, 0, 0, 0.2)",
          borderRadius: 1,
          border: isHoldings
            ? "1px solid rgba(0, 245, 224, 0.2)"
            : "1px solid transparent",
          transition: "all 0.2s",
          "&:hover": {
            backgroundColor: "rgba(0, 245, 224, 0.1)",
            borderColor: "#00F5E0",
            cursor: "pointer",
          },
        }}
      >
        {/* Vault Name */}
        <Box
          className="col-span-4"
          sx={{ display: "flex", flexDirection: "column" }}
        >
          <Typography
            sx={{ fontSize: "0.875rem", fontWeight: 600, color: "white" }}
          >
            {currentVault.name}
          </Typography>
          <Typography
            sx={{ fontSize: "0.75rem", color: "rgba(255, 255, 255, 0.5)" }}
          >
            {currentVault.symbol}
          </Typography>
        </Box>

        {/* Est. APY */}
        <Box
          className="col-span-2"
          sx={{ display: "flex", alignItems: "center" }}
        >
          <Typography sx={{ fontSize: "0.875rem", color: "white" }}>
            {currentVault.apy?.gross_apr
              ? `${formatAmount(currentVault.apy.gross_apr * 100, 2, 2)}%`
              : "-"}
          </Typography>
        </Box>

        {/* Hist. APY */}
        <Box
          className="col-span-2"
          sx={{ display: "flex", alignItems: "center" }}
        >
          <Typography sx={{ fontSize: "0.875rem", color: "white" }}>
            {currentVault.apy?.net_apy
              ? `${formatAmount(currentVault.apy.net_apy * 100, 2, 2)}%`
              : "-"}
          </Typography>
        </Box>

        {/* Risk Level */}
        <Box
          className="col-span-2"
          sx={{ display: "flex", alignItems: "center" }}
        >
          <Typography sx={{ fontSize: "0.875rem", color: "white" }}>
            Medium
          </Typography>
        </Box>

        {/* Available */}
        <Box
          className="col-span-2"
          sx={{ display: "flex", alignItems: "center" }}
        >
          <Typography sx={{ fontSize: "0.875rem", color: "white" }}>
            ${formatAmount(currentVault.tvl?.tvl || 0, 0, 0)}
          </Typography>
        </Box>

        {/* Holdings */}
        <Box
          className="col-span-2"
          sx={{ display: "flex", alignItems: "center" }}
        >
          <Typography sx={{ fontSize: "0.875rem", color: "white" }}>
            $0.00
          </Typography>
        </Box>

        {/* Deposits/TVL - Right aligned */}
        <Box
          className="col-span-2"
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
          }}
        >
          <Typography sx={{ fontSize: "0.875rem", color: "white" }}>
            ${formatAmount(currentVault.tvl?.tvl || 0, 0, 0)}
          </Typography>
        </Box>
      </Box>
    </Link>
  );
}
