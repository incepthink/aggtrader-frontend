"use client";

import React from "react";
import { Box, Typography, CircularProgress } from "@mui/material";
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

const columns = [
  { key: "date", label: "DATE", width: "180px" },
  { key: "market", label: "MARKET", width: "140px" },
  { key: "fundingRate", label: "FUNDING RATE", width: "140px" },
  { key: "position", label: "POSITION", width: "160px" },
  { key: "indexPrice", label: "INDEX PRICE", width: "140px" },
  { key: "fundingFee", label: "FUNDING FEE", width: "160px" },
];

export const FundingHistoryTable: React.FC<FundingHistoryTableProps> = ({
  fundingPayments,
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
          {error?.message || "Failed to load funding history"}
        </Typography>
      </Box>
    );
  }

  if (!fundingPayments || fundingPayments.length === 0) {
    return (
      <Box sx={{ py: 8, textAlign: "center" }}>
        <Typography sx={{ color: "rgba(255, 255, 255, 0.5)", fontSize: "0.875rem" }}>
          No funding history
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
          minWidth: "920px",
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
          {fundingPayments.map((payment, index) => {
            const formatted = formatFundingPaymentForDisplay(payment);
            return (
              <FundingHistoryRow
                key={`${payment.market}-${payment.time}-${index}`}
                payment={payment}
                formatted={formatted}
              />
            );
          })}
        </Box>
      </Box>
    </Box>
  );
};

interface FundingHistoryRowProps {
  payment: KatanaPerpsFundingPayment;
  formatted: ReturnType<typeof formatFundingPaymentForDisplay>;
}

const FundingHistoryRow: React.FC<FundingHistoryRowProps> = ({ formatted }) => {
  const isPositiveFunding = formatted.fundingFeeRaw >= 0;
  const isPositiveRate = formatted.fundingRateRaw >= 0;
  const fundingFeeColor = isPositiveFunding ? "#00FF88" : "#FF4444";
  const fundingRateColor = isPositiveRate ? "#00FF88" : "#FF4444";

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
              backgroundColor: "#F7931A", // Bitcoin orange for default
            }}
          />
          {formatted.market}
        </Box>
      </Box>

      {/* Funding Rate */}
      <Box
        component="td"
        sx={{
          padding: "12px 16px",
          fontSize: "0.875rem",
          color: fundingRateColor,
          fontFamily: "monospace",
          fontWeight: 500,
        }}
      >
        {formatted.fundingRate}
      </Box>

      {/* Position */}
      <Box
        component="td"
        sx={{
          padding: "12px 16px",
          fontSize: "0.875rem",
          color: "#fff",
          fontFamily: "monospace",
        }}
      >
        {formatted.position}
      </Box>

      {/* Index Price */}
      <Box
        component="td"
        sx={{
          padding: "12px 16px",
          fontSize: "0.875rem",
          color: "#fff",
          fontFamily: "monospace",
        }}
      >
        {formatted.indexPrice}
      </Box>

      {/* Funding Fee */}
      <Box
        component="td"
        sx={{
          padding: "12px 16px",
          fontSize: "0.875rem",
          color: fundingFeeColor,
          fontWeight: 500,
          fontFamily: "monospace",
        }}
      >
        {formatted.fundingFee}
      </Box>
    </Box>
  );
};

export default FundingHistoryTable;
