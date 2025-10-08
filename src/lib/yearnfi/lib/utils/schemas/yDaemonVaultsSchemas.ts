// Add this type definition
export type TYDaemonStrategy = {
  address: string;
  name: string;
  description?: string;
  debtRatio: number; // in basis points (10000 = 100%)
  estimatedTotalAssets: string;
  apr?: number;
  lastReport?: number;
  riskScore?: number;
};

// Your existing TYDaemonVault type
export type TYDaemonVault = {
  address: string;
  chainID: number;
  name: string;
  symbol: string;
  decimals: number;
  token: {
    address: string;
    name: string;
    symbol: string;
  };
  kind?: 'Multi Strategy' | 'Single Strategy';
  category?: string;
  version?: string;
  tvl?: {
    totalAssets: string;
    tvl: number;
    price: number;
  };
  apy?: {
    type: string;
    gross_apr: number;
    net_apy: number;
  };
  apr?: {
    netAPR: number;
    extra: {
      stakingRewardsAPR: number;
      gammaRewardAPR: number;
    };
  };
  staking: {
    address: string;
    available: boolean;
    source?: string; // 'OP Boost', 'VeYFI', 'Juiced', 'V3 Staking'
  };
  status?: string;
  migration?: {
    available: boolean;
    target: string;
  };
  strategies?: TYDaemonStrategy[]; // This line uses the type defined above
};