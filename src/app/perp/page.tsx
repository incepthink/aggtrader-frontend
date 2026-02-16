"use client";

import { Box } from "@mui/material";
import { useState, useEffect } from "react";
import MarketHeader from "@/components/perp/MarketHeader";
import KumaCandlestickChart from "@/components/perp/KumaCandlestickChart";
import OrderbookTrades from "@/components/perp/OrderbookTrades";
import PositionsPanel from "@/components/perp/positionsPanel/PositionsPanel";
import DepositWithdraw from "@/components/perp/DepositWithdraw";
import OrderForm from "@/components/perp/orderForm/OrderForm";
import BokutoSwitcher from "@/components/perp/BokutoSwitcher";
import { KumaAuthWrapper } from "@/components/perp/KumaAuthWrapper";
import { useKumaWebSocket } from "@/hooks/perp/useWebsocketClient";
import { useKumaBalance } from "@/hooks/perp/useKumaBalance";
import { CandleInterval } from "@katanaperps/katana-perps-sdk";
import GlowBox from "@/components/common/ui/GlowBox";
import { useAccount, useChainId } from "wagmi";
import { usePerpBalanceStore } from "@/store/perpBalanceStore";
import { usePerpMobile } from "@/hooks/perp/usePerpResponsive";
import {
  MobileMarketHeader,
  MobilePositionsPanel,
  MobileActionButtons,
  MobileBottomNavbar,
  MobileChartTabs,
} from "@/components/perp/mobile";

const BOKUTO_CHAIN_ID = 737373;

// Desktop layout widths (in pixels)
const ORDERBOOK_WIDTH = 266;
const ORDER_FORM_WIDTH = 266;

