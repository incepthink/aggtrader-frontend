"use client";

import { useState } from "react";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Collapse,
  IconButton,
  Chip,
  Link as MuiLink,
  TableSortLabel,
} from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import type {
  TYDaemonVault,
  TYDaemonStrategy,
} from "@/lib/yearnfi/lib/utils/schemas/yDaemonVaultsSchemas";
import { formatAmount } from "@/lib/yearnfi/lib/utils";
import { copyToClipboard } from "@/lib/yearnfi/lib/utils/helpers";
import { ImageWithFallback } from "@/components/common/ImageWithFallback";

type StrategiesTabProps = {
  vault: TYDaemonVault;
};

type SortField = "allocation" | "allocationUSD" | "apr";
type SortDirection = "asc" | "desc";

const EXPLORER_URLS: Record<number, string> = {
  1: "https://etherscan.io",
  747474: "https://katanascan.io",
};

function getExplorerUrl(chainID: number, address: string): string {
  const baseUrl = EXPLORER_URLS[chainID] || "https://etherscan.io";
  return `${baseUrl}/address/${address}`;
}

function getRiskLevel(score?: number): { label: string; color: string } {
  if (!score) return { label: "Unknown", color: "default" };
  if (score <= 3) return { label: "Low", color: "success" };
  if (score <= 6) return { label: "Medium", color: "warning" };
  return { label: "High", color: "error" };
}

function StrategyRow({
  strategy,
  vault,
  allocationPercent,
  allocationUSD,
}: {
  strategy: TYDaemonStrategy;
  vault: TYDaemonVault;
  allocationPercent: number;
  allocationUSD: number;
}) {
  const [open, setOpen] = useState(false);
  const risk = getRiskLevel(strategy.riskScore);
  const logoUrl = `https://assets.smold.app/api/token/${vault.chainID}/${strategy.address}/logo-128.png`;

  return (
    <>
      <TableRow
        sx={{
          cursor: "pointer",
          "&:hover": { bgcolor: "action.hover" },
          "& > *": { borderBottom: open ? "none" : undefined },
        }}
        onClick={() => setOpen(!open)}
      >
        <TableCell>
          <IconButton size="small" sx={{ mr: 1 }}>
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <ImageWithFallback
              src={logoUrl}
              alt={strategy.name}
              width={24}
              height={24}
            />
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {strategy.name}
            </Typography>
          </Box>
        </TableCell>
        <TableCell align="right">
          <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
            {formatAmount(allocationPercent, 2, 2)}%
          </Typography>
        </TableCell>
        <TableCell align="right">
          <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
            ${formatAmount(allocationUSD, 0, 0)}
          </Typography>
        </TableCell>
        <TableCell align="right">
          <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
            {strategy.apr
              ? `${formatAmount(strategy.apr * 100, 2, 2)}%`
              : "N/A"}
          </Typography>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={5}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box
              sx={{
                py: 3,
                px: 2,
                bgcolor: "rgba(0, 255, 233, 0.05)",
                borderRadius: 1,
                my: 1,
              }}
            >
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700 }}>
                Strategy Details
              </Typography>

              {/* Strategy Address */}
              <Box
                sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}
              >
                <Typography variant="body2" color="text.secondary">
                  Address:
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ fontFamily: "monospace", fontSize: "0.875rem" }}
                >
                  {strategy.address.slice(0, 10)}...{strategy.address.slice(-8)}
                </Typography>
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    copyToClipboard(strategy.address);
                  }}
                >
                  <ContentCopyIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  component="a"
                  href={getExplorerUrl(vault.chainID, strategy.address)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                >
                  <OpenInNewIcon fontSize="small" />
                </IconButton>
              </Box>

              {/* Description */}
              {strategy.description && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Description:
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    {strategy.description}
                  </Typography>
                </Box>
              )}

              {/* Risk Level */}
              <Box sx={{ mb: 2 }}>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 1 }}
                >
                  Risk Level:
                </Typography>
                <Chip
                  label={risk.label}
                  color={risk.color as any}
                  size="small"
                />
              </Box>

              {/* Current Debt */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Current Debt:
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ fontFamily: "monospace", mt: 0.5 }}
                >
                  {formatAmount(
                    Number(strategy.estimatedTotalAssets) /
                      Math.pow(10, vault.decimals),
                    2,
                    2
                  )}{" "}
                  {vault.token.symbol}
                </Typography>
              </Box>

              {/* Last Report */}
              {strategy.lastReport && (
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Last Harvest:
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    {new Date(strategy.lastReport * 1000).toLocaleString()}
                  </Typography>
                </Box>
              )}
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

export function StrategiesTab({ vault }: StrategiesTabProps) {
  const [sortField, setSortField] = useState<SortField>("allocation");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const strategies = vault.strategies || [];
  const totalTVL = vault.tvl?.tvl || 0;

  // Calculate allocation percentages and USD values
  const strategiesWithAllocation = strategies.map((strategy) => {
    const allocationPercent = strategy.debtRatio / 100; // debtRatio is in basis points
    const allocationUSD = (totalTVL * allocationPercent) / 100;
    return {
      strategy,
      allocationPercent,
      allocationUSD,
    };
  });

  // Sort strategies
  const sortedStrategies = [...strategiesWithAllocation].sort((a, b) => {
    let comparison = 0;
    switch (sortField) {
      case "allocation":
        comparison = a.allocationPercent - b.allocationPercent;
        break;
      case "allocationUSD":
        comparison = a.allocationUSD - b.allocationUSD;
        break;
      case "apr":
        comparison = (a.strategy.apr || 0) - (b.strategy.apr || 0);
        break;
    }
    return sortDirection === "asc" ? comparison : -comparison;
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  if (strategies.length === 0) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          py: 8,
        }}
      >
        <Typography variant="h6" color="text.secondary">
          No strategies found for this vault
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Strategy data may not be available yet
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 3, fontWeight: 700 }}>
        Active Strategies ({strategies.length})
      </Typography>

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell width={50} />
              <TableCell>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  Strategy
                </Typography>
              </TableCell>
              <TableCell align="right">
                <TableSortLabel
                  active={sortField === "allocation"}
                  direction={
                    sortField === "allocation" ? sortDirection : "desc"
                  }
                  onClick={() => handleSort("allocation")}
                >
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    Allocation %
                  </Typography>
                </TableSortLabel>
              </TableCell>
              <TableCell align="right">
                <TableSortLabel
                  active={sortField === "allocationUSD"}
                  direction={
                    sortField === "allocationUSD" ? sortDirection : "desc"
                  }
                  onClick={() => handleSort("allocationUSD")}
                >
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    Allocation $
                  </Typography>
                </TableSortLabel>
              </TableCell>
              <TableCell align="right">
                <TableSortLabel
                  active={sortField === "apr"}
                  direction={sortField === "apr" ? sortDirection : "desc"}
                  onClick={() => handleSort("apr")}
                >
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    Est. APY
                  </Typography>
                </TableSortLabel>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedStrategies.map(
              ({ strategy, allocationPercent, allocationUSD }) => (
                <StrategyRow
                  key={strategy.address}
                  strategy={strategy}
                  vault={vault}
                  allocationPercent={allocationPercent}
                  allocationUSD={allocationUSD}
                />
              )
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
