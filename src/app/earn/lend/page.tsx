"use client"

import DepositSummary from "@/components/lend-morpho/earn/DepositSummary";
import VaultsTable from "@/components/lend-morpho/earn/vaultTable/VaultTable";
import { Box, Container } from "@mui/material";
import React from "react";

const page = () => {
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ minHeight: "100vh" }}>
        <DepositSummary />
        <VaultsTable />
      </Box>
    </Container>
  );
};

export default page;
