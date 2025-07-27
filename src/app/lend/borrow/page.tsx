import BorrowSummary from "@/components/lend-morpho/borrow/BorrowSummary";
import MarketsTable from "@/components/lend-morpho/borrow/marketTable/MarketsTable";
import { Box, Container } from "@mui/material";
import React from "react";

const page = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ minHeight: "100vh" }}>
        <BorrowSummary />
        <MarketsTable />
      </Box>
    </Container>
  );
};

export default page;
