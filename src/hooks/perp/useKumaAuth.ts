'use client';

import { useState, useCallback, useEffect } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { RestAuthenticatedClient } from '@katanaperps/katana-perps-sdk/clients';

/**
 * Katana Perps account balance interface
 * Based on KatanaPerpsWallet type from @katanaperps/katana-perps-sdk
 */
export interface KatanaPerpsAccountBalance {
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

// Keep the old name as an alias for backwards compatibility
export type KumaAccountBalance = KatanaPerpsAccountBalance;

interface KatanaPerpsAuthState {
  isAssociated: boolean;
  isAssociating: boolean;
  error: string | null;
  client: RestAuthenticatedClient | null;
  accountBalance: KatanaPerpsAccountBalance | null;
}

interface UseKatanaPerpsAuthReturn extends KatanaPerpsAuthState {
  associateWallet: () => Promise<boolean>;
  clearError: () => void;
  resetAuth: () => void;
}

/**
 * Hook to manage Katana Perps wallet association and authentication
 *
 * IMPORTANT: You need to set up environment variables:
 * For Testnet (Bokuto):
 * - NEXT_PUBLIC_KATANA_PERPS_API_KEY_TESTNET: Your Katana Perps testnet API key
 * - NEXT_PUBLIC_KATANA_PERPS_API_SECRET_TESTNET: Your Katana Perps testnet API secret
 *
 * For Mainnet (Katana):
 * - NEXT_PUBLIC_KATANA_PERPS_API_KEY: Your Katana Perps mainnet API key
 * - NEXT_PUBLIC_KATANA_PERPS_API_SECRET: Your Katana Perps mainnet API secret
 *
 * Set NEXT_PUBLIC_KATANA_PERPS_SANDBOX='true' for testnet, 'false' for mainnet
 *
 * Get API keys from: https://perps-sandbox.katana.network/ (testnet) or https://perps.katana.network/ (mainnet)
 */
export const useKatanaPerpsAuth = (): UseKatanaPerpsAuthReturn => {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();

  const [state, setState] = useState<KatanaPerpsAuthState>({
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
    const storedStatus = sessionStorage.getItem(`katana_perps_associated_${address}`);
    if (storedStatus === 'true') {
      setState((prev) => ({
        ...prev,
        isAssociated: true,
      }));
    }
  }, [isConnected, address]);

  /**
   * Associate the connected wallet with Katana Perps API
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
      // This ensures we sign exactly what Katana Perps expects
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

      console.log('Wallet associated successfully with Katana Perps:', result);

      // Store association status in session storage
      sessionStorage.setItem(`katana_perps_associated_${address}`, 'true');

      // Determine if using sandbox (Bokuto testnet) or mainnet
      const sandbox = process.env.NEXT_PUBLIC_KATANA_PERPS_SANDBOX === 'true';

      // Create client instance for future use (optional, if needed)
      const client = new RestAuthenticatedClient({
        apiKey: sandbox
          ? process.env.NEXT_PUBLIC_KATANA_PERPS_API_KEY_TESTNET || ''
          : process.env.NEXT_PUBLIC_KATANA_PERPS_API_KEY || '',
        apiSecret: sandbox
          ? process.env.NEXT_PUBLIC_KATANA_PERPS_API_SECRET_TESTNET || ''
          : process.env.NEXT_PUBLIC_KATANA_PERPS_API_SECRET || '',
        sandbox,
      });

      // Extract account balance from response
      const accountBalance: KatanaPerpsAccountBalance = {
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
      console.error('Failed to associate wallet with Katana Perps:', err);

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
      sessionStorage.removeItem(`katana_perps_associated_${address}`);
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

// Keep the old name as an alias for backwards compatibility
export const useKumaAuth = useKatanaPerpsAuth;
