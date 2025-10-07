"use client";

import { createContext, useContext, ReactNode } from "react";
import { useAccount, useSwitchChain } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";

type TUseWeb3 = {
  isActive: boolean;
  address?: string;
  openLoginModal: () => void;
  onSwitchChain: (chainId: number) => void;
};

const Web3Context = createContext<TUseWeb3 | undefined>(undefined);

export function Web3Provider({ children }: { children: ReactNode }) {
  const { address, isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { switchChain } = useSwitchChain();

  const value: TUseWeb3 = {
    isActive: isConnected,
    address,
    openLoginModal: () => openConnectModal?.(),
    onSwitchChain: (chainId: number) => switchChain?.({ chainId }),
  };

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
}

export function useWeb3() {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error("useWeb3 must be used within Web3Provider");
  }
  return context;
}
