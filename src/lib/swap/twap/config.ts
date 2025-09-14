import { type Config, Configs } from '@orbs-network/twap-sdk'
import type { TwapSupportedChainId } from '@/utils/config'

export enum SupportedChainId {
  ETHEREUM = 1,
  KATANA = 747474, // Replace with actual Katana chain ID
}

export const TWAP_CONFIG: Record<TwapSupportedChainId, Config> = {
  [SupportedChainId.ETHEREUM]: Configs.SushiEth,
  [SupportedChainId.KATANA]: {
    ...Configs.SushiKatana,
    minChunkSizeUsd: 5,
  },
}