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

const page = () => {
  // const setUserAddress = useUserStore((state) => state.setAddress);
  // const setUserProvider = useUserStore((state) => state.setProvider);
  // const userAddress = useUserStore((state) => state.address);
  // const userProvider = useUserStore((state) => state.provider);

  const { address, isConnected } = useAccount();

  const [spot, setSpot] = useState(0);
  const [dydx, setDydx] = useState<number | string>(0);
  const [balancer, setBalancer] = useState(0);
  const [aave, setAave] = useState(0);
  const [isDydxFetched, setIsDydxFetched] = useState(false);

  async function getHoldings() {
    try {
      getAaveHoldings(address!);
      getDydxData(address!);
      getBalancerData(address!);
      getSpotBalance(address!);
    } catch (error) {
      console.error("getHoldings", error);
    }
  }

  async function getSpotBalance(address: string) {
    try {
      const apiKey = process.env.NEXT_PUBLIC_COVALENT_KEY;
      if (!apiKey) {
        console.error("Covalent API key missing");
        setSpot(0);
        return { total: 0 };
      }

      // ---- call balances_v3 (faster, no NFTs) ------------------
      const url = `https://api.covalenthq.com/v1/1/address/${address}/balances_v3/?no-nft-fetch=true&key=${apiKey}`;

      const { data } = await axios.get(url);
      const items = data?.data?.items || [];
      console.log("ITEMS::", items);

      let totalUsd = 0;
      items.forEach((item: any) => {
        // item.quote is already the token balance * price in USD
        if (item.quote !== null) totalUsd += item.quote;
      });
      console.log("SPOT::", Number(totalUsd.toFixed(2)));

      setSpot(Number(totalUsd.toFixed(2)));
      return { total: totalUsd };
    } catch (err) {
      console.error("Error fetching Covalent balances:", err);
      setSpot(0);
      return { total: 0 };
    }
  }

  async function getAaveHoldings(address: string) {
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

    setAave(Number(Number(userSummary.totalLiquidityUSD).toFixed(2)));

    console.log("AAVE::", userSummary);
  }

  async function getDydxAddress(address: string) {
    try {
      const res = await axios.get(
        "https://aggtrade-backend.onrender.com/api/address/" + address
      );
      console.log(res.data);

      if (!res.data.dydxAddress) {
        return;
      }

      return res.data.dydxAddress;
    } catch (error) {
      setIsDydxFetched(false);
      console.error("GETADDRESS::", error);
    }
  }

  async function getDydxData(address: string) {
    const dydxAddress = await getDydxAddress(address);
    console.log(dydxAddress);

    if (dydxAddress) {
      setIsDydxFetched(true);
      const client = new IndexerClient(Network.mainnet().indexerConfig);

      const positions = await client.account.getSubaccountAssetPositions(
        dydxAddress,
        0
      );

      const usdcPos = positions.positions.find((p: any) => p.symbol === "USDC");

      if (usdcPos) {
        const bal = parseFloat(usdcPos.size);

        setDydx(Number(bal.toFixed(2)));
        console.log("DYDX::", bal);
        return;
      }
    }

    setIsDydxFetched(false);
    setDydx(0);
  }

  async function getBalancerData(address: string) {
    client
      .query({
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
      })
      .then((result) => {
        let bal = 0;

        result.data.poolGetPools.forEach((pool: any) => {
          bal += pool.userBalance.walletBalanceUsd;
        });

        setBalancer(Number(bal.toFixed(2)));
      });
  }

  // const { data, isLoading } = useBalance({
  //   address: address! as `0x${string}`,
  // });
  // console.log("SPOT::", data, isLoading);

  useEffect(() => {
    if (isConnected) {
      getHoldings();
    }
  }, [isConnected]);

  function getBal() {
    if (typeof dydx === "number") {
      return spot + aave + balancer + dydx;
    }
    return spot + aave + balancer;
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
              {!isDydxFetched && (
                <div className="absolute top-0 right-0 flex items-center gap-2 neon-panel">
                  <div className="w-5 rounded-full overflow-hidden">
                    <img
                      src="/assets/warning.png"
                      alt=""
                      className="w-full object-cover"
                    />
                  </div>
                  <p>
                    Connect Ethereum Wallet on{" "}
                    <a
                      href="https://perp.aggtrade.xyz/"
                      className="underline text-blue-600"
                      target="_blank"
                    >
                      Perp
                    </a>{" "}
                    to get balance
                  </p>
                </div>
              )}
              <PieChartComp
                spot={spot}
                perp={typeof dydx === "number" ? dydx : 0}
                lending={aave}
                balancer={balancer}
              />
            </div>
          </div>
        ) : (
          <p className="text-4xl font-semibold">Connect You Wallet</p>
        )}
      </div>
    </div>
  );
};

export default page;
