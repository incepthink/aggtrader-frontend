"use client";
import { useAccount, useBalance } from "wagmi";
import { formatUnits } from "viem";

export const useTokenBalance = (tokenAddress: string) => {
  const { address } = useAccount();

  const balanceQuery =
    tokenAddress === "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"
      ? useBalance({ address })
      : useBalance({
          address,
          token: tokenAddress as `0x${string}`,
        });

  const balance = balanceQuery.data
    ? parseFloat(
        formatUnits(balanceQuery.data.value, balanceQuery.data.decimals)
      )
    : 0;

  return {
    balance,
    formattedBalance: balance.toFixed(5),
    rawBalance: balanceQuery.data?.value || 0,
    isLoading: balanceQuery.isLoading,
    error: balanceQuery.error,
  };
};
