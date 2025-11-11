"use client";

import React from "react";
import { Box, Typography, useTheme, useMediaQuery } from "@mui/material";
import type { TYDaemonVault } from "@/lib/yearnfi/lib/utils/schemas/yDaemonVaultsSchemas";
import { formatAmount } from "@/lib/yearnfi/lib/utils";
import Link from "next/link";
import { CustomAPYDisplay } from "./CustomAPYDisplay";

export type VaultYieldEntry = {
  "Extrinsic Yield"?: string;
  "T-Bill Yield"?: string;
  "Katana APY": string;
  "Base Rewards APR": string;
  "App Rewards APR": string;
  Total: string;
};

type VaultYieldData = {
  [address: string]: VaultYieldEntry;
};

const vaultYieldData: VaultYieldData = {
  "0x80c34BD3A3569E126e7055831036aa7b212cB159": {
    "Extrinsic Yield": "2.10%",
    "Katana APY": "3.08%",
    "Base Rewards APR": "35.00%",
    "App Rewards APR": "1.24%",
    Total: "41.42%",
  },
  "0xE007CA01894c863d7898045ed5A3B4Abf0b18f37": {
    "Extrinsic Yield": "1.30%",
    "Katana APY": "2.70%",
    "Base Rewards APR": "14.00%",
    "App Rewards APR": "0.51%",
    Total: "18.51%",
  },
  "0x9A6bd7B6Fd5C4F87eb66356441502fc7dCdd185B": {
    "Extrinsic Yield": "1.70%",
    "Katana APY": "3.04%",
    "Base Rewards APR": "35.00%",
    "App Rewards APR": "2.35%",
    Total: "42.09%",
  },
  "0x93Fec6639717b6215A48E5a72a162C50DCC40d68": {
    "T-Bill Yield": "3.50%",
    "Katana APY": "2.31%",
    "Base Rewards APR": "35.00%",
    "App Rewards APR": "1.71%",
    Total: "42.52%",
  },
  "0xAa0362eCC584B985056E47812931270b99C91f9d": {
    "Extrinsic Yield": "0.01%",
    "Katana APY": "0.80%",
    "Base Rewards APR": "7.00%",
    "App Rewards APR": "0.91%",
    Total: "8.72%",
  },
  "0x8Fb1c10Ad4417EcA341a1D903Ff437d25ff87a4e": {
    "Extrinsic Yield": "0.00%",
    "Katana APY": "0.00%",
    "Base Rewards APR": "0.00%",
    "App Rewards APR": "0.00%",
    Total: "0.00%",
  },
  "0x1769111aA8EA46fee3BA23EF9B57F3CBe1873408": {
    "Extrinsic Yield": "0.00%",
    "Katana APY": "0.00%",
    "Base Rewards APR": "0.00%",
    "App Rewards APR": "1.99%",
    Total: "1.99%",
  },
};

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
  let requiresCustomAPY = false;

  if (vaultYieldData[currentVault.address] !== undefined) {
    requiresCustomAPY = true;
  }

  // Mobile Card View
  if (isMobile) {
    return (
      <Link
        href={`/earn/vault/${currentVault.chainID}/${currentVault.address}`}
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
                {currentVault.apr?.netAPR
                  ? `${(currentVault.apr?.netAPR * 100).toFixed(2)}%`
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
      href={`/earn/vault/${currentVault.chainID}/${currentVault.address}`}
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
          {requiresCustomAPY ? (
            <CustomAPYDisplay
              vaultYieldEntry={vaultYieldData[currentVault.address]}
            />
          ) : (
            <Typography sx={{ fontSize: "0.875rem", color: "white" }}>
              {currentVault.apr?.netAPR
                ? `$${(currentVault.apr?.netAPR * 100).toFixed(2)}%`
                : "-"}
            </Typography>
          )}
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
