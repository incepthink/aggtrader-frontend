"use client";

import React, {
  createContext,
  useContext,
  ReactNode,
  useEffect,
  useState,
  useCallback,
} from "react";
import { useAccount, useReadContracts, useReadContract } from "wagmi";
import type { TYDaemonVault } from "@/lib/yearnfi/lib/utils/schemas/yDaemonVaultsSchemas";
import { VAULT_V3_ABI } from "@/lib/yearnfi/lib/abis/vaultV3.abi";
import { ERC20_ABI } from "@/lib/yearnfi/lib/abis/erc20.abi";
import {
  checkAllowance,
  approveERC20,
  depositToVault,
  withdrawFromVault,
} from "@/lib/yearnfi/lib/utils/wagmi/transactions";
import { toNormalizedBN } from "@/lib/yearnfi/lib/utils";
import { useToast } from "@/hooks/use-toast";

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

  const onApprove = useCallback(async () => {
    if (!address) return;

    setIsApproving(true);
    toast({
      title: "Approval Pending",
      description: "Please confirm the transaction in your wallet...",
    });

    try {
      const result = await approveERC20({
        tokenAddress: vault.token.address as `0x${string}`,
        spenderAddress: vault.address as `0x${string}`,
        amount: BigInt(
          "115792089237316195423570985008687907853269984665640564039457584007913129639935"
        ),
        chainId: vault.chainID,
      });

      if (result.isSuccessful) {
        toast({
          title: "Approval Successful",
          description: `You can now deposit ${vault.token.symbol}`,
        });
        await fetchAllowanceData();
        await refetch();
      } else {
        toast({
          title: "Approval Failed",
          description: result.error?.message || "Transaction failed",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Approval Failed",
        description: error?.message || "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsApproving(false);
    }
  }, [
    address,
    vault.token.address,
    vault.token.symbol,
    vault.address,
    vault.chainID,
    fetchAllowanceData,
    refetch,
    toast,
  ]);

  const onDeposit = useCallback(async () => {
    if (!address || amountBigInt === BigInt(0)) return;

    setIsDepositingTx(true);
    toast({
      title: "Deposit Pending",
      description: "Please confirm the transaction in your wallet...",
    });

    try {
      const result = await depositToVault({
        vaultAddress: vault.address as `0x${string}`,
        amount: amountBigInt,
        receiver: address,
        chainId: vault.chainID,
      });

      if (result.isSuccessful) {
        toast({
          title: "Deposit Successful",
          description: `Successfully deposited ${amount} ${vault.token.symbol}`,
          variant: "success",
        });
        setAmount("");
        await refetch();
        await fetchAllowanceData();
      } else {
        toast({
          title: "Deposit Failed",
          description: result.error?.message || "Transaction failed",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Deposit Failed",
        description: error?.message || "An error occurred",
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
    vault.token.symbol,
    vault.chainID,
    refetch,
    fetchAllowanceData,
    toast,
  ]);

  const onWithdraw = useCallback(async () => {
    if (!address || amountBigInt === BigInt(0)) return;

    setIsWithdrawingTx(true);
    toast({
      title: "Withdrawal Pending",
      description: "Please confirm the transaction in your wallet...",
    });

    try {
      const result = await withdrawFromVault({
        vaultAddress: vault.address as `0x${string}`,
        shares: amountBigInt,
        receiver: address,
        owner: address,
        maxLoss: BigInt(1), // 0.01% max loss
        chainId: vault.chainID,
      });

      if (result.isSuccessful) {
        toast({
          title: "Withdrawal Successful",
          description: `Successfully withdrew ${amount} ${vault.symbol}`,
          variant: "success",
        });
        setAmount("");
        await refetch();
      } else {
        toast({
          title: "Withdrawal Failed",
          description: result.error?.message || "Transaction failed",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Withdrawal Failed",
        description: error?.message || "An error occurred",
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
    refetch,
    toast,
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
