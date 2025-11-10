// src/hooks/useUserReferralData.ts

import { BACKEND_URL } from '@/utils/constants'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'

export interface ReferredUser {
  address: string
  dateReferred: Date
  volumeTraded: string
  rewardsGenerated: string
}

interface ReferredByData {
  address: string
  code: string
  dateReferred: Date
}

export interface ReferralResponse {
  userId: number
  walletAddress: string
  referralCode: string
  stats: {
    tradersReferred: number
    rewardsEarned: string
    rewardsClaimed: string
  }
  referredBy: ReferredByData | null
  referred: ReferredUser[]
}

const fetchUserReferralData = async (userAddress: string): Promise<ReferralResponse> => {
  const { data } = await axios.get(`${BACKEND_URL}/user/referrals/${userAddress}`)
  return data
}

export const useUserReferralData = (userAddress: string | undefined) => {
  return useQuery({
    queryKey: ['userReferralData', userAddress],
    queryFn: () => fetchUserReferralData(userAddress!),
    enabled: !!userAddress
  })
}