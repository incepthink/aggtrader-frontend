'use client';

import { useState, useCallback, useEffect } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { RestAuthenticatedClient } from '@kumabid/kuma-sdk/clients';

export interface KumaAccountBalance {
  equity: string;
  freeCollateral: string;
  heldCollateral: string;
  availableCollateral: string;
  buyingPower: string;
  leverage: string;
  marginRatio: string;
  quoteBalance: string;
  unrealizedPnL: string;
  makerFeeRate: string;
  takerFeeRate: string;
  positions: any[];
}

interface KumaAuthState {
  isAssociated: boolean;
  isAssociating: boolean;
  error: string | null;
  client: RestAuthenticatedClient | null;
  accountBalance: KumaAccountBalance | null;
}

interface UseKumaAuthReturn extends KumaAuthState {
  associateWallet: () => Promise<boolean>;
  clearError: () => void;
  resetAuth: () => void;
}

/**
 * Hook to manage Kuma wallet association and authentication
 *
 * IMPORTANT: You need to set up environment variables:
 * - NEXT_PUBLIC_KUMA_API_KEY: Your Kuma API key
 * - NEXT_PUBLIC_KUMA_API_SECRET: Your Kuma API secret
 * - NEXT_PUBLIC_KUMA_SANDBOX: Set to 'true' for sandbox, 'false' for production
 *
 * Get these from: https://exchange.kuma.bid/settings/api
 */
export const useKumaAuth = (): UseKumaAuthReturn => {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();

  const [state, setState] = useState<KumaAuthState>({
    isAssociated: false,
    isAssociating: false,
    error: null,
    client: null,
    accountBalance: null,
  });

  // Initialize client when wallet is connected
  useEffect(() => {
    if (!isConnected || !address) {
      setState((prev) => ({
        ...prev,
        isAssociated: false,
        client: null,
        accountBalance: null,
      }));
      return;
    }

    // Check if we have stored association status
    const storedStatus = sessionStorage.getItem(`kuma_associated_${address}`);
    if (storedStatus === 'true') {
      setState((prev) => ({
        ...prev,
        isAssociated: true,
      }));
    }
  }, [isConnected, address]);

  /**
   * Associate the connected wallet with Kuma API
   * This must be called before trading operations
   *
   * @returns true if association was successful, false otherwise
   */
  const associateWallet = useCallback(async (): Promise<boolean> => {
    if (!address || !walletClient) {
      setState((prev) => ({
        ...prev,
        error: 'Wallet not connected',
      }));
      return false;
    }

    setState((prev) => ({
      ...prev,
      isAssociating: true,
      error: null,
    }));

    try {
      // Step 1: Get the typed data structure from our API
      // This ensures we sign exactly what Kuma expects
      const typedDataResponse = await fetch('/api/kuma/get-typed-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          wallet: address,
        }),
      });

      if (!typedDataResponse.ok) {
        const error = await typedDataResponse.json();
        throw new Error(error.error || 'Failed to get typed data');
      }

      const { nonce, typedData } = await typedDataResponse.json();

      // Step 2: Request signature from user's wallet
      const signature = await walletClient.signTypedData({
        domain: typedData.domain,
        types: typedData.types,
        primaryType: typedData.primaryType,
        message: typedData.message,
      });

      // Step 3: Submit signature to our Next.js API route (server-side proxy to avoid CORS)
      const response = await fetch('/api/kuma/associate-wallet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nonce,
          wallet: address,
          signature,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to associate wallet');
      }

      console.log('Wallet associated successfully:', result);

      // Store association status in session storage
      sessionStorage.setItem(`kuma_associated_${address}`, 'true');

      // Create client instance for future use (optional, if needed)
      const client = new RestAuthenticatedClient({
        apiKey: process.env.NEXT_PUBLIC_KUMA_API_KEY || '',
        apiSecret: process.env.NEXT_PUBLIC_KUMA_API_SECRET || '',
        sandbox: process.env.NEXT_PUBLIC_KUMA_SANDBOX === 'true',
      });

      // Extract account balance from response
      const accountBalance: KumaAccountBalance = {
        equity: result.equity || '0',
        freeCollateral: result.freeCollateral || '0',
        heldCollateral: result.heldCollateral || '0',
        availableCollateral: result.availableCollateral || '0',
        buyingPower: result.buyingPower || '0',
        leverage: result.leverage || '0',
        marginRatio: result.marginRatio || '0',
        quoteBalance: result.quoteBalance || '0',
        unrealizedPnL: result.unrealizedPnL || '0',
        makerFeeRate: result.makerFeeRate || '0',
        takerFeeRate: result.takerFeeRate || '0',
        positions: result.positions || [],
      };

      setState({
        isAssociated: true,
        isAssociating: false,
        error: null,
        client,
        accountBalance,
      });

      return true;
    } catch (err: any) {
      console.error('Failed to associate wallet:', err);

      let errorMessage = 'Failed to associate wallet';

      if (err.message) {
        errorMessage = err.message;
      }

      // Check for specific error cases
      if (errorMessage.includes('User rejected') || errorMessage.includes('User denied')) {
        errorMessage = 'Wallet signature was rejected. Please try again.';
      } else if (errorMessage.includes('API key') || errorMessage.includes('credentials')) {
        errorMessage = 'Invalid API credentials. Please check your configuration.';
      }

      setState({
        isAssociated: false,
        isAssociating: false,
        error: errorMessage,
        client: null,
        accountBalance: null,
      });

      return false;
    }
  }, [address, walletClient]);

  const clearError = useCallback(() => {
    setState((prev) => ({
      ...prev,
      error: null,
    }));
  }, []);

  const resetAuth = useCallback(() => {
    if (address) {
      sessionStorage.removeItem(`kuma_associated_${address}`);
    }
    setState({
      isAssociated: false,
      isAssociating: false,
      error: null,
      client: null,
      accountBalance: null,
    });
  }, [address]);

  return {
    ...state,
    associateWallet,
    clearError,
    resetAuth,
  };
};
