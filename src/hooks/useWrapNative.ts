// hooks/useWrapNative.ts

'use client'

import { useCallback, useMemo } from 'react'
import { parseUnits } from 'viem/utils'
import { useAccount, usePublicClient, useSimulateContract, useWriteContract } from 'wagmi'
import type { Token } from '@/store/limit-order/utils/token.types'
import { isNativeToken, getWrappedTokenAddress } from '@/store/limit-order/utils/token.types'

// WETH9 deposit ABI
const WETH_ABI = [
  {
    constant: false,
    inputs: [],
    name: 'deposit',
    outputs: [],
    payable: true,
    stateMutability: 'payable',
    type: 'function',
  },
] as const

interface UseWrapNativeParams {
  token?: Token
  amount?: string // Human readable amount
  enabled?: boolean
  onSuccess?: () => void
  onError?: (error: Error) => void
}

export const useWrapNative = ({
  token,
  amount,
  enabled = true,
  onSuccess,
  onError,
}: UseWrapNativeParams) => {
  const { address } = useAccount()
  const publicClient = usePublicClient()

  // Check if token needs wrapping
  const needsWrapping = useMemo(() => {
    return token && isNativeToken(token) && amount && parseFloat(amount) > 0
  }, [token, amount])

  // Get wrapped token address (WETH contract address)
  const wrappedTokenAddress = useMemo(() => {
    if (!token) return undefined
    return getWrappedTokenAddress(token.chainId)
  }, [token])

  // Convert amount to wei
  const amountInWei = useMemo(() => {
    if (!amount || !token) return undefined
    try {
      return parseUnits(amount, token.decimals)
    } catch {
      return undefined
    }
  }, [amount, token])

  const handleSuccess = useCallback(
    async (hash: `0x${string}`) => {
      if (!publicClient) return

      try {
        // Wait for transaction confirmation
        await publicClient.waitForTransactionReceipt({ hash })
        onSuccess?.()
      } catch (error) {
        console.error('Error waiting for wrap transaction:', error)
        onError?.(error as Error)
      }
    },
    [publicClient, onSuccess, onError]
  )

  const handleError = useCallback(
    (error: Error) => {
      console.error('Wrap transaction error:', error)
      onError?.(error)
    },
    [onError]
  )

  // Simulate the wrap transaction
  const { data: simulation } = useSimulateContract({
    chainId: token?.chainId,
    address: wrappedTokenAddress,
    abi: WETH_ABI,
    functionName: 'deposit',
    value: amountInWei,
    query: {
      enabled: Boolean(
        enabled && 
        needsWrapping && 
        wrappedTokenAddress && 
        amountInWei && 
        address
      ),
    },
  })

  const { writeContractAsync, isPending, isError, error } = useWriteContract({
    mutation: {
      onSuccess: handleSuccess,
      onError: handleError,
    },
  })

  // Execute wrap transaction
  const wrap = useCallback(async () => {
    if (!simulation) {
      throw new Error('Simulation not available')
    }

    try {
      return await writeContractAsync(simulation.request)
    } catch (error) {
      throw error
    }
  }, [simulation, writeContractAsync])

  return {
    needsWrapping,
    wrap,
    isPending,
    isError,
    error,
    canWrap: Boolean(simulation && needsWrapping),
  }
}