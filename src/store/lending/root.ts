import { enableMapSet } from "immer";
import { CustomMarket } from "@/types/lending/marketConfig";
import { create } from "zustand";
import { devtools, subscribeWithSelector } from "zustand/middleware";

import { createPoolSlice, PoolSlice } from "./poolSlice";
import {
  createProtocolDataSlice,
  ProtocolDataSlice,
} from "./protocolDataSlice";
import { createStakeSlice, StakeSlice } from "./stakeSlice";
import {
  createTransactionsSlice,
  TransactionsSlice,
} from "./transactionsSlice";
import { getQueryParameter } from "./utils/queryParams";
import { createV3MigrationSlice, V3MigrationSlice } from "./v3MigrationSlice";
import { createWalletDomainsSlice, WalletDomainsSlice } from "./walletDomains";
import { createWalletSlice, WalletSlice } from "./walletSlice";

enableMapSet();

export type RootStore = StakeSlice &
  ProtocolDataSlice &
  WalletSlice &
  PoolSlice &
  V3MigrationSlice &
  WalletDomainsSlice &
  TransactionsSlice;

export const useRootStore = create<RootStore>()(
  subscribeWithSelector(
    devtools((...args) => {
      return {
        ...createStakeSlice(...args),
        ...createProtocolDataSlice(...args),
        ...createWalletSlice(...args),
        ...createPoolSlice(...args),
        ...createV3MigrationSlice(...args),
        ...createWalletDomainsSlice(...args),
        ...createTransactionsSlice(...args),
      };
    })
  )
);

// hydrate state from localeStorage to not break on ssr issues
if (typeof document !== "undefined") {
  document.onreadystatechange = function () {
    if (document.readyState == "complete") {
      const selectedMarket =
        getQueryParameter("marketName") ||
        localStorage.getItem("selectedMarket");

      if (selectedMarket) {
        const currentMarket = useRootStore.getState().currentMarket;
        const setCurrentMarket = useRootStore.getState().setCurrentMarket;
        if (selectedMarket !== currentMarket) {
          setCurrentMarket(selectedMarket as CustomMarket, true);
        }
      }
    }
  };
}

useRootStore.subscribe(
  (state) => state.account,
  (account) => {
    if (account) {
      useRootStore.getState().fetchConnectedWalletDomains();
    } else {
      useRootStore.getState().clearWalletDomains();
    }
  },
  { fireImmediately: true }
);
