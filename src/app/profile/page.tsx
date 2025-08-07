// Updated main page component
"use client";

import { useUserStore } from "@/store/store";
import { ethers } from "ethers";
import React, { useEffect, useState } from "react";
import {
  UiPoolDataProvider,
  UiIncentiveDataProvider,
  ChainId,
} from "@aave/contract-helpers";
import * as markets from "@bgd-labs/aave-address-book";
import { formatReserves, formatUserSummary } from "@aave/math-utils";
import dayjs from "dayjs";
import { IndexerClient, Network } from "@dydxprotocol/v4-client-js";
import {
  ApolloClient,
  InMemoryCache,
  ApolloProvider,
  gql,
} from "@apollo/client";
import { useAccount, useBalance } from "wagmi";
import axios from "axios";
import { PieChartComp } from "@/components/profile/PieChartComp";
import EstimatedBalanceCard from "@/components/profile/EstimatedBalanceCard";
import EquityTrendChart from "@/components/profile/EquityTrendChart";
import RecentTransactionCard from "@/components/profile/RecentTransactionCard";
import { useSpotBalanceTotal } from "@/hooks/useSpotBalance";
import { usePortfolioDetailed } from "@/hooks/usePortfolioDetailed";
import { BACKEND_URL } from "@/utils/constants";

const client = new ApolloClient({
  uri: "https://api-v3.balancer.fi",
  cache: new InMemoryCache(),
});

interface HoldingsData {
  dydx: number;
  balancer: number;
  aave: number;
  isDydxFetched: boolean;
}

