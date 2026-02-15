"use client";

import React from "react";
import { Box } from "@mui/material";
import {
  KatanaPerpsFill,
  formatFillForDisplay,
} from "@/hooks/perp/useKatanaPerpsFills";
import {
  WalletTable,
  WalletTableRow,
  WalletTableCell,
  WalletTableColumn,
} from "./WalletTable";

interface TradeHistoryTableProps {
  fills: KatanaPerpsFill[];
  isLoading: boolean;
  isError: boolean;
  error?: Error | null;
}

const columns: WalletTableColumn[] = [
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
  return (
    <WalletTable
      columns={columns}
      data={fills}
      isLoading={isLoading}
      isError={isError}
      error={error}
      emptyTitle="No trade history"
      emptyMessage="Your trade history will appear here"
      renderRow={(fill) => {
        const formatted = formatFillForDisplay(fill);
        return (
          <TradeHistoryRow
            key={fill.fillId}
            fill={fill}
            formatted={formatted}
          />
        );
      }}
    />
  );
};

interface TradeHistoryRowProps {
  fill: KatanaPerpsFill;
  formatted: ReturnType<typeof formatFillForDisplay>;
}

const TradeHistoryRow: React.FC<TradeHistoryRowProps> = ({
  fill,
  formatted,
}) => {
  const isBuy = fill.side === "buy";
  const sideColor = isBuy ? "#00FF88" : "#FF4444";
  const pnlColor = formatted.realizedPnL >= 0 ? "#00FF88" : "#FF4444";

  return (
    <WalletTableRow>
      {/* Date */}
      <WalletTableCell>{formatted.date}</WalletTableCell>

      {/* Market */}
      <WalletTableCell>
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
      </WalletTableCell>

      {/* Side */}
      <WalletTableCell style={{ color: sideColor, fontWeight: 500 }}>
        {isBuy ? "Buy" : "Sell"}
      </WalletTableCell>

      {/* Price */}
      <WalletTableCell style={{ fontFamily: "monospace" }}>
        {formatted.price}
      </WalletTableCell>

      {/* Quantity */}
      <WalletTableCell style={{ fontFamily: "monospace" }}>
        {formatted.quantity}
      </WalletTableCell>

      {/* Value */}
      <WalletTableCell>{formatted.value}</WalletTableCell>

      {/* Trade Fee */}
      <WalletTableCell>{formatted.fee}</WalletTableCell>

      {/* Type */}
      <WalletTableCell>{formatted.type}</WalletTableCell>

      {/* Liquidity */}
      <WalletTableCell>{formatted.liquidity}</WalletTableCell>

      {/* Realized P&L */}
      <WalletTableCell style={{ color: pnlColor, fontWeight: 500 }}>
        {formatted.realizedPnLFormatted}
      </WalletTableCell>

      {/* Status */}
      <WalletTableCell>
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
      </WalletTableCell>
    </WalletTableRow>
  );
};

export default TradeHistoryTable;
