"use client";

import { ConnectWalletPaper } from "@/components/lending/ConnectWalletPaper";
import { DashboardContentWrapper } from "@/components/lending/DashboardContentWrapper";
import { Container } from "@mui/material";
import React from "react";
import { useAccount } from "wagmi";

const page = () => {
  const { isConnected } = useAccount();

  return (
    <Container maxWidth="xl">
      {isConnected ? (
        <DashboardContentWrapper isBorrow={true} />
      ) : (
        <ConnectWalletPaper />
      )}
    </Container>
  );
};

export default page;
