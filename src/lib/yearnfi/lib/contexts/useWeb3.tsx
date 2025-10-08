"use client";

import {
  createContext,
  useContext,
  ReactNode,
  useMemo,
  useState,
  useCallback,
} from "react";
import { useAccount, useSwitchChain } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import type { TAddress } from "../types/address";
import { toAddress } from "../utils/tools.address";

type TWeb3Context = {
  isActive: boolean;
  address: TAddress | undefined;
  chainID: number;
  openLoginModal: () => void;
  onSwitchChain: (chainId: number) => void;
};

const Web3Context = createContext<TWeb3Context | undefined>(undefined);

export function Web3Provider({ children }: { children: ReactNode }) {
  const { address, isConnected, chain } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { switchChain } = useSwitchChain();
  const [currentChainID, setCurrentChainID] = useState<number>(chain?.id || 1);

  const onSwitchChain = useCallback(
    (chainId: number) => {
      setCurrentChainID(chainId);
      if (isConnected) {
        switchChain?.({ chainId });
      }
    },
    [isConnected, switchChain]
  );

  const value: TWeb3Context = useMemo(
    () => ({
      isActive: isConnected,
      address: address ? toAddress(address) : undefined,
      chainID: isConnected ? chain?.id || 1 : currentChainID,
      openLoginModal: () => openConnectModal?.(),
      onSwitchChain,
    }),
    [
      isConnected,
      address,
      chain?.id,
      currentChainID,
      openConnectModal,
      onSwitchChain,
    ]
  );

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
}

export function useWeb3() {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error("useWeb3 must be used within Web3Provider");
  }
  return context;
}
