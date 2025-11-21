// src/hooks/useWalletAttestation.ts

import { useAccount, useSignMessage } from 'wagmi'
import { useEffect, useState } from 'react'
import axios from 'axios'
import { BACKEND_URL } from '@/utils/constants'

interface SignatureCheckResponse {
  exists: boolean
  signature?: string
}

export const useWalletAttestation = () => {
  const { address, isConnected } = useAccount()
  const { signMessage } = useSignMessage()
  const [hasChecked, setHasChecked] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    // Only run if wallet is connected and we haven't checked this address yet
    if (!isConnected || !address || hasChecked === address || isProcessing) {
      return
    }

    const checkAndRequestSignature = async () => {
      setIsProcessing(true)

      try {
        // Check if signature already exists
        const { data } = await axios.get<SignatureCheckResponse>(
          `${BACKEND_URL}/user/signature?wallet=${address}`
        )

        if (data.exists) {
          setHasChecked(address)
          setIsProcessing(false)
          return
        }

        // Request signature
        const timestamp = new Date().toISOString()
        const message = `I am using AggTrade\nWallet: ${address}\nTimestamp: ${timestamp}`

        signMessage(
          { message },
          {
            onSuccess: async (signature) => {
              try {
                // Store signature in backend
                await axios.post(`${BACKEND_URL}/user/signature`, {
                  wallet: address,
                  signature,
                  message,
                  timestamp
                })

                setHasChecked(address)
              } catch (error) {
                console.error('Failed to store signature:', error)
              } finally {
                setIsProcessing(false)
              }
            },
            onError: (error) => {
              console.error('Signature rejected:', error)
              setIsProcessing(false)
              // Mark as checked to avoid re-prompting in same session
              setHasChecked(address)
            }
          }
        )
      } catch (error) {
        console.error('Failed to check signature:', error)
        setIsProcessing(false)
      }
    }

    checkAndRequestSignature()
  }, [address, isConnected, hasChecked, isProcessing, signMessage])

  return { isProcessing }
}