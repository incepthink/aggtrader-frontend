import { useState, useEffect, useCallback } from "react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useBlockNumber } from "wagmi";
import { erc20Abi, parseUnits, Address, maxUint256 } from "viem";
import type { Token } from "../types";

export enum ApprovalState {
  LOADING = "LOADING",
  UNKNOWN = "UNKNOWN",
  NOT_APPROVED = "NOT_APPROVED",
  PENDING = "PENDING",
  APPROVED = "APPROVED",
}

interface UseTokenApprovalProps {
  token: Token;
  spender: Address | null;
  amount: string;
  enabled: boolean;
  approveMax?: boolean;
}

// Old ERC20 ABI (for USDT, etc) - returns void instead of bool
const OLD_ERC20_APPROVE_ABI = [
  {
    constant: false,
    inputs: [
      { name: "_spender", type: "address" },
      { name: "_value", type: "uint256" },
    ],
    name: "approve",
    outputs: [],
    type: "function",
  },
] as const;

export function useTokenApproval({
  token,
  spender,
  amount,
  enabled,
  approveMax = false,
}: UseTokenApprovalProps) {
  const { address, chainId } = useAccount();
  const [pending, setPending] = useState(false);
  const [useFallbackAbi, setUseFallbackAbi] = useState(false);

  // Native ETH doesn't need approval
  const isNativeETH = token.address.toLowerCase() === "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";

  // Watch block number for auto-refetch
  const { data: blockNumber } = useBlockNumber({ 
    chainId,
    watch: enabled && !isNativeETH 
  });

  // Check current allowance
  const {
    data: allowance,
    refetch: refetchAllowance,
    isLoading: isLoadingAllowance
  } = useReadContract({
    address: token.address as Address,
    abi: erc20Abi,
    functionName: "allowance",
    args: address && spender ? [address, spender] : undefined,
    chainId,
    query: {
      enabled: enabled && !!address && !!spender && !!token.address && !isNativeETH,
    },
  });

  // Auto-refetch allowance on new blocks
  useEffect(() => {
    if (blockNumber && !pending) {
      refetchAllowance();
    }
  }, [blockNumber, refetchAllowance, pending]);

  // Standard approve transaction
  const {
    writeContract: writeStandard,
    data: approvalHashStandard,
    isPending: isApprovingStandard,
    error: approvalErrorStandard,
  } = useWriteContract();

  // Fallback approve for old tokens (USDT, etc)
  const {
    writeContract: writeFallback,
    data: approvalHashFallback,
    isPending: isApprovingFallback,
    error: approvalErrorFallback,
  } = useWriteContract();

  const approvalHash = useFallbackAbi ? approvalHashFallback : approvalHashStandard;
  const isApproving = useFallbackAbi ? isApprovingFallback : isApprovingStandard;
  const approvalError = useFallbackAbi ? approvalErrorFallback : approvalErrorStandard;

  // Wait for approval confirmation
  const {
    isLoading: isConfirmingApproval,
    isSuccess: isApprovalConfirmed,
  } = useWaitForTransactionReceipt({
    hash: approvalHash,
    chainId,
  });

  // Refetch allowance after successful approval
  useEffect(() => {
    if (isApprovalConfirmed) {
      setPending(false);
      refetchAllowance();
    }
  }, [isApprovalConfirmed, refetchAllowance]);

  // Calculate approval state
  const approvalState = useCallback((): ApprovalState => {
  if (isNativeETH) return ApprovalState.APPROVED;
  if (pending || isConfirmingApproval) return ApprovalState.PENDING;
  if (isLoadingAllowance) return ApprovalState.LOADING;
  
  // CRITICAL: Check enabled and values AFTER loading check
  if (!enabled) return ApprovalState.UNKNOWN;
  if (!amount || !spender || !address) return ApprovalState.UNKNOWN;
  
  // If allowance is undefined (still loading), return LOADING
  if (allowance === undefined) return ApprovalState.LOADING;

  try {
    const amountBigInt = parseUnits(amount, token.decimals);
    
    // Has sufficient allowance
    if (allowance >= amountBigInt) {
      return ApprovalState.APPROVED;
    }
    
    // Needs approval
    return ApprovalState.NOT_APPROVED;
  } catch (error) {
    console.error("Error calculating approval state:", error);
    return ApprovalState.UNKNOWN;
  }
}, [
  isNativeETH,
  isLoadingAllowance,
  pending,
  isConfirmingApproval,
  amount,
  allowance,
  enabled,
  token.decimals,
  spender,
  address,
]);

  // Approve function
  const approve = useCallback(async () => {
    if (!address || !spender || !amount || isNativeETH) return;

    try {
      const approvalAmount = approveMax 
        ? maxUint256 
        : parseUnits(amount, token.decimals);
      
      setPending(true);

      // Try standard ABI first
      if (!useFallbackAbi) {
        try {
          writeStandard({
            address: token.address as Address,
            abi: erc20Abi,
            functionName: "approve",
            args: [spender, approvalAmount],
          });
        } catch (error: any) {
          // If standard fails with "ContractFunctionZeroDataError", switch to fallback
          if (
            error?.name === "ContractFunctionZeroDataError" ||
            error?.cause?.name === "ContractFunctionZeroDataError"
          ) {
            console.log("Switching to fallback ABI for old token");
            setUseFallbackAbi(true);
            writeFallback({
              address: token.address as Address,
              abi: OLD_ERC20_APPROVE_ABI,
              functionName: "approve",
              args: [spender, approvalAmount],
            });
          } else {
            throw error;
          }
        }
      } else {
        // Use fallback ABI (for USDT, etc)
        writeFallback({
          address: token.address as Address,
          abi: OLD_ERC20_APPROVE_ABI,
          functionName: "approve",
          args: [spender, approvalAmount],
        });
      }
    } catch (error) {
      console.error("Approval error:", error);
      setPending(false);
      throw error;
    }
  }, [
    address,
    spender,
    amount,
    token,
    writeStandard,
    writeFallback,
    isNativeETH,
    approveMax,
    useFallbackAbi,
  ]);

  const state = approvalState();

  console.log('=== APPROVAL DEBUG ===');
console.log('Token:', token.ticker);
console.log('Spender (router):', spender);
console.log('Amount:', amount);
console.log('Allowance:', allowance?.toString());
console.log('Approval State:', state);
console.log('Is Native ETH:', isNativeETH);
console.log('Enabled:', enabled);
console.log('===================');

  return {
    state,
    approve,
    isApproving,
    isConfirmingApproval,
    isApprovalConfirmed,
    approvalError,
    approvalHash,
  };
}