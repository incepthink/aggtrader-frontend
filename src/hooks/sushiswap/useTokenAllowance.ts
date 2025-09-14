// hooks/useTokenAllowance.ts

'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { SimpleAmount } from '@/store/limit-order/utils/simpleCurrency'
import type { Token } from '@/store/limit-order/utils/token.types'
import { type Address, erc20Abi } from 'viem'
import { useBlockNumber, useReadContract } from 'wagmi'

interface UseTokenAllowanceProps {
  token?: Token
  chainId: number | undefined
  owner: Address | undefined
  spender: Address | undefined
  enabled?: boolean
}

export const useTokenAllowance = ({
  chainId,
  token,
  owner,
  spender,
  enabled = true,
}: UseTokenAllowanceProps) => {
  const queryClient = useQueryClient()
  
  const query = useReadContract({
    chainId,
    address: token ? (token.address as Address) : undefined,
    abi: erc20Abi,
    functionName: 'allowance',
    args: owner && spender ? [owner, spender] : undefined,
    query: {
      enabled: Boolean(token && owner && spender && enabled && chainId),
      select: (data) => {
        if (token && data !== undefined) {
          return SimpleAmount.fromRawAmount(token, data.toString())
        }
        return undefined
      },
    },
  })

  const { data: blockNumber } = useBlockNumber({ chainId, watch: true })

  // Invalidate queries on new blocks to keep allowance up to date
  useEffect(() => {
    if (blockNumber) {
      queryClient.invalidateQueries(
        { queryKey: query.queryKey },
        { cancelRefetch: false },
      )
    }
  }, [blockNumber, queryClient, query.queryKey])

  return query
}