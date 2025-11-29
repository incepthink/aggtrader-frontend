// src/lib/utils/wagmi/transactions.ts

import { writeContract, waitForTransactionReceipt, readContract } from '@wagmi/core';
import { config } from '@/components/providers/WagmiWalletProvider';
import type { Address, Hash } from 'viem';

// ============================================================================
// Types
// ============================================================================

export type TTransactionResult = {
  isSuccessful: boolean;
  receipt?: any;
  error?: Error;
  hash?: Hash;
};

// ============================================================================
// ERC20 Approval
// ============================================================================

/**
 * Approve ERC20 token spending
 * @param tokenAddress - The ERC20 token to approve
 * @param spenderAddress - The address that will spend the tokens (vault address)
 * @param amount - Amount to approve (use maxUint256 for infinite)
 * @param chainId - Chain ID
 */
export async function approveERC20(params: {
  tokenAddress: Address;
  spenderAddress: Address;
  amount: bigint;
  chainId: number;
}): Promise<TTransactionResult> {
  try {
    const { tokenAddress, spenderAddress, amount, chainId } = params;

    // Execute approve transaction
    const hash = await writeContract(config, {
      address: tokenAddress,
      abi: [
        {
          name: 'approve',
          type: 'function',
          stateMutability: 'nonpayable',
          inputs: [
            { name: 'spender', type: 'address' },
            { name: 'amount', type: 'uint256' },
          ],
          outputs: [{ name: '', type: 'bool' }],
        },
      ] as const,
      functionName: 'approve',
      args: [spenderAddress, amount],
      chainId: chainId as any,
    });

    // Wait for confirmation
    const receipt = await waitForTransactionReceipt(config, {
      hash,
      chainId: chainId as any,
    });

    return {
      isSuccessful: receipt.status === 'success',
      receipt,
      hash,
    };
  } catch (error) {
    console.error('Approval failed:', error);
    return {
      isSuccessful: false,
      error: error as Error,
    };
  }
}

// ============================================================================
// Vault Deposit
// ============================================================================

/**
 * Deposit tokens into a Yearn V3 vault
 * @param vaultAddress - The vault contract address
 * @param amount - Amount of underlying tokens to deposit
 * @param receiver - Address to receive vault shares (usually the user)
 * @param chainId - Chain ID
 */
export async function depositToVault(params: {
  vaultAddress: Address;
  amount: bigint;
  receiver: Address;
  chainId: number;
}): Promise<TTransactionResult> {
  try {
    const { vaultAddress, amount, receiver, chainId } = params;

    // Execute deposit transaction
    // V3 vault.deposit(assets, receiver) -> returns shares
    const hash = await writeContract(config, {
      address: vaultAddress,
      abi: [
        {
          name: 'deposit',
          type: 'function',
          stateMutability: 'nonpayable',
          inputs: [
            { name: 'assets', type: 'uint256' },
            { name: 'receiver', type: 'address' },
          ],
          outputs: [{ name: 'shares', type: 'uint256' }],
        },
      ] as const,
      functionName: 'deposit',
      args: [amount, receiver],
      chainId: chainId as any,
    });

    // Wait for confirmation
    const receipt = await waitForTransactionReceipt(config, {
      hash,
      chainId: chainId as any,
    });

    return {
      isSuccessful: receipt.status === 'success',
      receipt,
      hash,
    };
  } catch (error) {
    console.error('Deposit failed:', error);
    return {
      isSuccessful: false,
      error: error as Error,
    };
  }
}

// ============================================================================
// Vault Withdraw (Redeem)
// ============================================================================

/**
 * Withdraw tokens from a Yearn V3 vault by redeeming shares
 * @param vaultAddress - The vault contract address
 * @param shares - Amount of vault shares to redeem
 * @param receiver - Address to receive underlying tokens
 * @param owner - Address that owns the shares (usually same as receiver)
 * @param maxLoss - Maximum acceptable loss in basis points (1 = 0.01%)
 * @param chainId - Chain ID
 */
export async function withdrawFromVault(params: {
  vaultAddress: Address;
  shares: bigint;
  receiver: Address;
  owner: Address;
  maxLoss?: bigint;
  chainId: number;
}): Promise<TTransactionResult> {
  try {
    const {
      vaultAddress,
      shares,
      receiver,
      owner,
      maxLoss = BigInt(1), // Default 0.01% max loss
      chainId,
    } = params;

    // Execute redeem transaction
    // V3 vault.redeem(shares, receiver, owner, maxLoss) -> returns assets
    const hash = await writeContract(config, {
      address: vaultAddress,
      abi: [
        {
          name: 'redeem',
          type: 'function',
          stateMutability: 'nonpayable',
          inputs: [
            { name: 'shares', type: 'uint256' },
            { name: 'receiver', type: 'address' },
            { name: 'owner', type: 'address' },
            { name: 'maxLoss', type: 'uint256' },
          ],
          outputs: [{ name: 'assets', type: 'uint256' }],
        },
      ] as const,
      functionName: 'redeem',
      args: [shares, receiver, owner, maxLoss],
      chainId: chainId as any,
    });

    // Wait for confirmation
    const receipt = await waitForTransactionReceipt(config, {
      hash,
      chainId: chainId as any,
    });

    return {
      isSuccessful: receipt.status === 'success',
      receipt,
      hash,
    };
  } catch (error) {
    console.error('Withdrawal failed:', error);
    return {
      isSuccessful: false,
      error: error as Error,
    };
  }
}

// ============================================================================
// Helper: Check ERC20 Allowance
// ============================================================================

/**
 * Check current allowance for a token
 * This is a utility function, not a transaction
 */
export async function checkAllowance(params: {
  tokenAddress: Address;
  owner: Address;
  spender: Address;
  chainId: number;
}): Promise<bigint> {
  try {
    const { tokenAddress, owner, spender, chainId } = params;
    console.log(tokenAddress, owner, spender, chainId);
    

    const allowance = await readContract(config, {
      address: tokenAddress,
      abi: [
        {
          name: 'allowance',
          type: 'function',
          stateMutability: 'view',
          inputs: [
            { name: 'owner', type: 'address' },
            { name: 'spender', type: 'address' },
          ],
          outputs: [{ name: '', type: 'uint256' }],
        },
      ] as const,
      functionName: 'allowance',
      args: [owner, spender],
      chainId: chainId as any,
    });
    console.log(allowance);
    
    return allowance;
  } catch (error) {
    console.error('Failed to check allowance:', error);
    return BigInt(0);
  }
}