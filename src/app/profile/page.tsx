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

const client = new ApolloClient({
  uri: "https://api-v3.balancer.fi",
  cache: new InMemoryCache(),
});

interface TokenBalance {
  symbol: string;
  balance: number;
  contractAddress?: string;
  decimals?: number;
}

interface HoldingsData {
  spot: number;
  dydx: number;
  balancer: number;
  aave: number;
  isDydxFetched: boolean;
  spotTokens: TokenBalance[];
}

const page = () => {
  const { address, isConnected } = useAccount();

  // Changed to single state object to batch updates
  const [holdingsData, setHoldingsData] = useState<HoldingsData>({
    spot: 0,
    dydx: 0,
    balancer: 0,
    aave: 0,
    isDydxFetched: false,
    spotTokens: [],
  });

  const [isLoading, setIsLoading] = useState(false);
  const [dataReady, setDataReady] = useState(false);

  async function getHoldings() {
    if (!address) return;

    setIsLoading(true);
    setDataReady(false);

    try {
      // Execute all API calls in parallel
      const [spotResult, aaveResult, dydxResult, balancerResult] =
        await Promise.allSettled([
          getSpotBalance(address),
          getAaveHoldings(address),
          getDydxData(address),
          getBalancerData(address),
        ]);

      // Extract results with fallback values
      const spotData =
        spotResult.status === "fulfilled"
          ? spotResult.value
          : { total: 0, tokens: [] };
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
        spot: Number(spotData.total.toFixed(2)),
        aave: Number(aaveValue.toFixed(2)),
        dydx: Number(dydxData.value.toFixed(2)),
        balancer: Number(balancerValue.toFixed(2)),
        isDydxFetched: dydxData.isFetched,
        spotTokens: spotData.tokens,
      });

      // Mark data as ready for smooth animation
      setDataReady(true);
    } catch (error) {
      console.error("getHoldings", error);
      // Set default values on error
      setHoldingsData({
        spot: 0,
        dydx: 0,
        balancer: 0,
        aave: 0,
        isDydxFetched: false,
        spotTokens: [],
      });
      setDataReady(true);
    } finally {
      setIsLoading(false);
    }
  }

  async function getSpotBalance(
    address: string
  ): Promise<{ total: number; tokens: TokenBalance[] }> {
    try {
      const apiKey = process.env.NEXT_PUBLIC_COVALENT_KEY;
      if (!apiKey) {
        console.error("Covalent API key missing");
        return { total: 0, tokens: [] };
      }

      const url = `https://api.covalenthq.com/v1/1/address/${address}/balances_v3/?no-nft-fetch=true&key=${apiKey}`;

      const { data } = await axios.get(url);
      const items = data?.data?.items || [];
      console.log("ITEMS::", items);

      let totalUsd = 0;
      const tokens: TokenBalance[] = [];

      items.forEach((item: any) => {
        if (item.quote !== null && item.quote > 0) {
          totalUsd += item.quote;

          // Calculate token balance (convert from wei)
          const balance =
            parseFloat(item.balance) / Math.pow(10, item.contract_decimals);

          // Only include tokens with meaningful balance (> $1 USD value)
          if (item.quote > 1 && balance > 0) {
            tokens.push({
              symbol: item.contract_ticker_symbol || "UNKNOWN",
              balance: balance,
              contractAddress: item.contract_address,
              decimals: item.contract_decimals,
            });
          }
        }
      });

      console.log("SPOT::", Number(totalUsd.toFixed(2)));
      console.log("TOKENS::", tokens);

      return { total: totalUsd, tokens };
    } catch (err) {
      console.error("Error fetching Covalent balances:", err);
      return { total: 0, tokens: [] };
    }
  }

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

      console.log("AAVE::", userSummary);
      return Number(userSummary.totalLiquidityUSD);
    } catch (error) {
      console.error("Error fetching Aave data:", error);
      return 0;
    }
  }

  async function getDydxAddress(address: string): Promise<string | null> {
    try {
      const res = await axios.get(
        "https://aggtrade-backend.onrender.com/api/address/" + address
      );
      console.log(res.data);

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
      console.log(dydxAddress);

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
          console.log("DYDX::", bal);
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
      getHoldings();
    } else {
      setDataReady(false);
      setHoldingsData({
        spot: 0,
        dydx: 0,
        balancer: 0,
        aave: 0,
        isDydxFetched: false,
        spotTokens: [],
      });
    }
  }, [isConnected, address]);

  function getBal() {
    return (
      holdingsData.spot +
      holdingsData.aave +
      holdingsData.balancer +
      holdingsData.dydx
    );
  }

  return (
    <div>
      <div className="flex justify-center w-full py-10 px-9">
        {isConnected ? (
          <div className="w-full">
            <div className="mb-8">
              <EstimatedBalanceCard bal={getBal()} />
            </div>
            <div className="flex gap-8 mb-8">
              <div className=" w-2/3">
                <EquityTrendChart />
              </div>
              <div className="w-1/3">
                <RecentTransactionCard />
              </div>
            </div>
            <div className="neon-panel relative">
              <PieChartComp
                isDydxFetched={dataReady ? holdingsData.isDydxFetched : false}
                spot={dataReady ? holdingsData.spot : 0}
                perp={dataReady ? holdingsData.dydx : 0}
                lending={dataReady ? holdingsData.aave : 0}
                balancer={dataReady ? holdingsData.balancer : 0}
                isLoading={isLoading}
              />
            </div>
          </div>
        ) : (
          <p className="text-4xl font-semibold">Connect Your Wallet</p>
        )}
      </div>
    </div>
  );
};

export default page;
