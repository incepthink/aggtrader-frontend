import { config } from '@/components/providers/WagmiWalletProvider';
import { mainnet } from 'wagmi/chains';

// Define Katana chain
export const katana = {
  id: 747474,
  name: 'Katana',
  nativeCurrency: {
    decimals: 18,
    name: 'Ethereum',
    symbol: 'ETH'
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.katana.network/']
    }
  },
  blockExplorers: {
    default: {
      name: 'Katana Explorer',
      url: 'https://explorer.katanarpc.com'
    }
  },
  contracts: {
    multicall3: {
      address: '0xcA11bde05977b3631167028862bE2a173976CA11' as `0x${string}`
    }
  }
} as const;

export function retrieveConfig() {
  return config
}

export function getNetwork(chainId: number) {
  const networks = {
    1: mainnet,
    747474: katana
  };
  
  return networks[chainId as keyof typeof networks] || mainnet;
}
