"use client";

import React, {
  createContext,
  useContext,
  ReactNode,
  useEffect,
  useState,
  useCallback,
} from "react";
import {
  useAccount,
  useReadContracts,
  useReadContract,
  useSendTransaction,
  useWaitForTransactionReceipt,
} from "wagmi";
import type { TYDaemonVault } from "@/lib/yearnfi/lib/utils/schemas/yDaemonVaultsSchemas";
import { VAULT_V3_ABI } from "@/lib/yearnfi/lib/abis/vaultV3.abi";
import { ERC20_ABI } from "@/lib/yearnfi/lib/abis/erc20.abi";
import { checkAllowance } from "@/lib/yearnfi/lib/utils/wagmi/transactions";
import { toNormalizedBN } from "@/lib/yearnfi/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  fetchDepositFromBackend,
  fetchWithdrawFromBackend,
} from "@/services/yearn/yearnApi";
import { formatUnits } from "viem";

type TNormalizedBN = {
  raw: bigint;
  normalized: number;
};

type TVaultActionsContext = {
  maxDepositPossible: TNormalizedBN;
  maxWithdrawPossible: TNormalizedBN;
  userTokenBalance: TNormalizedBN;
  userVaultBalance: TNormalizedBN;
  allowance: TNormalizedBN;
  needsApproval: boolean;
  isLoading: boolean;
  amount: string;
  onChangeAmount: (value: string) => void;
  isDepositing: boolean;
  onToggleFlow: () => void;
  expectedOut: TNormalizedBN;
  isLoadingPreview: boolean;
  onApprove: () => Promise<void>;
  isApproving: boolean;
  onDeposit: () => Promise<void>;
  isDepositingTx: boolean;
  onWithdraw: () => Promise<void>;
  isWithdrawingTx: boolean;
};

const VaultActionsContext = createContext<TVaultActionsContext | undefined>(
  undefined
);

