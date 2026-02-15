"use client";

import { useQuery } from "@tanstack/react-query";
import { useAccount } from "wagmi";

/**
 * Deposit data from Katana Perps API
 */
export interface KatanaPerpsDeposit {
  depositId: string;
  asset: string;
  quantity: string;
  bridgeSource: string;
  time: number;
  bridgeTxId?: string;
  forwarderTxId?: string;
  katanaTxId: string;
}

/**
 * Withdrawal data from Katana Perps API
 */
export interface KatanaPerpsWithdrawal {
  withdrawalId: string;
  asset: string;
  quantity: string;
  gas: string;
  bridgeTarget: string;
  time: number;
  katanaTxId: string | null;
  katanaTxStatus: string;
}

/**
 * Combined deposit/withdrawal transaction type
 */
export interface DepositWithdrawalTransaction {
  id: string;
  type: "Deposit" | "Withdrawal";
  date: string;
  quantity: string;
  asset: string;
  chain: string;
  fee: string;
  status: string;
  time: number;
}

/**
 * Fetch deposits from the API
 */
async function fetchDeposits(wallet: string): Promise<KatanaPerpsDeposit[]> {
  const response = await fetch(`/api/kuma/deposits?wallet=${wallet}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch deposits");
  }

  return response.json();
}

/**
 * Fetch withdrawals from the API
 */
async function fetchWithdrawals(
  wallet: string
): Promise<KatanaPerpsWithdrawal[]> {
  const response = await fetch(`/api/kuma/withdrawals?wallet=${wallet}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch withdrawals");
  }

  return response.json();
}

/**
 * Hook to fetch deposits and withdrawals combined
 */
export function useKatanaPerpsDepositsWithdrawals() {
  const { address, isConnected } = useAccount();

  return useQuery({
    queryKey: ["katana-perps-deposits-withdrawals", address],
    queryFn: async () => {
      if (!address) return [];

      const [deposits, withdrawals] = await Promise.all([
        fetchDeposits(address),
        fetchWithdrawals(address),
      ]);

      // Combine and format deposits and withdrawals
      const transactions: DepositWithdrawalTransaction[] = [];

      // Add deposits
      deposits.forEach((deposit) => {
        transactions.push({
          id: deposit.depositId,
          type: "Deposit",
          date: new Date(deposit.time).toISOString().replace("T", " ").slice(0, 16),
          quantity: deposit.quantity,
          asset: deposit.asset,
          chain: deposit.bridgeSource || "Katana",
          fee: "0.00", // Deposits typically don't have fees
          status: "Completed",
          time: deposit.time,
        });
      });

      // Add withdrawals
      withdrawals.forEach((withdrawal) => {
        transactions.push({
          id: withdrawal.withdrawalId,
          type: "Withdrawal",
          date: new Date(withdrawal.time).toISOString().replace("T", " ").slice(0, 16),
          quantity: withdrawal.quantity,
          asset: withdrawal.asset,
          chain: withdrawal.bridgeTarget || "Katana",
          fee: withdrawal.gas,
          status: withdrawal.katanaTxStatus || "Pending",
          time: withdrawal.time,
        });
      });

      // Sort by time descending (most recent first)
      transactions.sort((a, b) => b.time - a.time);

      return transactions;
    },
    enabled: isConnected && !!address,
    staleTime: 30000, // 30 seconds
    gcTime: 300000, // 5 minutes
    refetchInterval: 60000, // Refetch every minute
  });
}

/**
 * Helper to format transaction for display
 */
export function formatTransactionForDisplay(
  transaction: DepositWithdrawalTransaction
) {
  const qty = parseFloat(transaction.quantity);

  return {
    ...transaction,
    formattedQuantity: `${qty.toFixed(6)} ${transaction.asset}`,
    formattedFee: `${parseFloat(transaction.fee).toFixed(6)} ${transaction.asset}`,
    statusColor:
      transaction.status === "Completed" || transaction.status === "Success"
        ? "#00FF88"
        : transaction.status === "Pending"
          ? "#FFA500"
          : "#FF4444",
  };
}