const page = () => {
  const { address, isConnected } = useAccount();

  // Use the efficient spot balance hook
  const { totalValue: spotTotal, isLoading: spotLoading } =
    usePortfolioDetailed();

  const [holdingsData, setHoldingsData] = useState<HoldingsData>({
    dydx: 0,
    balancer: 0,
    aave: 0,
    isDydxFetched: false,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [dataReady, setDataReady] = useState(false);

  async function getOtherHoldings() {
    if (!address) return;

    setIsLoading(true);
    setDataReady(false);

    try {
      // Execute all API calls in parallel (excluding spot, which is handled by the hook)
      const [aaveResult, dydxResult, balancerResult] = await Promise.allSettled(
        [
          getAaveHoldings(address),
          getDydxData(address),
          getBalancerData(address),
        ]
      );

      // Extract results with fallback values
      const aaveValue =
        aaveResult.status === "fulfilled" ? aaveResult.value : 0;
      const dydxData =
        dydxResult.status === "fulfilled"
          ? dydxResult.value
          : { value: 0, isFetched: false };
      const balancerValue =
        balancerResult.status === "fulfilled" ? balancerResult.value : 0;

      // Update all data at once
      setHoldingsData({
        aave: Number(aaveValue.toFixed(2)),
        dydx: Number(dydxData.value.toFixed(2)),
        balancer: Number(balancerValue.toFixed(2)),
        isDydxFetched: dydxData.isFetched,
      });

      setDataReady(true);
    } catch (error) {
      console.error("getOtherHoldings", error);
      setHoldingsData({
        dydx: 0,
        balancer: 0,
        aave: 0,
        isDydxFetched: false,
      });
      setDataReady(true);
    } finally {
      setIsLoading(false);
    }
  }

  // Keep your existing functions for Aave, dYdX, and Balancer
  async function getAaveHoldings(address: string): Promise<number> {
    try {
      const provider = new ethers.providers.JsonRpcProvider(
        "https://eth-mainnet.public.blastapi.io"
      );

      const poolDataProviderContract = new UiPoolDataProvider({
        uiPoolDataProviderAddress: markets.AaveV3Ethereum.UI_POOL_DATA_PROVIDER,
        provider,
        chainId: ChainId.mainnet,
      });

      const reserves = await poolDataProviderContract.getReservesHumanized({
        lendingPoolAddressProvider:
          markets.AaveV3Ethereum.POOL_ADDRESSES_PROVIDER,
      });

      const userReserves =
        await poolDataProviderContract.getUserReservesHumanized({
          lendingPoolAddressProvider:
            markets.AaveV3Ethereum.POOL_ADDRESSES_PROVIDER,
          user: address,
        });

      const currentTimestamp = dayjs().unix();
      const baseCurrencyData = reserves.baseCurrencyData;
      const reservesArray = reserves.reservesData;

      const formattedReserves = formatReserves({
        reserves: reservesArray,
        currentTimestamp,
        marketReferenceCurrencyDecimals:
          baseCurrencyData.marketReferenceCurrencyDecimals,
        marketReferencePriceInUsd:
          baseCurrencyData.marketReferenceCurrencyPriceInUsd,
      });

      const userReservesArray = userReserves.userReserves;
      const userSummary = formatUserSummary({
        currentTimestamp,
        marketReferencePriceInUsd:
          baseCurrencyData.marketReferenceCurrencyPriceInUsd,
        marketReferenceCurrencyDecimals:
          baseCurrencyData.marketReferenceCurrencyDecimals,
        userReserves: userReservesArray,
        formattedReserves,
        userEmodeCategoryId: userReserves.userEmodeCategoryId,
      });

      return Number(userSummary.totalLiquidityUSD);
    } catch (error) {
      console.error("Error fetching Aave data:", error);
      return 0;
    }
  }

  async function getDydxAddress(address: string): Promise<string | null> {
    try {
      const res = await axios.get(BACKEND_URL + address);
      return res.data.dydxAddress || null;
    } catch (error) {
      console.error("GETADDRESS::", error);
      return null;
    }
  }

  async function getDydxData(
    address: string
  ): Promise<{ value: number; isFetched: boolean }> {
    try {
      const dydxAddress = await getDydxAddress(address);

      if (dydxAddress) {
        const client = new IndexerClient(Network.mainnet().indexerConfig);
        const positions = await client.account.getSubaccountAssetPositions(
          dydxAddress,
          0
        );
        const usdcPos = positions.positions.find(
          (p: any) => p.symbol === "USDC"
        );

        if (usdcPos) {
          const bal = parseFloat(usdcPos.size);
          return { value: bal, isFetched: true };
        }
      }

      return { value: 0, isFetched: false };
    } catch (error) {
      console.error("Error fetching dYdX data:", error);
      return { value: 0, isFetched: false };
    }
  }

  async function getBalancerData(address: string): Promise<number> {
    try {
      const result = await client.query({
        query: gql`
          {
            poolGetPools(where:{chainIn:[MAINNET], userAddress:"${address}"}){
              address
              userBalance{
                stakedBalances{
                  balance
                  balanceUsd
                  stakingType
                }
                walletBalance
                walletBalanceUsd
                totalBalance
                totalBalanceUsd
              }
            }
          }
        `,
      });

      let bal = 0;
      result.data.poolGetPools.forEach((pool: any) => {
        bal += pool.userBalance.walletBalanceUsd;
      });

      return bal;
    } catch (error) {
      console.error("Error fetching Balancer data:", error);
      return 0;
    }
  }

  useEffect(() => {
    if (isConnected && address) {
      getOtherHoldings();
    } else {
      setDataReady(false);
      setHoldingsData({
        dydx: 0,
        balancer: 0,
        aave: 0,
        isDydxFetched: false,
      });
    }
  }, [isConnected, address]);

  function getTotalBalance() {
    return (
      // spotTotal + holdingsData.aave + holdingsData.balancer + holdingsData.dydx
      spotTotal
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="flex justify-center w-full py-4 sm:py-6 lg:py-10 px-4 sm:px-6 lg:px-9">
        {isConnected ? (
          <div className="w-full">
            {/* Balance Card - Full width on mobile */}
            <div className="mb-6 lg:mb-8">
              <EstimatedBalanceCard bal={getTotalBalance()} />
            </div>

            {/* Charts Section - Stack on mobile, side by side on desktop */}
            <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8 mb-6 lg:mb-8">
              <div className="w-full lg:w-2/3">
                <EquityTrendChart />
              </div>
              <div className="w-full lg:w-1/3">
                <RecentTransactionCard />
              </div>
            </div>

            {/* Pie Chart - Full width */}
            <div className="neon-panel relative">
              <PieChartComp
                isDydxFetched={dataReady ? holdingsData.isDydxFetched : false}
                spot={dataReady ? spotTotal : 0}
                perp={dataReady ? holdingsData.dydx : 0}
                lending={dataReady ? holdingsData.aave : 0}
                balancer={dataReady ? holdingsData.balancer : 0}
                isLoading={isLoading || spotLoading}
              />
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center min-h-[60vh]">
            <p className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-center px-4">
              Connect Your Wallet
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default page;
