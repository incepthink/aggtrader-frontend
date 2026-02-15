"use client";

import React from "react";
import { Box } from "@mui/material";
import {
  WalletTable,
  WalletTableColumn,
  WalletTableRow,
  WalletTableCell,
} from "./WalletTable";
import {
  KatanaPerpsFundingPayment,
  formatFundingPaymentForDisplay,
} from "@/hooks/perp/useKatanaPerpsFundingPayments";

interface FundingHistoryTableProps {
  fundingPayments: KatanaPerpsFundingPayment[];
  isLoading: boolean;
  isError: boolean;
  error?: Error | null;
}

const columns: WalletTableColumn[] = [
  { key: "date", label: "Date", width: "180px" },
  { key: "market", label: "Market", width: "140px" },
  { key: "fundingRate", label: "Funding Rate", width: "140px" },
  { key: "position", label: "Position", width: "160px" },
  { key: "indexPrice", label: "Index Price", width: "140px" },
  { key: "fundingFee", label: "Funding Fee", width: "160px" },
];

export const FundingHistoryTable: React.FC<FundingHistoryTableProps> = ({
  fundingPayments,
  isLoading,
  isError,
  error,
}) => {
  return (
    <WalletTable
      columns={columns}
      data={fundingPayments}
      isLoading={isLoading}
      isError={isError}
      error={error || null}
      emptyTitle="No funding history"
      emptyMessage="Your funding payments will appear here"
      minWidth="920px"
      renderRow={(payment, index) => {
        const formatted = formatFundingPaymentForDisplay(payment);
        const isPositiveFunding = formatted.fundingFeeRaw >= 0;
        const isPositiveRate = formatted.fundingRateRaw >= 0;
        const fundingFeeColor = isPositiveFunding ? "#00FF88" : "#FF4444";
        const fundingRateColor = isPositiveRate ? "#00FF88" : "#FF4444";

        return (
          <WalletTableRow key={`${payment.market}-${payment.time}-${index}`}>
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
                    backgroundColor: "#F7931A", // Bitcoin orange for default
                  }}
                />
                {formatted.market}
              </Box>
            </WalletTableCell>

            {/* Funding Rate */}
            <WalletTableCell
              style={{
                color: fundingRateColor,
                fontFamily: "monospace",
                fontWeight: 500,
              }}
            >
              {formatted.fundingRate}
            </WalletTableCell>

            {/* Position */}
            <WalletTableCell style={{ fontFamily: "monospace" }}>
              {formatted.position}
            </WalletTableCell>

            {/* Index Price */}
            <WalletTableCell style={{ fontFamily: "monospace" }}>
              {formatted.indexPrice}
            </WalletTableCell>

            {/* Funding Fee */}
            <WalletTableCell
              style={{
                color: fundingFeeColor,
                fontWeight: 500,
                fontFamily: "monospace",
              }}
            >
              {formatted.fundingFee}
            </WalletTableCell>
          </WalletTableRow>
        );
      }}
    />
  );
};

export default FundingHistoryTable;
