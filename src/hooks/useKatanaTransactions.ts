// src/hooks/useKatanaTransactions.ts
import { useQuery } from '@tanstack/react-query';

const API_BASE = 'https://api.etherscan.io/v2/api';
const API_KEY = process.env.NEXT_PUBLIC_ETHERSCAN_API || '';
const CHAIN_ID = '747474';

export interface Transaction {
  hash: string;
  timeStamp: string;
  from: string;
  to: string;
  value: string;
  tokenSymbol: string;
  tokenDecimal: string;
  type: 'eth' | 'token';
}

const fetchTransactions = async (address: string, action: string) => {
  const params = new URLSearchParams({
    chainid: CHAIN_ID,
    module: 'account',
    action: action,
    address: address,
    startblock: '0',
    endblock: '99999999',
    page: '1',
    offset: '50',
    sort: 'desc',
    apikey: API_KEY,
  });

  const response = await fetch(`${API_BASE}?${params}`);
  const data = await response.json();
  
  if (data.status !== '1') {
    return [];
  }
  
  return data.result || [];
};

export const useKatanaTransactions = (address?: string) => {
  return useQuery({
    queryKey: ['katana-transactions', address],
    queryFn: async () => {
      if (!address) return [];

      const [ethTxs, tokenTxs] = await Promise.all([
        fetchTransactions(address, 'txlist'),
        fetchTransactions(address, 'tokentx'),
      ]);

      const ethTransactions: Transaction[] = ethTxs
        .filter((tx: any) => tx.value !== '0')
        .map((tx: any) => ({
          hash: tx.hash,
          timeStamp: tx.timeStamp,
          from: tx.from,
          to: tx.to,
          value: tx.value,
          tokenSymbol: 'ETH',
          tokenDecimal: '18',
          type: 'eth' as const,
        }));

      const tokenTransactions: Transaction[] = tokenTxs.map((tx: any) => ({
        hash: tx.hash,
        timeStamp: tx.timeStamp,
        from: tx.from,
        to: tx.to,
        value: tx.value,
        tokenSymbol: tx.tokenSymbol,
        tokenDecimal: tx.tokenDecimal,
        type: 'token' as const,
      }));

      return [...ethTransactions, ...tokenTransactions].sort(
        (a, b) => parseInt(b.timeStamp) - parseInt(a.timeStamp)
      );
    },
    enabled: !!address,
    staleTime: 0,
    gcTime: 0,
  });
};