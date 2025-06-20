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
  const [dydx, setDydx] = useState(0);
  const [balancer, setBalancer] = useState(0);
  const [aave, setAave] = useState(0);

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
      // zerion needs to verify api_key
      // const authToken = Buffer.from(
      //   `${process.env.NEXT_PUBLIC_ZERION_API}:`
      // ).toString("base64");

      // const response = await axios.get(
      //   `https://api.zerion.io/v1/wallets/${address}/positions/?filter[chain_ids]=ethereum`,
      //   {
      //     headers: {
      //       Authorization: `Basic ${authToken}`,
      //     },
      //   }
      // );

      // console.log("SPOT::", response.data);
      setSpot(48.35);
      return { total: 48.45 };
    } catch (error) {
      console.error("Error fetching Zerion positions:", error);
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

  async function getDydxData(address: string) {
    // use dydx address here

    const client = new IndexerClient(Network.mainnet().indexerConfig);

    const positions = await client.account.getSubaccountAssetPositions(
      "dydx1nd06hgk32htzpckl5exdyywquh64k9u57exp24",
      0
    );

    const usdcPos = positions.positions.find((p: any) => p.symbol === "USDC");

    if (usdcPos) {
      const bal = parseFloat(usdcPos.size);

      setDydx(Number(bal.toFixed(2)));
      console.log("DYDX::", bal);
    }
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

  return (
    <div>
      <div className="flex justify-center w-full py-10">
        {isConnected ? (
          <PieChartComp
            spot={spot}
            perp={dydx}
            lending={aave}
            balancer={balancer}
          />
        ) : (
          <p className="text-4xl font-semibold">Connect You Wallet</p>
        )}
      </div>
    </div>
  );
};

export default page;
