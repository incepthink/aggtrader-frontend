// app/spot/page.tsx
"use client";

import { ChainSync } from "@/components/common/ChainSync";
import GlowBox from "@/components/common/ui/GlowBox";
import OneInchCandlestickChart from "@/components/spot/chart/1inch/OneInchCandlestickChart";
import KatanaCandlestickChart from "@/components/spot/chart/katana/KatanaCandlestickChart";
import ChartSpot, { ChartHeader } from "@/components/spot/ChartSpot";
import { LimitWidget } from "@/components/spot/limit-widget/LimitWidget";
import { SwapModeButtons } from "@/components/spot/limit-widget/SwapModeButtons";
import OneInchSwap from "@/components/spot/OneInchSwap";
import SushiClassicSwap from "@/components/spot/classic-swap/Sushiclassicswap";
import TokenBalancesCard from "@/components/spot/tokenBalance/TokenBalancesCard";
import TokenSelect from "@/components/spot/TokenSelect";
import { TokenSelectModal } from "@/components/spot/TokenSelectModal";
import { TokenSelectModalProvider } from "@/context/TokenSelectModalContext";
import { PortfolioRefreshProvider } from "@/context/PortfolioRefreshContext";
import { Box, Container, Stack } from "@mui/material";
import React, { useState } from "react";

const page = () => {
  const [activeTab, setActiveTab] = useState<"swap" | "limit">("swap");

  return (
    <PortfolioRefreshProvider>
      <TokenSelectModalProvider>
        <Container
          maxWidth="xl"
          sx={{
            px: "12px !important",
            py: { xs: 1, sm: 2 },
            maxWidth: { xs: "100%", lg: "1400px", xl: "1600px" },
          }}
        >
          <ChainSync />
          {/* <TokenSelectModal /> */}
          <Stack spacing={{ xs: 2, sm: 2 }}>
            {/* <Box>
            <TokenSelect activeTab={activeTab} />
          </Box> */}

            {/* Main Content Area - Responsive Layout */}
            <Stack
              direction={{ xs: "column", lg: "row" }}
              spacing={{ xs: 1, sm: 2 }}
              alignItems="stretch"
              sx={{
                // Prevent the row from having equal heights
                alignItems: { xs: "stretch", lg: "flex-start" },
              }}
            >
              {/* Chart Section */}
              <Box
                sx={{
                  flex: { lg: 2 },
                  order: { xs: 2, lg: 1 },
                  display: "flex",
                  flexDirection: "column",
                  gap: { xs: 1, sm: 2 },
                }}
              >
                {/* Katana Chart - Always displayed */}
                <KatanaCandlestickChart />
              </Box>

              {/* Swap Section - Fixed height issue */}
              <Box
                sx={{
                  flex: { lg: 1 },
                  order: { xs: 1, lg: 2 },
                  minWidth: { xs: "auto", lg: "350px" },
                  maxWidth: { lg: "400px", xl: "450px" },
                  // Remove height matching - let content determine height
                  height: "auto", // Changed from matching chart height
                  overflow: "visible", // Changed from hidden
                }}
              >
                <GlowBox
                  sx={{
                    // Remove height constraints that were matching the chart
                    height: "auto", // Let content determine height
                    minHeight: { xs: "400px", sm: "600px" }, // Minimum height for usability
                    maxHeight: "none", // Remove max height restriction
                    overflow: "visible", // Allow content to flow naturally
                    p: { xs: 1.5, sm: 2, md: 2.5 }, // Better padding for content
                  }}
                >
                  {/* Mode selector */}
                  <div className="w-full px-2">
                    <SwapModeButtons
                      setActiveTab={setActiveTab}
                      activeTab={activeTab}
                    />
                  </div>{" "}
                  {activeTab === "swap" && <SushiClassicSwap />}
                  {activeTab === "limit" && <LimitWidget />}
                </GlowBox>
              </Box>
            </Stack>

            {/* Token Balances Section */}
            <Box>
              <GlowBox
                sx={{
                  minHeight: { xs: "200px", sm: "250px" },
                  "& .MuiBox-root": {
                    overflow: "auto",
                  },
                }}
              >
                <TokenBalancesCard />
              </GlowBox>
            </Box>
          </Stack>
        </Container>
      </TokenSelectModalProvider>
    </PortfolioRefreshProvider>
  );
};

export default page;