export function VaultActionsProvider({
  children,
  vault,
}: {
  children: ReactNode;
  vault: TYDaemonVault;
}) {
  const { address, isConnected } = useAccount();
  const { toast } = useToast();

  const tokenDecimals = (vault.token as any).decimals ?? vault.decimals ?? 18;
  const vaultDecimals = vault.decimals ?? 18;

  const [allowance, setAllowance] = useState<TNormalizedBN>(
    toNormalizedBN(BigInt(0), tokenDecimals)
  );
  const [amount, setAmount] = useState<string>("");
  const [isDepositingFlow, setIsDepositingFlow] = useState<boolean>(true);
  const [debouncedAmount, setDebouncedAmount] = useState<string>("");
  const [isApproving, setIsApproving] = useState<boolean>(false);
  const [isDepositingTx, setIsDepositingTx] = useState<boolean>(false);
  const [isWithdrawingTx, setIsWithdrawingTx] = useState<boolean>(false);

  // Wagmi hooks for transaction signing
  const { sendTransactionAsync } = useSendTransaction();
  const [pendingTxHash, setPendingTxHash] = useState<`0x${string}` | undefined>();

  const { isSuccess: isTxSuccess } = useWaitForTransactionReceipt({
    hash: pendingTxHash,
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedAmount(amount);
    }, 500);
    return () => clearTimeout(timer);
  }, [amount]);

  const { data, isLoading, refetch } = useReadContracts({
    contracts: [
      {
        address: vault.token.address as `0x${string}`,
        abi: ERC20_ABI,
        functionName: "balanceOf",
        args: address ? [address] : undefined,
        chainId: vault.chainID as any,
      },
      {
        address: vault.address as `0x${string}`,
        abi: VAULT_V3_ABI,
        functionName: "balanceOf",
        args: address ? [address] : undefined,
        chainId: vault.chainID as any,
      },
      {
        address: vault.address as `0x${string}`,
        abi: VAULT_V3_ABI,
        functionName: "maxDeposit",
        args: address ? [address] : undefined,
        chainId: vault.chainID as any,
      },
      {
        address: vault.address as `0x${string}`,
        abi: VAULT_V3_ABI,
        functionName: "maxRedeem",
        args: address ? [address, BigInt(1)] : undefined,
        chainId: vault.chainID as any,
      },
    ],
    query: {
      enabled: isConnected && !!address,
      refetchInterval: 10000,
    },
  });

  const fetchAllowanceData = useCallback(async () => {
    if (!address || !isConnected) {
      setAllowance(toNormalizedBN(BigInt(0), tokenDecimals));
      return;
    }
    try {
      const allowanceAmount = await checkAllowance({
        tokenAddress: vault.token.address as `0x${string}`,
        owner: address,
        spender: vault.address as `0x${string}`,
        chainId: vault.chainID,
      });
      setAllowance(toNormalizedBN(allowanceAmount, tokenDecimals));
    } catch (error) {
      console.error("Failed to fetch allowance:", error);
      setAllowance(toNormalizedBN(BigInt(0), tokenDecimals));
    }
  }, [
    address,
    isConnected,
    vault.token.address,
    vault.address,
    vault.chainID,
    tokenDecimals,
  ]);

  useEffect(() => {
    fetchAllowanceData();
  }, [fetchAllowanceData]);

  const userTokenBalance = data?.[0]?.result
    ? toNormalizedBN(data[0].result as bigint, tokenDecimals)
    : toNormalizedBN(BigInt(0), tokenDecimals);

  const userVaultBalance = data?.[1]?.result
    ? toNormalizedBN(data[1].result as bigint, vaultDecimals)
    : toNormalizedBN(BigInt(0), vaultDecimals);

  const vaultMaxDeposit = data?.[2]?.result
    ? toNormalizedBN(data[2].result as bigint, tokenDecimals)
    : toNormalizedBN(BigInt(0), tokenDecimals);

  const vaultMaxRedeem = data?.[3]?.result
    ? toNormalizedBN(data[3].result as bigint, vaultDecimals)
    : toNormalizedBN(BigInt(0), vaultDecimals);

  const maxDepositPossible: TNormalizedBN = {
    raw:
      userTokenBalance.raw < vaultMaxDeposit.raw
        ? userTokenBalance.raw
        : vaultMaxDeposit.raw,
    normalized:
      userTokenBalance.normalized < vaultMaxDeposit.normalized
        ? userTokenBalance.normalized
        : vaultMaxDeposit.normalized,
  };

  const maxWithdrawPossible: TNormalizedBN = {
    raw:
      userVaultBalance.raw < vaultMaxRedeem.raw
        ? userVaultBalance.raw
        : vaultMaxRedeem.raw,
    normalized:
      userVaultBalance.normalized < vaultMaxRedeem.normalized
        ? userVaultBalance.normalized
        : vaultMaxRedeem.normalized,
  };

  const amountBigInt =
    debouncedAmount && parseFloat(debouncedAmount) > 0
      ? BigInt(
          Math.floor(
            parseFloat(debouncedAmount) *
              Math.pow(10, isDepositingFlow ? tokenDecimals : vaultDecimals)
          )
        )
      : BigInt(0);

  const { data: previewData, isLoading: isLoadingPreview } = useReadContract({
    address: vault.address as `0x${string}`,
    abi: VAULT_V3_ABI,
    functionName: isDepositingFlow ? "previewDeposit" : "previewRedeem",
    args: [amountBigInt],
    chainId: vault.chainID as any,
    query: {
      enabled: amountBigInt > BigInt(0),
    },
  });

  const expectedOut: TNormalizedBN = previewData
    ? toNormalizedBN(
        previewData as bigint,
        isDepositingFlow ? vaultDecimals : tokenDecimals
      )
    : toNormalizedBN(
        BigInt(0),
        isDepositingFlow ? vaultDecimals : tokenDecimals
      );

  const needsApproval = amountBigInt > allowance.raw && isDepositingFlow;

  const onChangeAmount = useCallback((value: string) => {
    setAmount(value);
  }, []);

  const onToggleFlow = useCallback(() => {
    setIsDepositingFlow((prev) => !prev);
    setAmount("");
  }, []);

  // onApprove is now integrated into onDeposit
  // Keeping this as a placeholder function for backward compatibility
  const onApprove = useCallback(async () => {
    toast({
      title: "Not Required",
      description: "Approval is now handled automatically during deposit",
    });
  }, [toast]);

  const onDeposit = useCallback(async () => {
    if (!address || amountBigInt === BigInt(0) || !sendTransactionAsync) return;

    setIsDepositingTx(true);
    toast({
      title: "Preparing Deposit",
      description: "Fetching transaction from backend...",
    });

    try {
      console.log("=== YEARN DEPOSIT: Fetching from backend ===");
      console.log("vaultAddress:", vault.address);
      console.log("amount:", amount);
      console.log("receiverAddress:", address);

      // Call backend to prepare transaction
      const response = await fetchDepositFromBackend({
        vaultAddress: vault.address as `0x${string}`,
        tokenAddress: vault.token.address as `0x${string}`,
        amount: amount, // Human-readable amount
        decimals: tokenDecimals,
        receiverAddress: address,
        userAddress: address,
        chainId: vault.chainID,
      });

      console.log("Backend response:", response);

      // If approval needed, sign it first
      if (response.data.approval) {
        console.log("=== APPROVAL NEEDED ===");
        toast({
          title: "Approval Required",
          description: "Please approve the token spending...",
        });

        const approvalHash = await sendTransactionAsync({
          to: response.data.approval.to,
          data: response.data.approval.data as `0x${string}`,
          value: BigInt(response.data.approval.value),
        });

        console.log("Approval tx hash:", approvalHash);
        setPendingTxHash(approvalHash);

        toast({
          title: "Approval Sent",
          description: "Waiting for confirmation...",
        });

        // Wait a bit for approval to be mined (simple approach)
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }

      // Sign deposit transaction
      console.log("=== SIGNING DEPOSIT ===");
      toast({
        title: "Deposit Pending",
        description: "Please confirm the deposit transaction...",
      });

      const depositHash = await sendTransactionAsync({
        to: response.data.deposit.to,
        data: response.data.deposit.data as `0x${string}`,
        value: BigInt(response.data.deposit.value),
      });

      console.log("Deposit tx hash:", depositHash);
      setPendingTxHash(depositHash);

      toast({
        title: "Deposit Successful",
        description: `Successfully deposited ${amount} ${vault.token.symbol}`,
        variant: "success",
      });

      setAmount("");
      await refetch();
      await fetchAllowanceData();
    } catch (error: any) {
      console.error("=== DEPOSIT ERROR ===", error);

      const errorMessage =
        error?.message?.includes("User rejected") || error?.message?.includes("User denied")
          ? "Transaction cancelled by user"
          : error?.message || "Deposit failed";

      toast({
        title: "Deposit Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsDepositingTx(false);
    }
  }, [
    address,
    amountBigInt,
    amount,
    vault.address,
    vault.token.address,
    vault.token.symbol,
    vault.chainID,
    tokenDecimals,
    refetch,
    fetchAllowanceData,
    toast,
    sendTransactionAsync,
  ]);

  const onWithdraw = useCallback(async () => {
    if (!address || amountBigInt === BigInt(0) || !sendTransactionAsync) return;

    setIsWithdrawingTx(true);
    toast({
      title: "Preparing Withdrawal",
      description: "Fetching transaction from backend...",
    });

    try {
      console.log("=== YEARN WITHDRAW: Fetching from backend ===");
      console.log("vaultAddress:", vault.address);
      console.log("shares:", amount);
      console.log("receiverAddress:", address);
      console.log("ownerAddress:", address);

      // Call backend to prepare withdrawal transaction
      const response = await fetchWithdrawFromBackend({
        vaultAddress: vault.address as `0x${string}`,
        shares: amount, // Human-readable shares amount
        decimals: vaultDecimals,
        receiverAddress: address,
        ownerAddress: address,
        maxLoss: "1", // 0.01% max loss
        chainId: vault.chainID,
      });

      console.log("Backend response:", response);

      // Sign withdrawal transaction
      console.log("=== SIGNING WITHDRAWAL ===");
      toast({
        title: "Withdrawal Pending",
        description: "Please confirm the withdrawal transaction...",
      });

      const withdrawHash = await sendTransactionAsync({
        to: response.data.to,
        data: response.data.data as `0x${string}`,
        value: BigInt(response.data.value),
      });

      console.log("Withdrawal tx hash:", withdrawHash);
      setPendingTxHash(withdrawHash);

      toast({
        title: "Withdrawal Successful",
        description: `Successfully withdrew ${amount} ${vault.symbol}`,
        variant: "success",
      });

      setAmount("");
      await refetch();
    } catch (error: any) {
      console.error("=== WITHDRAWAL ERROR ===", error);

      const errorMessage =
        error?.message?.includes("User rejected") || error?.message?.includes("User denied")
          ? "Transaction cancelled by user"
          : error?.message || "Withdrawal failed";

      toast({
        title: "Withdrawal Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsWithdrawingTx(false);
    }
  }, [
    address,
    amountBigInt,
    amount,
    vault.address,
    vault.symbol,
    vault.chainID,
    vaultDecimals,
    refetch,
    toast,
    sendTransactionAsync,
  ]);

  const value: TVaultActionsContext = {
    maxDepositPossible,
    maxWithdrawPossible,
    userTokenBalance,
    userVaultBalance,
    allowance,
    needsApproval,
    isLoading,
    amount,
    onChangeAmount,
    isDepositing: isDepositingFlow,
    onToggleFlow,
    expectedOut,
    isLoadingPreview,
    onApprove,
    isApproving,
    onDeposit,
    isDepositingTx,
    onWithdraw,
    isWithdrawingTx,
  };

  return (
    <VaultActionsContext.Provider value={value}>
      {children}
    </VaultActionsContext.Provider>
  );
}

export function useVaultActions() {
  const context = useContext(VaultActionsContext);
  if (!context) {
    throw new Error("useVaultActions must be used within VaultActionsProvider");
  }
  return context;
}
