"use client";

import { ChainSync } from "@/components/common/ChainSync";
import GlowBox from "@/components/common/ui/GlowBox";
import OneInchCandlestickChart from "@/components/spot/chart/1inch/OneInchCandlestickChart";
import KatanaCandlestickChart from "@/components/spot/chart/katana/KatanaCandlestickChart";
import ChartSpot, { ChartHeader } from "@/components/spot/ChartSpot";
import EthereumPoolCandlestickChart from "@/components/spot/EthereumPoolCandlestickChart";
import OneInchSwap from "@/components/spot/OneInchSwap";
import SushiClassicSwap from "@/components/spot/SushiClassicSwap";
import TokenBalancesCard from "@/components/spot/tokenBalance/TokenBalancesCard";
import TokenSelect from "@/components/spot/TokenSelect";
import { TokenSelectModal } from "@/components/spot/TokenSelectModal";
import { useSpotStore } from "@/store/spotStore";
import { Box, Container, Stack } from "@mui/material";
import React from "react";

const page = () => {
  const { chainId } = useSpotStore();

  return (
    <Container
      maxWidth="xl"
      sx={{
        px: { xs: 1, sm: 2, md: 3 }, // Responsive padding
        py: { xs: 1, sm: 2 }, // Responsive vertical padding
        maxWidth: { xs: "100%", lg: "1400px", xl: "1600px" }, // Limit max width on large screens
      }}
    >
      <ChainSync />
      <TokenSelectModal />
      <Stack spacing={{ xs: 2, sm: 2 }}>
        {" "}
        {/* Responsive spacing */}
        <Box>
          <TokenSelect />
        </Box>
        {/* Main Content Area - Responsive Layout */}
        <Stack
          direction={{ xs: "column", lg: "row" }} // Stack vertically on mobile, horizontally on large screens
          spacing={{ xs: 1, sm: 2 }}
          alignItems="stretch"
        >
          {/* Chart Section */}
          <Box
            sx={{
              flex: { lg: 2 },
              order: { xs: 2, lg: 1 }, // Chart comes second on mobile, first on desktop
              display: "flex",
              flexDirection: "column",
              gap: { xs: 1, sm: 2 },
            }}
          >


            {/* Chart Components - Now handle their own containers and styling */}
            {chainId === 1 && <OneInchCandlestickChart />}
            {chainId === 747474 && <KatanaCandlestickChart />}
          </Box>

          {/* Swap Section */}
          <Box
            sx={{
              flex: { lg: 1 },
              order: { xs: 1, lg: 2 }, // Swap comes first on mobile, second on desktop
              minWidth: { xs: "auto", lg: "550px" }, // Responsive height
              maxWidth: { lg: "400px", xl: "450px" }, // Limit max width of swap panel
              overflow: "hidden", // Prevent content from spilling out
            }}
          >
            <GlowBox
              sx={{
                height: "100%",
                maxHeight: "100%", // Ensure GlowBox respects parent height
                minHeight: { xs: "400px", sm: "450px" }, // Ensure adequate height on mobile
                overflow: "hidden", // Prevent overflow
              }}
            >
              <SushiClassicSwap />
            </GlowBox>
          </Box>
        </Stack>
        {/* Token Balances Section */}
        <Box>
          <GlowBox
            sx={{
              minHeight: { xs: "200px", sm: "250px" }, // Responsive minimum height
              "& .MuiBox-root": {
                // Style nested boxes if needed
                overflow: "auto", // Handle overflow on small screens
              },
            }}
          >
            <TokenBalancesCard />
          </GlowBox>
        </Box>
      </Stack>
    </Container>
  );
};

export default page;