const PerpPage = () => {
  const { isConnected: isWalletConnected } = useAccount();
  const chainId = useChainId();
  const [selectedMarket, setSelectedMarket] = useState<string>("BTC-USD");
  const { isConnected, tickerData } = useKumaWebSocket(selectedMarket);
  const { balance: accountBalance, isLoading: isBalanceLoading } =
    useKumaBalance();
  const setAccountBalance = usePerpBalanceStore(
    (state) => state.setAccountBalance,
  );
  const isMobile = usePerpMobile();
  const [mobileChartTab, setMobileChartTab] = useState<
    "chart" | "depth" | "orderbook" | "trades"
  >("chart");

  // Sync balance to global store
  useEffect(() => {
    setAccountBalance(accountBalance);
  }, [accountBalance, setAccountBalance]);

  // Extract current price from ticker data
  const currentPrice = tickerData?.close
    ? parseFloat(tickerData.close)
    : undefined;

  // Check if wallet is on correct chain for perp trading (Bokuto testnet during development)
  const isOnBokuto = chainId === BOKUTO_CHAIN_ID;
  const needsChainSwitch = isWalletConnected && !isOnBokuto;

  // Mobile Layout
  if (isMobile) {
    return (
      <>
        <KumaAuthWrapper />
        <Box
          sx={{
            width: "100%",
            minHeight: "100vh",
            maxHeight: "100vh",
            background: "#050C19",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            pb: "60px", // Space for bottom navbar
          }}
        >
          {/* Chain Switcher Banner */}
          {/* <BokutoSwitcher /> */}

          {/* Mobile Market Header */}
          <MobileMarketHeader
            tickerData={tickerData}
            isConnected={isConnected}
            selectedMarket={selectedMarket}
            onMarketChange={setSelectedMarket}
          />

          {/* Chart Tabs */}
          <MobileChartTabs
            activeTab={mobileChartTab}
            onTabChange={setMobileChartTab}
          />

          {/* Chart / Orderbook / Depth / Trades */}
          <Box
            sx={{
              flex: 1,
              minHeight: 0,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {mobileChartTab === "chart" && (
              <Box sx={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
                <KumaCandlestickChart
                  market={selectedMarket}
                  initialInterval={CandleInterval.FIVE_MINUTES}
                />
              </Box>
            )}
            {(mobileChartTab === "orderbook" ||
              mobileChartTab === "trades" ||
              mobileChartTab === "depth") && (
              <Box sx={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
                <OrderbookTrades market={selectedMarket} />
              </Box>
            )}
          </Box>

          {/* Positions Panel */}
          <Box sx={{ flexShrink: 0, px: 1.5, py: 1 }}>
            <MobilePositionsPanel />
          </Box>

          {/* Action Buttons */}
          <Box sx={{ flexShrink: 0, px: 0.5 }}>
            <MobileActionButtons
              disabled={!isWalletConnected || needsChainSwitch}
            />
          </Box>

          {/* Mobile Bottom Navbar */}
          <MobileBottomNavbar />
        </Box>
      </>
    );
  }

  // Desktop Layout
  return (
    <>
      {/* Kuma Auth - Triggers unlock modal on page load if wallet connected */}
      <KumaAuthWrapper />

      <Box
        sx={{
          width: "100%",
          minHeight: "calc(100vh - 64px)",
          maxWidth: "100vw",
          background: "#050C19",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Chain Switcher Banner - Shows when wallet is on wrong chain */}
        <BokutoSwitcher />

        {/* Main Trading Layout */}
        <Box
          sx={{
            flex: 1,
            display: "grid",
            gridTemplateColumns: `minmax(0, 1fr) ${ORDERBOOK_WIDTH}px ${ORDER_FORM_WIDTH}px`, // Chart | Orderbook | Trade Panel
            gridTemplateRows: "auto minmax(400px, 1fr) 320px", // Header | Main | Bottom
            gap: 1,
            padding: 1,
            overflow: "hidden",
            maxWidth: "100%",
          }}
        >
          {/* ========== ROW 1: CHART HEADER ========== */}
          <Box
            sx={{ gridColumn: "1 / 2", gridRow: "1 / 2", overflow: "hidden" }}
          >
            <GlowBox
              sx={{
                height: "100%",
                background: "rgba(5, 12, 25, 0.8)",
                spread: 22,
                overflow: "hidden",
              }}
              spread={15}
            >
              <MarketHeader
                tickerData={tickerData}
                isConnected={isConnected}
                selectedMarket={selectedMarket}
                onMarketChange={setSelectedMarket}
              />
            </GlowBox>
          </Box>

          {/* ========== ROW 2: MAIN CONTENT ========== */}

          {/* Chart Body */}
          <Box
            sx={{
              gridColumn: "1 / 2",
              gridRow: "2 / 3",
              overflow: "hidden",
              minWidth: 0,
            }}
          >
            <GlowBox
              sx={{
                height: "100%",
                background: "rgba(5, 12, 25, 0.6)",
                p: 0,
                overflow: "hidden",
              }}
              spread={15}
            >
              <KumaCandlestickChart
                market={selectedMarket}
                initialInterval={CandleInterval.FIVE_MINUTES}
              />
            </GlowBox>
          </Box>

          {/* Orderbook/Trades - Only spans chart body height */}
          <Box
            sx={{ gridColumn: "2 / 3", gridRow: "1 / 3", overflow: "hidden" }}
          >
            <GlowBox
              sx={{
                height: "100%",
                background: "rgba(5, 12, 25, 0.6)",
                p: 0,
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
              }}
              spread={15}
            >
              <OrderbookTrades market={selectedMarket} />
            </GlowBox>
          </Box>

          {/* Trade Panel / Order Form - Only spans chart body height */}
          <Box
            sx={{ gridColumn: "3 / 4", gridRow: "1 / 3", overflow: "hidden" }}
          >
            <GlowBox
              padding={0}
              sx={{
                height: "100%",
                background: "rgba(5, 12, 25, 0.6)",
                overflow: "hidden",
              }}
              spread={15}
            >
              <OrderForm
                market={selectedMarket}
                currentPrice={currentPrice}
                tickerData={tickerData}
              />
            </GlowBox>
          </Box>

          {/* ========== ROW 3: BOTTOM SECTION ========== */}

          {/* Positions / Open Orders / History */}
          <Box
            sx={{ gridColumn: "1 / 3", gridRow: "3 / 4", overflow: "hidden" }}
          >
            <GlowBox
              sx={{
                height: "100%",
                background: "rgba(5, 12, 25, 0.6)",
                p: 0,
                overflow: "hidden",
              }}
              spread={15}
            >
              <PositionsPanel />
            </GlowBox>
          </Box>

          {/* Deposit / Withdraw */}
          <Box
            sx={{ gridColumn: "3 / 4", gridRow: "3 / 4", overflow: "hidden" }}
          >
            <GlowBox
              sx={{
                height: "100%",
                background: "rgba(5, 12, 25, 0.6)",
                p: 0,
                overflow: "hidden",
              }}
              spread={15}
            >
              <DepositWithdraw
                accountBalance={accountBalance}
                isLoading={isBalanceLoading}
              />
            </GlowBox>
          </Box>
        </Box>
      </Box>
    </>
  );
};

export default PerpPage;
