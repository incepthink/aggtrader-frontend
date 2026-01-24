"use client";

import { Box, Stack, Typography } from "@mui/material";
import MarketHeader from "@/components/perp/MarketHeader";
import KumaCandlestickChart from "@/components/perp/KumaCandlestickChart";
import OrderbookTrades from "@/components/perp/OrderbookTrades";
import PositionsPanel from "@/components/perp/PositionsPanel";
import DepositWithdraw from "@/components/perp/DepositWithdraw";
import OrderForm from "@/components/perp/OrderForm";
import BokutoSwitcher from "@/components/perp/BokutoSwitcher";
import { KumaAuthWrapper } from "@/components/perp/KumaAuthWrapper";
import { useKumaWebSocket } from "@/hooks/perp/useWebsocketClient";
import { useKumaBalance } from "@/hooks/perp/useKumaBalance";
import { CandleInterval } from "@katanaperps/katana-perps-sdk";
import GlowBox from "@/components/common/ui/GlowBox";
import { useAccount, useChainId } from "wagmi";

const BOKUTO_CHAIN_ID = 737373;

const PerpPage = () => {
  const { isConnected: isWalletConnected } = useAccount();
  const chainId = useChainId();
  const { isConnected, tickerData, error } = useKumaWebSocket("BTC-USD");
  const { balance: accountBalance } = useKumaBalance();

  // Extract current price from ticker data
  const currentPrice = tickerData?.close
    ? parseFloat(tickerData.close)
    : undefined;

  // Check if wallet is on correct chain for perp trading (Bokuto testnet during development)
  const isOnBokuto = chainId === BOKUTO_CHAIN_ID;
  const needsChainSwitch = isWalletConnected && !isOnBokuto;

  return (
    <>
      {/* Kuma Auth - Triggers unlock modal on page load if wallet connected */}
      <KumaAuthWrapper />

      <Box
        sx={{
          width: "100%",
          height: "100vh",
          background: "#050C19",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Chain Switcher Banner - Shows when wallet is on wrong chain */}
        <BokutoSwitcher />

        {/* Error Display */}
        {/* {error && (
          <Box sx={{ padding: 2, color: "#FF4444", textAlign: "center" }}>
            Error: {error}
          </Box>
        )} */}

        {/* Main Trading Layout */}
        <Box
          sx={{
            flex: 1,
            display: "grid",
            gridTemplateColumns: "1fr 280px 350px", // Chart | Orderbook | Trade Panel
            gridTemplateRows: "auto 1fr 280px", // Header | Main | Bottom
            gap: 1,
            padding: 1,
            overflow: "hidden",
          }}
        >
          {/* ========== ROW 1: CHART HEADER ========== */}
          <Box sx={{ gridColumn: "1 / 2", gridRow: "1 / 2" }}>
            <GlowBox
              sx={{
                height: "100%",
                background: "rgba(5, 12, 25, 0.8)",
              }}
            >
              <MarketHeader tickerData={tickerData} isConnected={isConnected} />
            </GlowBox>
          </Box>

          {/* ========== ROW 2: MAIN CONTENT ========== */}

          {/* Chart Body */}
          <Box
            sx={{ gridColumn: "1 / 2", gridRow: "2 / 3", overflow: "hidden" }}
          >
            <GlowBox
              sx={{
                height: "100%",
                background: "rgba(5, 12, 25, 0.6)",
                p: 0,
              }}
            >
              <KumaCandlestickChart
                market="BTC-USD"
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
              }}
            >
              <OrderbookTrades market="BTC-USD" />
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
              }}
            >
              <OrderForm
                market="BTC-USD"
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
              }}
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
              }}
            >
              <DepositWithdraw accountBalance={accountBalance} />
            </GlowBox>
          </Box>
        </Box>
      </Box>
    </>
  );
};

export default PerpPage;
