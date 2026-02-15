"use client";

import React, { useState } from "react";
import { Box, Tooltip, IconButton, CircularProgress } from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import CloseIcon from "@mui/icons-material/Close";
import {
  WalletTable,
  WalletTableColumn,
  WalletTableRow,
  WalletTableCell,
} from "./WalletTable";
import {
  KatanaPerpsPosition,
  calculateUnrealizedPnLPercentage,
  isLongPosition,
  formatPositionQuantity,
} from "@/hooks/perp/useKatanaPerpsPositions";

interface PositionsWalletTableProps {
  positions: KatanaPerpsPosition[];
  isLoading: boolean;
  error: Error | null;
  onClosePosition: (position: KatanaPerpsPosition) => void;
  closingMarket: string | null;
}

const columns: WalletTableColumn[] = [
  { key: "market", label: "Market", width: "140px" },
  { key: "quantity", label: "Quantity", width: "120px" },
  { key: "value", label: "Value", width: "120px" },
  { key: "entryPrice", label: "Entry Price", width: "120px" },
  { key: "indexPrice", label: "Index Price", width: "120px" },
  { key: "liquidationPrice", label: "Liquidation Price", width: "140px" },
  { key: "positionMargin", label: "Position Margin", width: "140px" },
  { key: "unrealizedPnL", label: "Unrealized P&L (%)", width: "160px" },
  { key: "realizedPnL", label: "Realized P&L", width: "130px" },
  { key: "tpsl", label: "TP/SL", width: "80px" },
  { key: "adl", label: "ADL", width: "80px" },
  { key: "actions", label: "", width: "60px", align: "center" },
];

export function PositionsWalletTable({
  positions,
  isLoading,
  error,
  onClosePosition,
  closingMarket,
}: PositionsWalletTableProps) {
  return (
    <WalletTable
      columns={columns}
      data={positions}
      isLoading={isLoading}
      isError={!!error}
      error={error}
      emptyTitle="No open positions"
      emptyMessage="Your positions will appear here"
      minWidth="1600px"
      renderRow={(position, index) => {
        const isLong = isLongPosition(position);
        const unrealizedPnL = parseFloat(position.unrealizedPnL);
        const unrealizedPnLPercentage = calculateUnrealizedPnLPercentage(position);
        const realizedPnL = parseFloat(position.realizedPnL);
        const positionValue = parseFloat(position.value);
        const entryPrice = parseFloat(position.entryPrice);
        const indexPrice = parseFloat(position.indexPrice);
        const liquidationPrice = parseFloat(position.liquidationPrice);
        const marginRequirement = parseFloat(position.marginRequirement);

        return (
          <WalletTableRow key={`${position.market}-${index}`}>
            {/* Market */}
            <WalletTableCell>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <Box sx={{ fontWeight: 500 }}>{position.market}</Box>
                <Box
                  sx={{
                    color: isLong ? "#00FF88" : "#FF4444",
                    fontSize: "0.625rem",
                    fontWeight: 600,
                  }}
                >
                  {isLong ? "LONG" : "SHORT"}
                </Box>
              </Box>
            </WalletTableCell>

            {/* Quantity */}
            <WalletTableCell>{formatPositionQuantity(position)}</WalletTableCell>

            {/* Value */}
            <WalletTableCell>
              $
              {positionValue.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </WalletTableCell>

            {/* Entry Price */}
            <WalletTableCell>
              $
              {entryPrice.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </WalletTableCell>

            {/* Index Price */}
            <WalletTableCell>
              $
              {indexPrice.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </WalletTableCell>

            {/* Liquidation Price */}
            <WalletTableCell>
              $
              {liquidationPrice.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </WalletTableCell>

            {/* Position Margin */}
            <WalletTableCell>
              $
              {marginRequirement.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </WalletTableCell>

            {/* Unrealized P&L (%) */}
            <WalletTableCell>
              <Box>
                <Box sx={{ color: unrealizedPnL >= 0 ? "#00FF88" : "#FF4444" }}>
                  {unrealizedPnL >= 0 ? "+" : ""}$
                  {unrealizedPnL.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </Box>
                <Box
                  sx={{
                    color: unrealizedPnLPercentage >= 0 ? "#00FF88" : "#FF4444",
                    fontSize: "0.75rem",
                  }}
                >
                  ({unrealizedPnLPercentage >= 0 ? "+" : ""}
                  {unrealizedPnLPercentage.toFixed(2)}%)
                </Box>
              </Box>
            </WalletTableCell>

            {/* Realized P&L */}
            <WalletTableCell>
              <Box sx={{ color: realizedPnL >= 0 ? "#00FF88" : "#FF4444" }}>
                {realizedPnL >= 0 ? "+" : ""}$
                {realizedPnL.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Box>
            </WalletTableCell>

            {/* TP/SL */}
            <WalletTableCell>
              <Box sx={{ color: "rgba(255, 255, 255, 0.5)" }}>-</Box>
            </WalletTableCell>

            {/* ADL */}
            <WalletTableCell>
              <Tooltip
                title={`Auto-Deleveraging risk: ${position.adlQuintile}/5 (${
                  position.adlQuintile >= 4
                    ? "High"
                    : position.adlQuintile >= 2
                      ? "Medium"
                      : "Low"
                } risk)`}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.25 }}>
                  {[1, 2, 3, 4, 5].map((level) => (
                    <Box
                      key={level}
                      sx={{
                        width: 4,
                        height: 12,
                        backgroundColor:
                          level <= position.adlQuintile
                            ? position.adlQuintile >= 4
                              ? "#FF4444"
                              : position.adlQuintile >= 2
                                ? "#FFA500"
                                : "#00FF88"
                            : "rgba(255, 255, 255, 0.1)",
                        borderRadius: "2px",
                      }}
                    />
                  ))}
                </Box>
              </Tooltip>
            </WalletTableCell>

            {/* Close Button */}
            <WalletTableCell align="center">
              <Tooltip
                title={
                  closingMarket === position.market
                    ? "Closing..."
                    : "Close Position"
                }
              >
                <span>
                  <IconButton
                    size="small"
                    onClick={() => onClosePosition(position)}
                    disabled={closingMarket !== null}
                    sx={{
                      color:
                        closingMarket === position.market
                          ? "#00F5E0"
                          : "rgba(255, 255, 255, 0.5)",
                      "&:hover": {
                        color: "#FF4444",
                        bgcolor: "rgba(255, 68, 68, 0.1)",
                      },
                      "&.Mui-disabled": {
                        color: "rgba(255, 255, 255, 0.2)",
                      },
                    }}
                  >
                    {closingMarket === position.market ? (
                      <CircularProgress size={14} sx={{ color: "#00F5E0" }} />
                    ) : (
                      <CloseIcon sx={{ fontSize: 16 }} />
                    )}
                  </IconButton>
                </span>
              </Tooltip>
            </WalletTableCell>
          </WalletTableRow>
        );
      }}
    />
  );
}
