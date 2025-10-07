"use client";

import { createContext, useContext, ReactNode, useMemo } from "react";
import { useAccount } from "wagmi";
import { useYearn } from "./useYearn";
import { useWeb3 } from "./useWeb3";

type TUseWallet = {
  cumulatedValueInV3Vaults: number;
  isLoading: boolean;
  getBalance: (params: { address: string; chainID: number }) => {
    raw: bigint;
    normalized: number;
  };
};

const WalletContext = createContext<TUseWallet | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const { address } = useAccount();
  const { isActive } = useWeb3();
  const { vaults, isLoadingVaultList, getPrice } = useYearn();

  // For now, return mock balances
  // TODO: Implement real balance fetching using wagmi's useBalance or multicall
  const getBalance = ({
    address: vaultAddress,
    chainID,
  }: {
    address: string;
    chainID: number;
  }) => {
    // Mock: User has no balance
    return { raw: BigInt(0), normalized: 0 };
  };

  const cumulatedValueInV3Vaults = useMemo(() => {
    if (!isActive || !address) return 0;

    // Calculate total portfolio value
    let total = 0;
    for (const vault of vaults) {
      const balance = getBalance({
        address: vault.address,
        chainID: vault.chainID,
      });
      const price = getPrice({
        address: vault.address,
        chainID: vault.chainID,
      });
      total += balance.normalized * price.normalized;
    }
    return total;
  }, [vaults, address, isActive, getPrice]);

  const value: TUseWallet = {
    cumulatedValueInV3Vaults,
    isLoading: isLoadingVaultList,
    getBalance,
  };

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within WalletProvider");
  }
  return context;
}
