"use client";

import React, { useState } from "react";
import { Box, Typography } from "@mui/material";
import { useAccount } from "wagmi";
import { useKatanaPerpsFills } from "@/hooks/perp/useKatanaPerpsFills";
import { TradeHistoryHeader } from "@/components/perp/wallet/TradeHistoryHeader";
import { TradeHistoryTable } from "@/components/perp/wallet/TradeHistoryTable";

export default function TradeHistoryPage() {
  const { isConnected } = useAccount();
  const [selectedMarket, setSelectedMarket] = useState<string>("");

  // Fetch fills with optional market filter
  const {
    data: fills,
    isLoading,
    isError,
    error,
  } = useKatanaPerpsFills({
    market: selectedMarket || undefined,
    limit: 100,
  });

  console.log("Fills data:", fills);

  // Show connect wallet message if not connected
  if (!isConnected) {
    return (
      <Box>
        <TradeHistoryHeader
          selectedMarket={selectedMarket}
          onMarketChange={setSelectedMarket}
          fills={[]}
        />
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            py: 8,
          }}
        >
          <Typography
            sx={{ color: "rgba(255, 255, 255, 0.5)", fontSize: "0.875rem" }}
          >
            Connect your wallet to view trade history
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header with title, filters, and action buttons */}
      <TradeHistoryHeader
        selectedMarket={selectedMarket}
        onMarketChange={setSelectedMarket}
        fills={fills || []}
      />

      {/* Trade history table */}
      <TradeHistoryTable
        fills={fills || []}
        isLoading={isLoading}
        isError={isError}
        error={error as Error | null}
      />
    </Box>
  );
}
