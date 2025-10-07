"use client";

import { ReactNode } from "react";
import { Web3Provider } from "./useWeb3";
import { YearnProvider } from "./useYearn";
import { WalletProvider } from "./useWallet";

export function VaultProviders({ children }: { children: ReactNode }) {
  return (
    <Web3Provider>
      <YearnProvider>
        <WalletProvider>{children}</WalletProvider>
      </YearnProvider>
    </Web3Provider>
  );
}
