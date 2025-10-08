import { useReadContracts, useBlockNumber } from "wagmi";
import { useEffect, useState } from "react";
import type { TYDaemonVault } from "@/lib/yearnfi/lib/utils/schemas/yDaemonVaultsSchemas";
import { STAKING_REWARDS_ABI } from "@/lib/yearnfi/lib/abis/stakingRewards.abi";
import { ERC20_ABI } from "@/lib/yearnfi/lib/abis/erc20.abi";
import { toNormalizedBN } from "@/lib/yearnfi/lib/utils";

type UseStakingRewardsParams = {
  vault: TYDaemonVault;
  userAddress?: string;
};

type UseStakingRewardsReturn = {
  stakedBalance: bigint;
  earnedRewards: bigint;
  rewardTokenSymbol: string;
  rewardTokenDecimals: number;
  hasActiveRewards: boolean;
  isLoading: boolean;
  refetch: () => void;
};

export function useStakingRewards({
  vault,
  userAddress,
}: UseStakingRewardsParams): UseStakingRewardsReturn {
  const { data: blockNumber } = useBlockNumber({ watch: true });
  const [rewardTokenData, setRewardTokenData] = useState({
    symbol: "",
    decimals: 18,
  });

  const hasStaking = Boolean(vault.staking.available && vault.staking.address);

  // First, get reward token address
  const { data: rewardTokenAddress } = useReadContracts({
    contracts: [
      {
        address: (vault.staking.address as `0x${string}`) || "0x0",
        abi: STAKING_REWARDS_ABI,
        functionName: "rewardsToken",
        chainId: vault.chainID,
      },
    ],
    query: {
      enabled: hasStaking,
    },
  });

  // Then get reward token details
  const { data: tokenDetails } = useReadContracts({
    contracts: [
      {
        address: (rewardTokenAddress?.[0]?.result as `0x${string}`) || "0x0",
        abi: ERC20_ABI,
        functionName: "symbol",
        chainId: vault.chainID,
      },
      {
        address: (rewardTokenAddress?.[0]?.result as `0x${string}`) || "0x0",
        abi: ERC20_ABI,
        functionName: "decimals",
        chainId: vault.chainID,
      },
    ],
    query: {
      enabled: Boolean(rewardTokenAddress?.[0]?.result),
    },
  });

  // Update reward token data when available
  useEffect(() => {
    if (tokenDetails?.[0]?.result && tokenDetails?.[1]?.result) {
      setRewardTokenData({
        symbol: tokenDetails[0].result as string,
        decimals: Number(tokenDetails[1].result),
      });
    }
  }, [tokenDetails]);

  // Get user staking data
  const {
    data: stakingData,
    isLoading,
    refetch,
  } = useReadContracts({
    contracts: [
      {
        address: (vault.staking.address as `0x${string}`) || "0x0",
        abi: STAKING_REWARDS_ABI,
        functionName: "balanceOf",
        args: userAddress ? [userAddress as `0x${string}`] : undefined,
        chainId: vault.chainID,
      },
      {
        address: (vault.staking.address as `0x${string}`) || "0x0",
        abi: STAKING_REWARDS_ABI,
        functionName: "earned",
        args: userAddress ? [userAddress as `0x${string}`] : undefined,
        chainId: vault.chainID,
      },
      {
        address: (vault.staking.address as `0x${string}`) || "0x0",
        abi: STAKING_REWARDS_ABI,
        functionName: "periodFinish",
        chainId: vault.chainID,
      },
    ],
    query: {
      enabled: Boolean(hasStaking && userAddress),
    },
  });

  // Refetch on new blocks (throttled for Base chain)
  useEffect(() => {
    if (!userAddress || !hasStaking) return;

    if (vault.chainID === 8453) {
      // Base chain - update every 10 blocks
      if (blockNumber && Number(blockNumber) % 10 === 0) {
        refetch();
      }
    } else {
      // Other chains - update every block
      refetch();
    }
  }, [blockNumber, vault.chainID, userAddress, hasStaking, refetch]);

  const stakedBalance = stakingData?.[0]?.result
    ? (stakingData[0].result as bigint)
    : BigInt(0);
  const earnedRewards = stakingData?.[1]?.result
    ? (stakingData[1].result as bigint)
    : BigInt(0);
  const periodFinish = stakingData?.[2]?.result
    ? Number(stakingData[2].result)
    : 0;

  const hasActiveRewards = periodFinish > Math.floor(Date.now() / 1000);

  return {
    stakedBalance,
    earnedRewards,
    rewardTokenSymbol: rewardTokenData.symbol,
    rewardTokenDecimals: rewardTokenData.decimals,
    hasActiveRewards,
    isLoading,
    refetch,
  };
}