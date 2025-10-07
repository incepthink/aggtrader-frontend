// Add these types to your existing file

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

// Update your TYDaemonVault type to include strategies
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
  staking: {
    address: string;
    available: boolean;
  };
  status?: string;
  migration?: {
    available: boolean;
    target: string;
  };
  strategies?: TYDaemonStrategy[]; // Add this line
};