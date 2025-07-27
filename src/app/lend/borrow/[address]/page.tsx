"use client";

import React from "react";
import { Box, Container } from "@mui/material";
import { useMarketDetail } from "@/hooks/lend-morpho/MarketDetailHooks";
import MarketHeader from "@/components/lend-morpho/borrow/market/MarketHeader";
import MarketStats from "@/components/lend-morpho/borrow/market/MarketStats";
import MarketTabs from "@/components/lend-morpho/borrow/market/MarketTabs";
import { BorrowForm } from "@/components/lend-morpho/borrow/market/BorrowForm/BorrowForm";
import LoadingSkeleton from "@/components/lend-morpho/earn/LoadingSkeleton";
import ErrorDisplay from "@/components/lend-morpho/earn/ErrorDisplay";

interface PageProps {
  params: Promise<{
    address: string;
  }>;
}

export default function MarketDetailPage({ params }: PageProps) {
  const resolvedParams = React.use(params);
  const { address } = resolvedParams;

  const {
    data: market,
    isLoading,
    error,
    isError,
  } = useMarketDetail(address, 1);

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (isError) {
    return <ErrorDisplay error={error?.message} />;
  }

  if (!market) {
    return <ErrorDisplay error="Market not found" />;
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "2fr 1fr" },
          gap: 4,
        }}
      >
        {/* Left Column - Market Info */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <MarketHeader market={market} />
          <MarketStats market={market} />
          <MarketTabs market={market} />
        </Box>

        {/* Right Column - Borrow Form */}
        <BorrowForm market={market} />
      </Box>
    </Container>
  );
}
