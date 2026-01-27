"use client";

import { Box } from "@mui/material";
import { useState, useEffect } from "react";
import MarketHeader from "@/components/perp/MarketHeader";
import KumaCandlestickChart from "@/components/perp/KumaCandlestickChart";
import OrderbookTrades from "@/components/perp/OrderbookTrades";
import PositionsPanel from "@/components/perp/positionsPanel/PositionsPanel";
import DepositWithdraw from "@/components/perp/DepositWithdraw";
import OrderForm from "@/components/perp/OrderForm";
import BokutoSwitcher from "@/components/perp/BokutoSwitcher";
import { KumaAuthWrapper } from "@/components/perp/KumaAuthWrapper";
import { useKumaWebSocket } from "@/hooks/perp/useWebsocketClient";
import { useKumaBalance } from "@/hooks/perp/useKumaBalance";
import { CandleInterval } from "@katanaperps/katana-perps-sdk";
import GlowBox from "@/components/common/ui/GlowBox";
import { useAccount, useChainId } from "wagmi";
import { usePerpBalanceStore } from "@/store/perpBalanceStore";

const BOKUTO_CHAIN_ID = 737373;

const PerpPage = () => {
  const { isConnected: isWalletConnected } = useAccount();
  const chainId = useChainId();
  const [selectedMarket, setSelectedMarket] = useState<string>("BTC-USD");
  const { isConnected, tickerData } = useKumaWebSocket(selectedMarket);
  const { balance: accountBalance, isLoading: isBalanceLoading } = useKumaBalance();
  const setAccountBalance = usePerpBalanceStore(
    (state) => state.setAccountBalance,
  );
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

  return (
    <>
      {/* Kuma Auth - Triggers unlock modal on page load if wallet connected */}
      <KumaAuthWrapper />

      <Box
        sx={{
          width: "100%",
          minHeight: "calc(100vh - 64px)",
          background: "#050C19",
          display: "flex",
          flexDirection: "column",
          overflow: "auto",
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
            gridTemplateRows: "auto minmax(500px, 1fr) 320px", // Header | Main | Bottom
            gap: 1,
            padding: 1,
          }}
        >
          {/* ========== ROW 1: CHART HEADER ========== */}
          <Box sx={{ gridColumn: "1 / 2", gridRow: "1 / 2" }}>
            <GlowBox
              sx={{
                height: "100%",
                background: "rgba(5, 12, 25, 0.8)",
                spread: 22,
              }}
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
              }}
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
              <DepositWithdraw accountBalance={accountBalance} isLoading={isBalanceLoading} />
            </GlowBox>
          </Box>
        </Box>
      </Box>
    </>
  );
};

export default PerpPage;
