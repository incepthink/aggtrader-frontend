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

  const { data: market, isLoading, error, isError } = useMarketDetail(address);

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
    <Container maxWidth="xl" sx={{ py: { xs: 2, sm: 3, md: 4 }, px: { xs: 2, sm: 3 } }}>
      {/* Mobile-only: Show in order Header -> Stats -> Form -> Tabs */}
      <Box sx={{ display: { xs: "flex", lg: "none" }, flexDirection: "column", gap: { xs: 2, sm: 3 } }}>
        <MarketHeader market={market} />
        <MarketStats market={market} />
        <BorrowForm market={market} />
        <MarketTabs market={market} />
      </Box>

      {/* Desktop: Original 2-column layout */}
      <Box
        sx={{
          display: { xs: "none", lg: "grid" },
          gridTemplateColumns: "2fr 1fr",
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
