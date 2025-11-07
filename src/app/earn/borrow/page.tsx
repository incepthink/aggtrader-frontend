"use client"

import BorrowSummary from "@/components/lend-morpho/borrow/BorrowSummary";
import MarketsTable from "@/components/lend-morpho/borrow/marketTable/MarketsTable";
import ResponsiveMarketsTable from "@/components/lend-morpho/borrow/marketTable/ResponsiveMarketsTable";
import { Box, Container } from "@mui/material";
import React from "react";

const page = () => {
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ minHeight: "100vh" }}>
        <BorrowSummary />
        <ResponsiveMarketsTable />
      </Box>
    </Container>
  );
};

export default page;
