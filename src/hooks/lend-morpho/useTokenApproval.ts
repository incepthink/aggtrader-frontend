// /hooks/lend-morpho/useTokenApproval.ts
"use client";

import { useState, useEffect } from "react";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { parseUnits, Address, erc20Abi } from "viem";

interface ApprovalParams {
  tokenAddress: Address;
  spenderAddress: Address;
  amount: string;
  decimals: number;
}

interface ApprovalResult {
  isApproved: boolean;
  isLoading: boolean;
  error: string | null;
  approve: (params: ApprovalParams) => Promise<boolean>;
  checkApproval: (
    params: Omit<ApprovalParams, "amount"> & { amount: string }
  ) => Promise<void>;
  reset: () => void;
}

const MORPHO_BLUE_ADDRESS = "0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb";

export function useTokenApproval(): ApprovalResult {
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
  }: Omit<ApprovalParams, "amount"> & { amount: string }) => {
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

      setIsApproved(allowance >= amountBN);
    } catch (err) {
      console.error("Error checking approval:", err);
      setIsApproved(false);
    }
  };

  const approve = async ({
    tokenAddress,
    spenderAddress,
    amount,
    decimals,
  }: ApprovalParams) => {
    if (!address || !walletClient || !publicClient) {
      setError("Wallet not connected");
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const amountBN = parseUnits(amount, decimals);

      // Approve the token spending
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
        console.log("Approval successful:", hash);
      } else {
        throw new Error("Approval transaction failed");
      }
      return true;
    } catch (err: any) {
      console.error("Approval error:", err);

      if (err.message?.includes("User rejected")) {
        setError("Approval was rejected");
      } else {
        setError(err.message || "Approval failed");
      }
      return false;
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
