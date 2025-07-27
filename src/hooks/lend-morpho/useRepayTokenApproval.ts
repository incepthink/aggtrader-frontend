// /hooks/lend-morpho/useRepayTokenApproval.ts
"use client";

import { useState, useEffect } from "react";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { parseUnits, Address, erc20Abi } from "viem";

interface RepayApprovalParams {
  tokenAddress: Address;
  spenderAddress: Address;
  amount: string;
  decimals: number;
}

interface RepayApprovalResult {
  isApproved: boolean;
  isLoading: boolean;
  error: string | null;
  approve: (params: RepayApprovalParams) => Promise<void>;
  checkApproval: (
    params: Omit<RepayApprovalParams, "amount"> & { amount: string }
  ) => Promise<void>;
  reset: () => void;
}

const MORPHO_BLUE_ADDRESS = "0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb";

export function useRepayTokenApproval(): RepayApprovalResult {
  const [isApproved, setIsApproved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const checkApproval = async ({
    tokenAddress,
    spenderAddress,
    amount,
    decimals,
  }: Omit<RepayApprovalParams, "amount"> & { amount: string }) => {
    if (!address || !publicClient || !amount || parseFloat(amount) === 0) {
      setIsApproved(true); // No approval needed if no amount
      return;
    }

    try {
      const amountBN = parseUnits(amount, decimals);

      const allowance = await publicClient.readContract({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: "allowance",
        args: [address, spenderAddress],
      });

      const needsApproval = allowance < amountBN;
      setIsApproved(!needsApproval);

      console.log("Repay token approval check:", {
        tokenAddress,
        amount: amountBN.toString(),
        allowance: allowance.toString(),
        needsApproval,
        isApproved: !needsApproval,
      });
    } catch (err) {
      console.error("Error checking repay token approval:", err);
      setIsApproved(false);
    }
  };

  const approve = async ({
    tokenAddress,
    spenderAddress,
    amount,
    decimals,
  }: RepayApprovalParams) => {
    if (!address || !walletClient || !publicClient) {
      setError("Wallet not connected");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const amountBN = parseUnits(amount, decimals);

      console.log("Approving repay token:", {
        tokenAddress,
        spenderAddress,
        amount: amountBN.toString(),
        user: address,
      });

      // Approve the token spending for repay
      const hash = await walletClient.writeContract({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: "approve",
        args: [spenderAddress, amountBN],
      });

      // Wait for confirmation
      const receipt = await publicClient.waitForTransactionReceipt({
        hash,
        confirmations: 1,
      });

      if (receipt.status === "success") {
        setIsApproved(true);
        console.log("Repay token approval successful:", hash);
      } else {
        throw new Error("Repay token approval transaction failed");
      }
    } catch (err: any) {
      console.error("Repay token approval error:", err);

      if (err.message?.includes("User rejected")) {
        setError("Approval was rejected");
      } else {
        setError(err.message || "Approval failed");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setIsApproved(false);
    setIsLoading(false);
    setError(null);
  };

  return {
    isApproved,
    isLoading,
    error,
    approve,
    checkApproval,
    reset,
  };
}
