import { useState, useEffect } from 'react';

// AccountBalance interface (matches DepositWithdraw.tsx)
export interface AccountBalance {
  balance: number;
  freeCollateral: number;
  availableCollateral: number;
  unrealizedPnl: number;
}

export const useAccountBalance = (walletAddress?: string) => {
  const [accountBalance, setAccountBalance] = useState<AccountBalance>({
    balance: 0,
    freeCollateral: 0,
    availableCollateral: 0,
    unrealizedPnl: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!walletAddress) {
      // No wallet connected, reset to defaults
      setAccountBalance({
        balance: 0,
        freeCollateral: 0,
        availableCollateral: 0,
        unrealizedPnl: 0,
      });
      return;
    }

    // TODO: Implement Kuma API call
    // const fetchBalance = async () => {
    //   setIsLoading(true);
    //   setError(null);
    //
    //   try {
    //     // Use Kuma SDK RestAuthenticatedClient
    //     // const client = new RestAuthenticatedClient({
    //     //   apiKey: process.env.NEXT_PUBLIC_KUMA_API_KEY,
    //     //   apiSecret: process.env.NEXT_PUBLIC_KUMA_API_SECRET,
    //     //   wallet: walletAddress,
    //     // });
    //     //
    //     // const wallets = await client.getWallets({ wallet: walletAddress });
    //     // if (wallets.length > 0) {
    //     //   const wallet = wallets[0];
    //     //   setAccountBalance({
    //     //     balance: parseFloat(wallet.balance),
    //     //     freeCollateral: parseFloat(wallet.freeCollateral),
    //     //     availableCollateral: parseFloat(wallet.availableCollateral),
    //     //     unrealizedPnl: parseFloat(wallet.unrealizedPnl || '0'),
    //     //   });
    //     // }
    //   } catch (err: any) {
    //     setError(err.message || 'Failed to fetch account balance');
    //     console.error('Error fetching account balance:', err);
    //   } finally {
    //     setIsLoading(false);
    //   }
    // };
    //
    // fetchBalance();

    // For now, use mock data for testing
    console.log('useAccountBalance: Mock data for wallet', walletAddress);
    setAccountBalance({
      balance: 10000,
      freeCollateral: 5000,
      availableCollateral: 5000,
      unrealizedPnl: 250,
    });
  }, [walletAddress]);

  return { accountBalance, isLoading, error };
};
