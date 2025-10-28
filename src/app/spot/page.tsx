// app/spot/page.tsx
"use client";

import { ChainSync } from "@/components/common/ChainSync";
import GlowBox from "@/components/common/ui/GlowBox";
import OneInchCandlestickChart from "@/components/spot/chart/1inch/OneInchCandlestickChart";
import EthereumCandlestickChart from "@/components/spot/chart/ethereum/EthereumCandlestickChart";
import KatanaCandlestickChart from "@/components/spot/chart/katana/KatanaCandlestickChart";
import ChartSpot, { ChartHeader } from "@/components/spot/ChartSpot";
import EthereumPoolCandlestickChart from "@/components/spot/EthereumPoolCandlestickChart";
import { LimitWidget } from "@/components/spot/limit-widget/LimitWidget";
import { SwapModeButtons } from "@/components/spot/limit-widget/SwapModeButtons";
import OneInchSwap from "@/components/spot/OneInchSwap";
import SushiClassicSwap from "@/components/spot/classic-swap/Sushiclassicswap";
import TokenBalancesCard from "@/components/spot/tokenBalance/TokenBalancesCard";
import TokenSelect from "@/components/spot/TokenSelect";
import { TokenSelectModal } from "@/components/spot/TokenSelectModal";
import { TokenSelectModalProvider } from "@/context/TokenSelectModalContext";
import { useSpotStore } from "@/store/spotStore";
import { Box, Container, Stack, useMediaQuery, useTheme } from "@mui/material";
import React, { useState } from "react";
import { motion } from "framer-motion";

const page = () => {
  const { chainId } = useSpotStore();
  const [activeTab, setActiveTab] = useState<"swap" | "limit">("swap");
  const [showChart, setShowChart] = useState(true);

  const theme = useTheme();
  const isLargeScreen = useMediaQuery(theme.breakpoints.up("lg"));

  return (
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
        <TokenSelectModal />
        <Stack spacing={{ xs: 2, sm: 2 }}>
          <Box>
            <TokenSelect activeTab={activeTab} />
          </Box>

          {/* Main Content Area */}
          {isLargeScreen ? (
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                gap: "16px",
                alignItems: "flex-start",
                width: "100%",
                justifyContent: "center",
              }}
            >
              {/* Chart Section */}
              <motion.div
                initial={false}
                animate={{
                  flexGrow: showChart ? 2 : 0,
                  flexShrink: showChart ? 1 : 0,
                  width: showChart ? "auto" : 0,
                  opacity: showChart ? 1 : 0,
                  marginRight: showChart ? 16 : 0,
                }}
                transition={{
                  duration: 0.4,
                  ease: "easeInOut",
                  opacity: { duration: 0.2, ease: "easeInOut" },
                }}
                style={{
                  overflow: "hidden",
                  minWidth: 0,
                }}
              >
                {chainId === 747474 && (
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      gap: { xs: 1, sm: 2 },
                    }}
                  >
                    <KatanaCandlestickChart />
                  </Box>
                )}
              </motion.div>

              {/* Left Spacer */}
              <motion.div
                initial={false}
                animate={{
                  flexGrow: showChart ? 0 : 1,
                }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                style={{
                  flexShrink: 1,
                  minWidth: 0,
                }}
              />

              {/* Swap Section */}
              <motion.div
                initial={false}
                animate={{
                  width: showChart ? "450px" : "550px",
                  flexGrow: 0,
                  flexShrink: 0,
                }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
              >
                <Box>
                  <GlowBox
                    sx={{
                      height: "auto",
                      minHeight: { xs: "400px", sm: "600px" },
                      maxHeight: "none",
                      overflow: "visible",
                      p: { xs: 1.5, sm: 2, md: 2.5 },
                    }}
                  >
                    <div className="w-full px-2">
                      <SwapModeButtons
                        setActiveTab={setActiveTab}
                        activeTab={activeTab}
                      />
                    </div>
                    {activeTab === "swap" && (
                      <SushiClassicSwap
                        showChart={showChart}
                        onToggleChart={() => setShowChart(!showChart)}
                        isMobile={false}
                      />
                    )}
                    {activeTab === "limit" && <LimitWidget />}
                  </GlowBox>
                </Box>
              </motion.div>

              {/* Right Spacer */}
              <motion.div
                initial={false}
                animate={{
                  flexGrow: showChart ? 0 : 1,
                }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                style={{
                  flexShrink: 1,
                  minWidth: 0,
                }}
              />
            </div>
          ) : (
            <Stack
              direction={{ xs: "column", lg: "row" }}
              spacing={{ xs: 1, sm: 2 }}
              alignItems="stretch"
              sx={{
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
                {chainId === 747474 && <KatanaCandlestickChart />}
              </Box>

              {/* Swap Section */}
              <Box
                sx={{
                  flex: { lg: 1 },
                  order: { xs: 1, lg: 2 },
                  minWidth: { xs: "auto", lg: "350px" },
                  maxWidth: { lg: "400px", xl: "450px" },
                  height: "auto",
                  overflow: "visible",
                }}
              >
                <GlowBox
                  sx={{
                    height: "auto",
                    minHeight: { xs: "400px", sm: "600px" },
                    maxHeight: "none",
                    overflow: "visible",
                    p: { xs: 1.5, sm: 2, md: 2.5 },
                  }}
                >
                  <div className="w-full px-2">
                    <SwapModeButtons
                      setActiveTab={setActiveTab}
                      activeTab={activeTab}
                    />
                  </div>
                  {activeTab === "swap" && (
                    <SushiClassicSwap
                      showChart={true}
                      onToggleChart={() => {}}
                      isMobile={true}
                    />
                  )}
                  {activeTab === "limit" && <LimitWidget />}
                </GlowBox>
              </Box>
            </Stack>
          )}

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
  );
};

export default page;
