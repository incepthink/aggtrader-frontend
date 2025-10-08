import {
  createContext,
  useContext,
  ReactNode,
  useMemo,
  useCallback,
} from "react";
import { useAccount } from "wagmi";
import { useYearn } from "./useYearn";
import { useWeb3 } from "./useWeb3";
import { useBalancesWithQuery } from "../hooks/useBalancesWithQuery";
import { useYearnTokens } from "./useYearn.helper";
import type { TAddress } from "../types/address";
import type { TNormalizedBN, TNumberish } from "../types/mixed";
import { toAddress } from "../utils/tools.address";
import type { TChainTokens } from "../types/mixed";
import { formatUnits, parseUnits as vParseUnits } from "viem";

export const toBigInt = (amount?: TNumberish): bigint => {
  return BigInt(amount || 0);
};

export function toNormalizedBN(
  value: TNumberish,
  decimals: number
): TNormalizedBN {
  return {
    raw: toBigInt(value),
    normalized: Number(formatUnits(toBigInt(value), decimals ?? 18)),
    display: formatUnits(toBigInt(value), decimals ?? 18),
  };
}
export const zeroNormalizedBN: TNormalizedBN = toNormalizedBN(0, 18);

type TUseWallet = {
  cumulatedValueInV3Vaults: number;
  isLoading: boolean;
  getBalance: (params: { address: string; chainID: number }) => TNormalizedBN;
  balances: TChainTokens;
  onRefresh: () => Promise<TChainTokens>;
};

const WalletContext = createContext<TUseWallet | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const { address } = useAccount();
  const { isActive, chainID } = useWeb3();
  const {
    vaults,
    vaultsMigrations,
    vaultsRetired,
    isLoadingVaultList,
    getPrice,
  } = useYearn();

  const allTokens = useYearnTokens({
    vaults,
    vaultsMigrations,
    vaultsRetired,
    isLoadingVaultList,
  });

  const {
    data: balances,
    onUpdate,
    isLoading,
  } = useBalancesWithQuery({
    tokens: allTokens,
    priorityChainID: chainID,
  });

  const getBalance = useCallback(
    ({
      address: vaultAddress,
      chainID,
    }: {
      address: string;
      chainID: number;
    }): TNormalizedBN => {
      return (
        balances?.[chainID]?.[toAddress(vaultAddress)]?.balance ||
        zeroNormalizedBN
      );
    },
    [balances]
  );

  const onRefresh = useCallback(async (): Promise<TChainTokens> => {
    return await onUpdate(true);
  }, [onUpdate]);

  const cumulatedValueInV3Vaults = useMemo(() => {
    if (!isActive || !address) return 0;

    let total = 0;
    const allVaults = [...vaults, ...vaultsMigrations, ...vaultsRetired];

    for (const vault of allVaults) {
      // Get vault balance
      const balance = getBalance({
        address: vault.address,
        chainID: vault.chainID,
      });

      // Get vault price
      const price = getPrice({
        address: vault.address as any,
        chainID: vault.chainID,
      });

      // Calculate vault value
      const vaultValue = balance.normalized * price.normalized;
      total += vaultValue;

      // Check for staking balance
      if (vault?.staking?.available && vault?.staking?.address) {
        const stakingBalance = getBalance({
          address: vault.staking.address,
          chainID: vault.chainID,
        });
        const stakingValue = stakingBalance.normalized * price.normalized;
        total += stakingValue;
      }
    }

    return total;
  }, [
    vaults,
    vaultsMigrations,
    vaultsRetired,
    address,
    isActive,
    getPrice,
    getBalance,
  ]);

  const value: TUseWallet = {
    cumulatedValueInV3Vaults,
    isLoading: isLoadingVaultList || isLoading,
    getBalance,
    balances,
    onRefresh,
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
