"use client";

import React from "react";
import { Box } from "@mui/material";
import WalletSidebar from "@/components/perp/wallet/WalletSidebar";

export default function WalletLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "calc(100vh - 64px)",
        height: "calc(100vh - 64px)",
        backgroundColor: "#050C19",
      }}
    >
      <WalletSidebar />
      <Box
        sx={{
          flex: 1,
          overflow: "auto",
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
