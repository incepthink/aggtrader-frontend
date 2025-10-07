import { useReadContracts, useBlockNumber } from "wagmi";
import { useEffect } from "react";
import type { TYDaemonVault } from "@/lib/yearnfi/lib/utils/schemas/yDaemonVaultsSchemas";
import { VAULT_V3_ABI } from "@/lib/yearnfi/lib/abis/vaultV3.abi";

type UseVaultBalanceParams = {
  vault: TYDaemonVault;
  userAddress?: string;
};

type UseVaultBalanceReturn = {
  vaultBalance: bigint;
  vaultBalanceInTokens: bigint;
  pricePerShare: bigint;
  isLoading: boolean;
  refetch: () => void;
};

export function useVaultBalance({
  vault,
  userAddress,
}: UseVaultBalanceParams): UseVaultBalanceReturn {
  const { data: blockNumber } = useBlockNumber({ watch: true });

  const {
    data,
    isLoading,
    refetch,
  } = useReadContracts({
    contracts: [
      {
        address: vault.address as `0x${string}`,
        abi: VAULT_V3_ABI,
        functionName: "balanceOf",
        args: userAddress ? [userAddress as `0x${string}`] : undefined,
        chainId: vault.chainID,
      },
      {
        address: vault.address as `0x${string}`,
        abi: VAULT_V3_ABI,
        functionName: "pricePerShare",
        chainId: vault.chainID,
      },
    ],
    query: {
      enabled: !!userAddress,
    },
  });

  // Refetch on new blocks (throttled for Base chain)
  useEffect(() => {
    if (!userAddress) return;

    if (vault.chainID === 8453) {
      // Base chain - update every 10 blocks
      if (blockNumber && Number(blockNumber) % 10 === 0) {
        refetch();
      }
    } else {
      // Other chains - update every block
      refetch();
    }
  }, [blockNumber, vault.chainID, userAddress, refetch]);

  const vaultBalance = data?.[0]?.result
    ? (data[0].result as bigint)
    : BigInt(0);
  const pricePerShare = data?.[1]?.result
    ? (data[1].result as bigint)
    : BigInt(0);

  // Calculate balance in underlying tokens
  const vaultBalanceInTokens =
    pricePerShare > 0
      ? (vaultBalance * pricePerShare) / BigInt(10 ** vault.decimals)
      : BigInt(0);

  return {
    vaultBalance,
    vaultBalanceInTokens,
    pricePerShare,
    isLoading,
    refetch,
  };
}