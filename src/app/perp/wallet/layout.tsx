"use client";

import React from "react";
import { Box } from "@mui/material";
import WalletSidebar from "@/components/perp/wallet/WalletSidebar";
import { KumaAuthWrapper } from "@/components/perp/KumaAuthWrapper";

export default function WalletLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <KumaAuthWrapper />
      <Box
        sx={{
          display: "flex",
          minHeight: "calc(100vh - 64px)",
          height: "calc(100vh - 64px)",
          backgroundColor: "transparent",
        }}
      >
        <WalletSidebar />
        <Box
          sx={{
            flex: 1,
          }}
        >
          {children}
        </Box>
      </Box>
    </>
  );
}
