import { useAaveStore } from "@/store/aaveStore";
import { ReserveDataHumanized } from "@aave/contract-helpers";
import { List } from "@mui/material";
import React, { useEffect } from "react";
import { useAccount } from "wagmi";

const allowedSymbols = ["UNI", "WBTC", "USDT", "WETH", "ETH"];

const SupplyAssetsList = () => {
  const { reserves, fetchReserves, isLoading } = useAaveStore();
  const { address } = useAccount();

  const filteredReserves = reserves?.reservesData.filter((reserve) => {
    return allowedSymbols.includes(reserve.symbol);
  });
  console.log(filteredReserves);

  useEffect(() => {
    if (address) {
      fetchReserves();
    }
  }, [address]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <List>
      {filteredReserves?.map((reserve): any => {
        return <div>{reserve.symbol}</div>;
      })}
    </List>
  );
};

export default SupplyAssetsList;
