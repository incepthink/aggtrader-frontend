export interface Asset {
  id: string;
  address: string;
  symbol: string;
  name: string;
  decimals: number;
}

export interface AssetYield {
  apr: number;
}

export interface VaultAsset extends Asset {
  yield: AssetYield;
}

export interface VaultState {
  totalAssets: string;
  totalAssetsUsd: number;
  totalSupply: string;
  sharePrice: string;
  sharePriceUsd: number;
  apy: number;
  netApy: number;
  netApyWithoutRewards: number;
  dailyApy: number;
  dailyNetApy: number;
  weeklyApy: number;
  weeklyNetApy: number;
  avgNetApy: number;
  monthlyApy: number;
  monthlyNetApy: number;
  owner: string;
  curator: string;
  guardian: string;
  timelock: string;
  fee: number;
  rewards: any[];
  allocation: any[];
}

export interface VaultDetail {
  address: string;
  name: string;
  symbol: string;
  whitelisted: boolean;
  asset: VaultAsset;
  state: VaultState;
}

export interface ProjectedEarnings {
  // Token amounts
  monthly: number;
  yearly: number;
  // USD values
  monthlyUsd: number;
  yearlyUsd: number;
  // Different timeframes
  weekly: number;
  weeklyUsd: number;
  daily: number;
  dailyUsd: number;
}
