"use client";

import React from "react";
import { Box, Typography, CircularProgress } from "@mui/material";
import {
  KatanaPerpsFill,
  formatFillForDisplay,
} from "@/hooks/perp/useKatanaPerpsFills";

interface TradeHistoryTableProps {
  fills: KatanaPerpsFill[];
  isLoading: boolean;
  isError: boolean;
  error?: Error | null;
}

const columns = [
  { key: "date", label: "DATE", width: "140px" },
  { key: "market", label: "MARKET", width: "120px" },
  { key: "side", label: "SIDE", width: "60px" },
  { key: "price", label: "PRICE", width: "90px" },
  { key: "quantity", label: "QUANTITY", width: "120px" },
  { key: "value", label: "VALUE", width: "90px" },
  { key: "fee", label: "TRADE FEE", width: "90px" },
  { key: "type", label: "TYPE", width: "70px" },
  { key: "liquidity", label: "LIQUIDITY", width: "80px" },
  { key: "realizedPnL", label: "REALIZED P&L", width: "110px" },
  { key: "status", label: "STATUS", width: "90px" },
];

export const TradeHistoryTable: React.FC<TradeHistoryTableProps> = ({
  fills,
  isLoading,
  isError,
  error,
}) => {
  if (isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          py: 8,
        }}
      >
        <CircularProgress size={32} sx={{ color: "#00F5E0" }} />
      </Box>
    );
  }

  if (isError) {
    return (
      <Box sx={{ py: 4, px: 2, textAlign: "center" }}>
        <Typography sx={{ color: "#FF4444", fontSize: "0.875rem" }}>
          {error?.message || "Failed to load trade history"}
        </Typography>
      </Box>
    );
  }

  if (!fills || fills.length === 0) {
    return (
      <Box sx={{ py: 8, textAlign: "center" }}>
        <Typography sx={{ color: "rgba(255, 255, 255, 0.5)", fontSize: "0.875rem" }}>
          No trade history found
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ overflowX: "auto" }}>
      <Box
        component="table"
        sx={{
          width: "100%",
          borderCollapse: "collapse",
          minWidth: "1200px",
        }}
      >
        {/* Table Header */}
        <Box component="thead">
          <Box component="tr">
            {columns.map((column) => (
              <Box
                key={column.key}
                component="th"
                sx={{
                  padding: "12px 16px",
                  textAlign: "left",
                  fontSize: "0.7rem",
                  fontWeight: 500,
                  color: "rgba(255, 255, 255, 0.4)",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
                  minWidth: column.width,
                }}
              >
                {column.label}
              </Box>
            ))}
          </Box>
        </Box>

        {/* Table Body */}
        <Box component="tbody">
          {fills.map((fill) => {
            const formatted = formatFillForDisplay(fill);
            return (
              <TradeHistoryRow key={fill.fillId} fill={fill} formatted={formatted} />
            );
          })}
        </Box>
      </Box>
    </Box>
  );
};

interface TradeHistoryRowProps {
  fill: KatanaPerpsFill;
  formatted: ReturnType<typeof formatFillForDisplay>;
}

const TradeHistoryRow: React.FC<TradeHistoryRowProps> = ({ fill, formatted }) => {
  const isBuy = fill.side === "buy";
  const sideColor = isBuy ? "#00FF88" : "#FF4444";
  const pnlColor = formatted.realizedPnL >= 0 ? "#00FF88" : "#FF4444";

  return (
    <Box
      component="tr"
      sx={{
        borderBottom: "1px solid rgba(255, 255, 255, 0.03)",
        "&:hover": {
          backgroundColor: "rgba(255, 255, 255, 0.02)",
        },
      }}
    >
      {/* Date */}
      <Box
        component="td"
        sx={{
          padding: "12px 16px",
          fontSize: "0.875rem",
          color: "#fff",
        }}
      >
        {formatted.date}
      </Box>

      {/* Market */}
      <Box
        component="td"
        sx={{
          padding: "12px 16px",
          fontSize: "0.875rem",
          color: "#fff",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              backgroundColor: "#F7931A", // Bitcoin orange for BTC
            }}
          />
          {fill.market}
        </Box>
      </Box>

      {/* Side */}
      <Box
        component="td"
        sx={{
          padding: "12px 16px",
          fontSize: "0.875rem",
          color: sideColor,
          fontWeight: 500,
        }}
      >
        {isBuy ? "Buy" : "Sell"}
      </Box>

      {/* Price */}
      <Box
        component="td"
        sx={{
          padding: "12px 16px",
          fontSize: "0.875rem",
          color: "#fff",
          fontFamily: "monospace",
        }}
      >
        {formatted.price}
      </Box>

      {/* Quantity */}
      <Box
        component="td"
        sx={{
          padding: "12px 16px",
          fontSize: "0.875rem",
          color: "#fff",
          fontFamily: "monospace",
        }}
      >
        {formatted.quantity}
      </Box>

      {/* Value */}
      <Box
        component="td"
        sx={{
          padding: "12px 16px",
          fontSize: "0.875rem",
          color: "#fff",
        }}
      >
        {formatted.value}
      </Box>

      {/* Trade Fee */}
      <Box
        component="td"
        sx={{
          padding: "12px 16px",
          fontSize: "0.875rem",
          color: "#fff",
        }}
      >
        {formatted.fee}
      </Box>

      {/* Type */}
      <Box
        component="td"
        sx={{
          padding: "12px 16px",
          fontSize: "0.875rem",
          color: "#fff",
        }}
      >
        {formatted.type}
      </Box>

      {/* Liquidity */}
      <Box
        component="td"
        sx={{
          padding: "12px 16px",
          fontSize: "0.875rem",
          color: "#fff",
        }}
      >
        {formatted.liquidity}
      </Box>

      {/* Realized P&L */}
      <Box
        component="td"
        sx={{
          padding: "12px 16px",
          fontSize: "0.875rem",
          color: pnlColor,
          fontWeight: 500,
        }}
      >
        {formatted.realizedPnLFormatted}
      </Box>

      {/* Status */}
      <Box
        component="td"
        sx={{
          padding: "12px 16px",
        }}
      >
        <Box
          sx={{
            display: "inline-flex",
            alignItems: "center",
            px: 1.5,
            py: 0.5,
            borderRadius: "4px",
            backgroundColor:
              fill.txStatus === "mined"
                ? "rgba(0, 255, 136, 0.1)"
                : fill.txStatus === "pending"
                  ? "rgba(255, 193, 7, 0.1)"
                  : "rgba(255, 68, 68, 0.1)",
            color:
              fill.txStatus === "mined"
                ? "#00FF88"
                : fill.txStatus === "pending"
                  ? "#FFC107"
                  : "#FF4444",
            fontSize: "0.75rem",
            fontWeight: 500,
          }}
        >
          {formatted.statusFormatted}
        </Box>
      </Box>
    </Box>
  );
};

export default TradeHistoryTable;
