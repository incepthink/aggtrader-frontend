// hooks/useTokenApproval.ts

'use client'

import { useCallback, useMemo } from 'react'
import { SimpleAmount } from '@/store/limit-order/utils/simpleCurrency'
import type { Token } from '@/store/limit-order/utils/token.types'
import { type Address, erc20Abi, maxUint256 } from 'viem'
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { useTokenAllowance } from './useTokenAllowance'

export enum ApprovalState {
  LOADING = 'LOADING',
  UNKNOWN = 'UNKNOWN',
  NOT_APPROVED = 'NOT_APPROVED',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
}

interface UseTokenApprovalProps {
  token?: Token
  amount?: SimpleAmount
  spender?: Address
  chainId?: number
  owner?: Address
  enabled?: boolean
}

export const useTokenApproval = ({
  token,
  amount,
  spender,
  chainId,
  owner,
  enabled = true,
}: UseTokenApprovalProps) => {
  // Get current allowance
  const { data: allowance, isLoading: isLoadingAllowance } = useTokenAllowance({
    token,
    chainId,
    owner,
    spender,
    enabled,
  })

  // Approval transaction hook
  const {
    writeContractAsync,
    data: txHash,
    isPending: isWritePending,
    error: writeError,
  } = useWriteContract()

  // Wait for transaction confirmation
  const { isLoading: isWaitingForReceipt, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  })

  // Determine approval state
  const approvalState = useMemo(() => {
    if (isLoadingAllowance) return ApprovalState.LOADING
    if (!token || !amount || !spender || !owner) return ApprovalState.UNKNOWN
    if (isWritePending || isWaitingForReceipt) return ApprovalState.PENDING
    
    if (allowance && amount) {
      try {
        // Check if allowance is sufficient
        if (allowance.quotient >= amount.quotient) {
          return ApprovalState.APPROVED
        }
        return ApprovalState.NOT_APPROVED
      } catch {
        return ApprovalState.UNKNOWN
      }
    }
    
    return ApprovalState.UNKNOWN
  }, [allowance, amount, isLoadingAllowance, isWritePending, isWaitingForReceipt, token, spender, owner])

  // Approve exact amount (one-time only)
  const approveExactAmount = useCallback(async () => {
    if (!token || !amount || !spender) {
      throw new Error('Missing required parameters for approval')
    }

    try {
      return await writeContractAsync({
        address: token.address,
        abi: erc20Abi,
        functionName: 'approve',
        args: [spender, amount.quotient],
      })
    } catch (error) {
      console.error('Exact approval failed:', error)
      throw error
    }
  }, [token, amount, spender, writeContractAsync])

  // Approve unlimited amount (max uint256)
  const approveUnlimitedAmount = useCallback(async () => {
    if (!token || !spender) {
      throw new Error('Missing required parameters for approval')
    }

    try {
      return await writeContractAsync({
        address: token.address,
        abi: erc20Abi,
        functionName: 'approve',
        args: [spender, maxUint256],
      })
    } catch (error) {
      console.error('Unlimited approval failed:', error)
      throw error
    }
  }, [token, spender, writeContractAsync])

  return {
    approvalState,
    allowance,
    approveExactAmount,
    approveUnlimitedAmount,
    isPending: isWritePending || isWaitingForReceipt,
    isSuccess,
    error: writeError,
    txHash,
  }
}