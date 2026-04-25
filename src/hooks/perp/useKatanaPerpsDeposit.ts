"use client";

import { useCallback, useState } from "react";
import { useAccount, useChainId, usePublicClient, useWalletClient } from "wagmi";
import { erc20Abi, parseUnits } from "viem";
import { useQueryClient } from "@tanstack/react-query";
import { useKumaBalance } from "./useKumaBalance";
import {
  KATANA_CHAIN_ID,
  KATANA_PERPS_EXCHANGE_ADDRESS,
  KATANA_PERPS_EXCHANGE_DEPOSIT_ABI,
  VB_USDC_ADDRESS,
  VB_USDC_DECIMALS,
} from "@/utils/perp/katanaPerpsConstants";

export type DepositStep = "idle" | "approving" | "depositing" | "success";

interface UseKatanaPerpsDepositReturn {
  deposit: (amount: string) => Promise<boolean>;
  isSubmitting: boolean;
  error: string | null;
  txHash: `0x${string}` | null;
  step: DepositStep;
  reset: () => void;
}

const parseDepositError = (err: any, fallback: string): string => {
  const raw = (err?.shortMessage || err?.message || "").toString();
  if (!raw) return fallback;
  if (raw.includes("User rejected") || raw.includes("User denied")) {
    return "Transaction was rejected";
  }
  if (raw.toLowerCase().includes("insufficient funds")) {
    return "Insufficient ETH for gas";
  }
  return raw.length > 160 ? fallback : raw;
};

export function useKatanaPerpsDeposit(): UseKatanaPerpsDepositReturn {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const queryClient = useQueryClient();
  const { refetch: refetchPerpBalance } = useKumaBalance();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);
  const [step, setStep] = useState<DepositStep>("idle");

  const reset = useCallback(() => {
    setIsSubmitting(false);
    setError(null);
    setTxHash(null);
    setStep("idle");
  }, []);

  const deposit = useCallback(
    async (amount: string): Promise<boolean> => {
      if (!isConnected || !address || !walletClient || !publicClient) {
        setError("Wallet not connected");
        return false;
      }
      if (chainId !== KATANA_CHAIN_ID) {
        setError("Please switch to Katana network");
        return false;
      }

      const parsed = Number(amount);
      if (!amount || Number.isNaN(parsed) || parsed <= 0) {
        setError("Enter a valid amount");
        return false;
      }

      let amountBn: bigint;
      try {
        amountBn = parseUnits(amount, VB_USDC_DECIMALS);
      } catch {
        setError("Enter a valid amount");
        return false;
      }

      setIsSubmitting(true);
      setError(null);
      setTxHash(null);

      try {
        const allowance = (await publicClient.readContract({
          address: VB_USDC_ADDRESS,
          abi: erc20Abi,
          functionName: "allowance",
          args: [address, KATANA_PERPS_EXCHANGE_ADDRESS],
        })) as bigint;

        if (allowance < amountBn) {
          setStep("approving");
          const approveHash = await walletClient.writeContract({
            address: VB_USDC_ADDRESS,
            abi: erc20Abi,
            functionName: "approve",
            args: [KATANA_PERPS_EXCHANGE_ADDRESS, amountBn],
          });
          const approveReceipt = await publicClient.waitForTransactionReceipt({
            hash: approveHash,
            confirmations: 1,
          });
          if (approveReceipt.status !== "success") {
            throw new Error("Approval transaction failed");
          }
        }

        setStep("depositing");
        const depositHash = await walletClient.writeContract({
          address: KATANA_PERPS_EXCHANGE_ADDRESS,
          abi: KATANA_PERPS_EXCHANGE_DEPOSIT_ABI,
          functionName: "deposit",
          args: [amountBn, address],
        });
        setTxHash(depositHash);

        const depositReceipt = await publicClient.waitForTransactionReceipt({
          hash: depositHash,
          confirmations: 1,
        });
        if (depositReceipt.status !== "success") {
          throw new Error("Deposit transaction failed");
        }

        setStep("success");
        refetchPerpBalance();
        queryClient.invalidateQueries({ queryKey: ["balance"] });
        queryClient.invalidateQueries({
          queryKey: ["katana-perps-balance", address],
        });
        return true;
      } catch (err: any) {
        setError(parseDepositError(err, "Deposit failed"));
        setStep("idle");
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      address,
      chainId,
      isConnected,
      publicClient,
      queryClient,
      refetchPerpBalance,
      walletClient,
    ],
  );

  return { deposit, isSubmitting, error, txHash, step, reset };
}
