// src/components/yearnfi/vaults-v3/list/VaultsV3AssetRow.tsx
"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  Box,
  Typography,
  Collapse,
  IconButton,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import type { TYDaemonVault } from "@/lib/yearnfi/lib/utils/schemas/yDaemonVaultsSchemas";
import { formatAmount } from "@/lib/yearnfi/lib/utils";
import { CustomAPYDisplay } from "./CustomAPYDisplay";
import { vaultYieldData } from "./VaultsV3ListRow";

type Props = {
  vault: TYDaemonVault; // single asset vault (vbUSDC, vbUSDT, vbETH, vbWBTC, AUSD)
};

export function VaultsV3AssetRow({ vault }: Props) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [open, setOpen] = useState(false);

  const assetSymbol = vault.token?.symbol ?? vault.name;

  const logoUrl = vault.token?.address
    ? `https://assets.smold.app/api/token/${vault.chainID}/${vault.token.address}/logo-128.png`
    : `https://assets.smold.app/api/token/${vault.chainID}/0x0000000000000000000000000000000000000000/logo-128.png`;

  const requiresCustomAPY = vaultYieldData[vault.address] !== undefined;

  const estApy = useMemo(() => {
    if (requiresCustomAPY) return null;

    if (vault.apr?.netAPR != null)
      return `${(vault.apr.netAPR * 100).toFixed(2)}%`;
    if (vault.apy?.net_apy != null)
      return `${(vault.apy.net_apy * 100).toFixed(2)}%`;

    return "-";
  }, [requiresCustomAPY, vault.apr?.netAPR, vault.apy?.net_apy]);

  const tvlUsd = vault.tvl?.tvl ?? 0;

  // strategies for dropdown (active only)
  const strategies = (vault.strategies ?? []).filter(
    (s: any) => s?.status === "active",
  );

  const stratRows = useMemo(() => {
    return strategies.map((s: any) => {
      const debtRatioBps = s?.details?.debtRatio ?? 0; // 0..10000
      const allocationPct = (debtRatioBps / 10000) * 100;

      return {
        name: s?.name ?? "Strategy",
        allocationPct,
        netApr: s?.netAPR,
      };
    });
  }, [strategies]);

  const href = `/earn/vault/${vault.chainID}/${vault.address}`;

  const toggleOpen = (e: React.MouseEvent) => {
    e.preventDefault(); // prevent Link navigation
    e.stopPropagation(); // prevent bubbling
    setOpen((v) => !v);
  };

  // =========================
  // MOBILE LAYOUT (simple)
  // =========================
  if (isMobile) {
    return (
      <Box
        sx={{
          borderRadius: 1,
          overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.06)",
          backgroundColor: "rgba(0,0,0,0.2)",
          transition: "all 0.2s",
          "&:hover": { borderColor: "rgba(0,245,224,0.35)" },
          mb: 2,
        }}
      >
        <Link href={href} style={{ textDecoration: "none", color: "inherit" }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              p: 2,
              cursor: "pointer",
            }}
          >
            <IconButton
              onClick={toggleOpen}
              size="small"
              sx={{
                color: "rgba(255,255,255,0.7)",
                p: 0.5,
                "&:hover": { color: "#00F5E0" },
              }}
            >
              <KeyboardArrowDownIcon
                sx={{
                  transform: open ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.2s",
                }}
              />
            </IconButton>

            <Box
              sx={{
                width: 28,
                height: 28,
                borderRadius: "999px",
                overflow: "hidden",
              }}
            >
              <img
                src={logoUrl}
                className="w-full h-full object-cover"
                alt=""
              />
            </Box>

            <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
              <Typography
                sx={{ fontSize: "0.95rem", fontWeight: 700, color: "white" }}
              >
                {assetSymbol}
              </Typography>
              <Typography
                sx={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.5)" }}
              >
                Katana • {vault.category}
              </Typography>
            </Box>

            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
              }}
            >
              <Typography
                sx={{ fontSize: "0.85rem", color: "white", fontWeight: 600 }}
              >
                {requiresCustomAPY
                  ? // small display only; CustomAPYDisplay is heavier
                    (vaultYieldData[vault.address]?.Total ?? "-")
                  : estApy}
              </Typography>
              <Typography
                sx={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.6)" }}
              >
                ${formatAmount(tvlUsd, 0, 0)}
              </Typography>
            </Box>
          </Box>
        </Link>

        <Collapse in={open} timeout="auto" unmountOnExit>
          <Box sx={{ px: 2, pb: 2 }}>
            {stratRows.length === 0 ? (
              <Typography
                sx={{ color: "rgba(255,255,255,0.6)", fontSize: "0.85rem" }}
              >
                No active strategies
              </Typography>
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {stratRows.map((s, idx) => (
                  <Box
                    key={`${vault.address}-strat-${idx}`}
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      p: 1.25,
                      borderRadius: 1,
                      backgroundColor: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.05)",
                    }}
                  >
                    <Box sx={{ display: "flex", flexDirection: "column" }}>
                      <Typography
                        sx={{
                          color: "white",
                          fontSize: "0.9rem",
                          fontWeight: 600,
                        }}
                      >
                        {s.name}
                      </Typography>
                      <Typography
                        sx={{
                          color: "rgba(255,255,255,0.55)",
                          fontSize: "0.75rem",
                        }}
                      >
                        Allocation: {s.allocationPct.toFixed(2)}%
                      </Typography>
                    </Box>

                    <Typography sx={{ color: "white", fontSize: "0.85rem" }}>
                      {typeof s.netApr === "number"
                        ? `${(s.netApr * 100).toFixed(2)}%`
                        : "-"}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        </Collapse>
      </Box>
    );
  }

  // =========================
  // DESKTOP TABLE ROW LAYOUT
  // Columns must match your header:
  // VAULT | EST. APY | HIST. APY | RISK LEVEL | HOLDINGS | DEPOSITS
  // HIST. APY must be "-" always
  // DEPOSITS must show tvlUsd
  // =========================
  return (
    <Box
      sx={{
        borderRadius: 1,
        overflow: "hidden",
        border: "1px solid rgba(255,255,255,0.06)",
        backgroundColor: "rgba(0,0,0,0.2)",
        transition: "all 0.2s",
        "&:hover": { borderColor: "rgba(0,245,224,0.35)" },
      }}
    >
      {/* Row navigates by default */}
      <Link href={href} style={{ textDecoration: "none", color: "inherit" }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { md: "repeat(16, 1fr)" },
            gap: 2,
            p: 2,
            alignItems: "center",
            cursor: "pointer",
          }}
        >
          {/* ✅ dropdown icon on left */}
          <Box
            className="col-span-1"
            sx={{ display: "flex", alignItems: "center" }}
          >
            <IconButton
              onClick={toggleOpen}
              size="small"
              sx={{
                color: "rgba(255,255,255,0.7)",
                p: 0.5,
                "&:hover": { color: "#00F5E0" },
              }}
            >
              <KeyboardArrowDownIcon
                sx={{
                  transform: open ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.2s",
                }}
              />
            </IconButton>
          </Box>

          {/* ✅ VAULT */}
          <Box
            className="col-span-3"
            sx={{ display: "flex", alignItems: "center", gap: 2 }}
          >
            <Box
              sx={{
                width: 28,
                height: 28,
                borderRadius: "999px",
                overflow: "hidden",
              }}
            >
              <img
                src={logoUrl}
                className="w-full h-full object-cover"
                alt=""
              />
            </Box>

            <Box sx={{ display: "flex", flexDirection: "column" }}>
              <Typography
                sx={{ fontSize: "0.95rem", fontWeight: 700, color: "white" }}
              >
                {assetSymbol}
              </Typography>
              <Typography
                sx={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.5)" }}
              >
                Katana • {vault.category}
              </Typography>
            </Box>
          </Box>

          {/* ✅ EST. APY */}
          <Box
            className="col-span-2"
            sx={{ display: "flex", alignItems: "center" }}
          >
            {requiresCustomAPY ? (
              <CustomAPYDisplay
                vaultYieldEntry={vaultYieldData[vault.address]}
              />
            ) : (
              <Typography sx={{ fontSize: "0.875rem", color: "white" }}>
                {estApy}
              </Typography>
            )}
          </Box>

          {/* ✅ HIST. APY always "-" */}
          <Box
            className="col-span-2"
            sx={{ display: "flex", alignItems: "center" }}
          >
            <Typography sx={{ fontSize: "0.875rem", color: "white" }}>
              -
            </Typography>
          </Box>

          {/* ✅ RISK LEVEL visible */}
          <Box
            className="col-span-2"
            sx={{ display: "flex", alignItems: "center" }}
          >
            <Typography sx={{ fontSize: "0.875rem", color: "white" }}>
              Medium
            </Typography>
          </Box>

          {/* ✅ HOLDINGS visible */}
          <Box
            className="col-span-2"
            sx={{ display: "flex", alignItems: "center" }}
          >
            <Typography sx={{ fontSize: "0.875rem", color: "white" }}>
              $0.00
            </Typography>
          </Box>

          {/* ✅ DEPOSITS shows TVL; right aligned */}
          <Box
            className="col-span-2"
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
            }}
          >
            <Typography sx={{ fontSize: "0.875rem", color: "white" }}>
              ${formatAmount(tvlUsd, 0, 0)}
            </Typography>
          </Box>
        </Box>
      </Link>

      {/* Dropdown content (strategies) */}
      <Collapse in={open} timeout="auto" unmountOnExit>
        <Box sx={{ px: 2, pb: 2 }}>
          {stratRows.length === 0 ? (
            <Typography
              sx={{ color: "rgba(255,255,255,0.6)", fontSize: "0.85rem" }}
            >
              No active strategies
            </Typography>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {stratRows.map((s, idx) => (
                <Box
                  key={`${vault.address}-strat-${idx}`}
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    p: 1.25,
                    borderRadius: 1,
                    backgroundColor: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  <Box sx={{ display: "flex", flexDirection: "column" }}>
                    <Typography
                      sx={{
                        color: "white",
                        fontSize: "0.9rem",
                        fontWeight: 600,
                      }}
                    >
                      {s.name}
                    </Typography>
                    <Typography
                      sx={{
                        color: "rgba(255,255,255,0.55)",
                        fontSize: "0.75rem",
                      }}
                    >
                      Allocation: {s.allocationPct.toFixed(2)}%
                    </Typography>
                  </Box>

                  <Typography sx={{ color: "white", fontSize: "0.85rem" }}>
                    {typeof s.netApr === "number"
                      ? `${(s.netApr * 100).toFixed(2)}%`
                      : "-"}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      </Collapse>
    </Box>
  );
}
