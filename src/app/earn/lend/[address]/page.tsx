"use client";

import React from "react";
import { Box, Container } from "@mui/material";
import { useVaultDetail } from "@/hooks/lend-morpho/ValutDescriptionHooks";
import VaultHeader from "@/components/lend-morpho/earn/vault/VaultHeader";
import VaultStats from "@/components/lend-morpho/earn/vault/VaultStats";
import VaultTabs from "@/components/lend-morpho/earn/vault/VaultTabs";
import { DepositForm } from "@/components/lend-morpho/earn/vault/DepositForm/DepositForm";
import LoadingSkeleton from "@/components/lend-morpho/earn/LoadingSkeleton";
import ErrorDisplay from "@/components/lend-morpho/earn/ErrorDisplay";

interface PageProps {
  params: Promise<{
    address: string;
  }>;
}

export default function VaultDetailPage({ params }: PageProps) {
  const resolvedParams = React.use(params);
  const { address } = resolvedParams;

  const { data: vault, isLoading, error, isError } = useVaultDetail(address);
  console.log("MORPHOVAULT::", vault);

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (isError) {
    return <ErrorDisplay error={error?.message} />;
  }

  if (!vault) {
    return <ErrorDisplay error="Vault not found" />;
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
        {/* Left Column - Vault Info */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <VaultHeader vault={vault} />
          <VaultStats vault={vault} />
          <VaultTabs vault={vault} />
        </Box>

        {/* Right Column - Deposit Form */}
        <DepositForm vault={vault} />
      </Box>
    </Container>
  );
}
