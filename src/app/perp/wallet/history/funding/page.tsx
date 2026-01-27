"use client";

import React, { useState } from "react";
import { Box, Typography } from "@mui/material";
import { useAccount } from "wagmi";
import { useKatanaPerpsFundingPayments } from "@/hooks/perp/useKatanaPerpsFundingPayments";
import { FundingHistoryHeader } from "@/components/perp/wallet/FundingHistoryHeader";
import { FundingHistoryTable } from "@/components/perp/wallet/FundingHistoryTable";

export default function FundingHistoryPage() {
  const { isConnected } = useAccount();
  const [selectedMarket, setSelectedMarket] = useState<string>("");

  // Fetch funding payments with optional market filter
  const {
    data: fundingPayments,
    isLoading,
    isError,
    error,
  } = useKatanaPerpsFundingPayments({
    market: selectedMarket || undefined,
    limit: 100,
  });

  // Show connect wallet message if not connected
  if (!isConnected) {
    return (
      <Box>
        <FundingHistoryHeader
          selectedMarket={selectedMarket}
          onMarketChange={setSelectedMarket}
          fundingPayments={[]}
        />
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            py: 8,
          }}
        >
          <Typography sx={{ color: "rgba(255, 255, 255, 0.5)", fontSize: "0.875rem" }}>
            Connect your wallet to view funding history
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header with title, filters, and action buttons */}
      <FundingHistoryHeader
        selectedMarket={selectedMarket}
        onMarketChange={setSelectedMarket}
        fundingPayments={fundingPayments || []}
      />

      {/* Funding history table */}
      <FundingHistoryTable
        fundingPayments={fundingPayments || []}
        isLoading={isLoading}
        isError={isError}
        error={error as Error | null}
      />
    </Box>
  );
}
