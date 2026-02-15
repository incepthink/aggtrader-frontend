"use client";

import React from "react";
import { Box, Chip } from "@mui/material";
import {
  WalletTable,
  WalletTableColumn,
  WalletTableRow,
  WalletTableCell,
} from "./WalletTable";
import {
  DepositWithdrawalTransaction,
  formatTransactionForDisplay,
} from "@/hooks/perp/useKatanaPerpsDepositsWithdrawals";

interface DepositsWithdrawalsTableProps {
  transactions: DepositWithdrawalTransaction[];
  isLoading: boolean;
  error: Error | null;
}

const columns: WalletTableColumn[] = [
  { key: "date", label: "Date", width: "180px" },
  { key: "type", label: "Type", width: "120px" },
  { key: "quantity", label: "Quantity", width: "160px" },
  { key: "chain", label: "Chain", width: "140px" },
  { key: "fee", label: "Fee", width: "140px" },
  { key: "status", label: "Status", width: "140px" },
];

export function DepositsWithdrawalsTable({
  transactions,
  isLoading,
  error,
}: DepositsWithdrawalsTableProps) {
  return (
    <WalletTable
      columns={columns}
      data={transactions}
      isLoading={isLoading}
      isError={!!error}
      error={error}
      emptyTitle="No transactions"
      emptyMessage="Your deposits and withdrawals will appear here"
      minWidth="920px"
      renderRow={(transaction, index) => {
        const formatted = formatTransactionForDisplay(transaction);
        const isDeposit = transaction.type === "Deposit";

        return (
          <WalletTableRow key={`${transaction.id}-${index}`}>
            {/* Date */}
            <WalletTableCell>{formatted.date}</WalletTableCell>

            {/* Type */}
            <WalletTableCell>
              <Chip
                label={transaction.type}
                size="small"
                sx={{
                  backgroundColor: isDeposit
                    ? "rgba(0, 255, 136, 0.1)"
                    : "rgba(255, 68, 68, 0.1)",
                  color: isDeposit ? "#00FF88" : "#FF4444",
                  border: `1px solid ${isDeposit ? "rgba(0, 255, 136, 0.3)" : "rgba(255, 68, 68, 0.3)"}`,
                  fontWeight: 500,
                  fontSize: "0.75rem",
                }}
              />
            </WalletTableCell>

            {/* Quantity */}
            <WalletTableCell style={{ fontFamily: "monospace" }}>
              {formatted.formattedQuantity}
            </WalletTableCell>

            {/* Chain */}
            <WalletTableCell>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    backgroundColor: "#00F5E0",
                  }}
                />
                {transaction.chain}
              </Box>
            </WalletTableCell>

            {/* Fee */}
            <WalletTableCell
              style={{ fontFamily: "monospace", color: "rgba(255, 255, 255, 0.7)" }}
            >
              {formatted.formattedFee}
            </WalletTableCell>

            {/* Status */}
            <WalletTableCell>
              <Chip
                label={transaction.status}
                size="small"
                sx={{
                  backgroundColor:
                    transaction.status === "Completed" || transaction.status === "Success"
                      ? "rgba(0, 255, 136, 0.1)"
                      : transaction.status === "Pending"
                        ? "rgba(255, 165, 0, 0.1)"
                        : "rgba(255, 68, 68, 0.1)",
                  color: formatted.statusColor,
                  border: `1px solid ${
                    transaction.status === "Completed" || transaction.status === "Success"
                      ? "rgba(0, 255, 136, 0.3)"
                      : transaction.status === "Pending"
                        ? "rgba(255, 165, 0, 0.3)"
                        : "rgba(255, 68, 68, 0.3)"
                  }`,
                  fontWeight: 500,
                  fontSize: "0.75rem",
                }}
              />
            </WalletTableCell>
          </WalletTableRow>
        );
      }}
    />
  );
}

export default DepositsWithdrawalsTable;
