// hooks/useDepositBalance.ts
"use client";
import { useAccount, useBalance } from "wagmi";
import { formatUnits } from "viem";

// Import your existing spot balance hook
import { useSpotBalance } from "../useSpotBalance";

export const useDepositBalance = (tokenAddress: string) => {
  const { address, isConnected } = useAccount();
  const { data: spotData, isLoading: spotLoading } = useSpotBalance();

  // Use wagmi for token balance (more reliable for approvals)
  const balanceQuery =
    tokenAddress === "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"
      ? useBalance({ address, query: { enabled: isConnected && !!address } })
      : useBalance({
          address,
          token: tokenAddress as `0x${string}`,
          query: { enabled: isConnected && !!address },
        });

  const balance = balanceQuery.data
    ? parseFloat(
        formatUnits(balanceQuery.data.value, balanceQuery.data.decimals)
      )
    : 0;

  // Get decimals from the balance query
  const decimals = balanceQuery.data?.decimals || 18; // Default to 18 for ETH/most tokens

  // Get token price from spot balance data
  const tokenPrice =
    tokenAddress === "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"
      ? spotData?.ethBalance.price || 0
      : spotData?.tokens.find(
          (t) => t.contractAddress.toLowerCase() === tokenAddress.toLowerCase()
        )?.price || 1; // Default to $1 for stablecoins

  // Validate wallet connection
  const isWalletValid =
    isConnected &&
    address &&
    address !== "0x0000000000000000000000000000000000000000" &&
    address.startsWith("0x") &&
    address.length === 42;

  console.log("useDepositBalance debug:", {
    tokenAddress,
    address,
    isConnected,
    isWalletValid,
    balance,
    decimals,
    tokenPrice,
    balanceQueryLoading: balanceQuery.isLoading,
    spotLoading,
  });

  return {
    balance: isWalletValid ? balance : 0,
    formattedBalance: isWalletValid ? balance.toFixed(5) : "0.00000",
    rawBalance: balanceQuery.data?.value || BigInt(0),
    decimals, // ✅ Added decimals
    isLoading: balanceQuery.isLoading || spotLoading,
    error: balanceQuery.error,
    tokenPrice,
    isWalletValid,
  };
};
