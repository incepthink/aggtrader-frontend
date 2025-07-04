import { useAaveStore } from "@/store/aaveStore";
import { ReserveDataHumanized } from "@aave/contract-helpers";
import {
  ComputedUserReserve,
  formatReservesAndIncentives,
  formatUserSummary,
} from "@aave/math-utils";
import { List } from "@mui/material";
import React, { useEffect } from "react";
import { useAccount } from "wagmi";

const allowedSymbols = ["UNI", "WBTC", "USDT", "WETH", "ETH"];

export interface IconMapInterface {
  iconSymbol: string;
  name?: string;
  symbol?: string;
}

export type FormattedReservesAndIncentives = ReturnType<
  typeof formatReservesAndIncentives
>[number] &
  IconMapInterface & {
    isWrappedBaseAsset: boolean;
  } & ReserveDataHumanized;

const SuppliedPositionsList = () => {
  const { userReserves, fetchUserData, isLoading, reserves } = useAaveStore();
  const { address } = useAccount();

  const filteredReserves = userReserves?.filter((item) => {
    return Number(item.scaledATokenBalance) > 0 && item;
  });

  console.log("FILTERD", filteredReserves);

  useEffect(() => {
    if (address) {
      fetchUserData(address);
    }
  }, [address]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return <div>Hi</div>;
};

export default SuppliedPositionsList;
