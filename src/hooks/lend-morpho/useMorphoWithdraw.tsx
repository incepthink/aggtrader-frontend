// hooks/useMorphoWithdraw.ts
"use client";
import React, { useState, useCallback } from "react";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { parseUnits, formatUnits, Address } from "viem";
import type { UserPosition } from "./useUserVaultPosition";

// MetaMorpho ABI - Only withdraw function
const MetaMorphoWithdrawABI = [
  {
    name: "withdraw",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "assets", type: "uint256" },
      { name: "receiver", type: "address" },
      { name: "owner", type: "address" },
    ],
    outputs: [{ name: "shares", type: "uint256" }],
  },
] as const;

export interface WithdrawState {
  isLoading: boolean;
  error: string | null;
  txHash: string | null;
}

export const useMorphoWithdraw = (
  vaultAddress: string,
  assetAddress: string,
  decimals: number,
  userPosition: UserPosition | null | undefined
) => {
  const [state, setState] = useState<WithdrawState>({
    isLoading: false,
    error: null,
    txHash: null,
  });

  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const updateState = useCallback((updates: Partial<WithdrawState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  // Validation helper
  const validateClients = useCallback(() => {
    if (!address || !isConnected) {
      return { valid: false, error: "Wallet not connected" };
    }

    if (!publicClient) {
      return { valid: false, error: "Public client not available" };
    }

    if (!walletClient) {
      return { valid: false, error: "Wallet client not available" };
    }

    if (
      address === "0x0000000000000000000000000000000000000000" ||
      !address.startsWith("0x") ||
      address.length !== 42
    ) {
      return {
        valid: false,
        error: "Invalid wallet address - please reconnect your wallet",
      };
    }

    return { valid: true, error: null };
  }, [address, isConnected, publicClient, walletClient]);

  // Safely get position data - handle undefined/null and ensure string conversion
  const getPositionData = useCallback(() => {
    if (!userPosition) {
      return {
        hasPosition: false,
        assets: "0",
        shares: "0",
        assetsUsd: 0,
        assetsNumber: 0,
        sharesNumber: 0,
      };
    }

    // Safely convert to strings regardless of input type
    const assetsStr = String(userPosition.assets);
    const sharesStr = String(userPosition.shares);

    // Parse as numbers for calculations
    const assetsNum =
      typeof userPosition.assets === "number"
        ? userPosition.assets
        : parseFloat(assetsStr);
    const sharesNum =
      typeof userPosition.shares === "number"
        ? userPosition.shares
        : parseFloat(sharesStr);

    return {
      hasPosition: assetsNum > 0 || sharesNum > 0,
      assets: assetsStr,
      shares: sharesStr,
      assetsUsd: userPosition.assetsUsd,
      assetsNumber: assetsNum,
      sharesNumber: sharesNum,
    };
  }, [userPosition]);

  // Withdraw specific amount of assets
  const withdraw = useCallback(
    async (amount: string, receiver?: Address): Promise<boolean> => {
      const validation = validateClients();
      if (!validation.valid) {
        updateState({ error: validation.error });
        return false;
      }

      const position = getPositionData();
      if (!position.hasPosition) {
        updateState({ error: "No position available to withdraw from" });
        return false;
      }

      updateState({ isLoading: true, error: null, txHash: null });

      try {
        const amountToWithdraw = parseUnits(amount, decimals);
        // Convert position.assets to string and format for parseUnits
        const userAssetsFormatted = formatUnits(
          BigInt(Math.floor(position.assetsNumber)),
          decimals
        );
        const userAssetsAmount = parseUnits(userAssetsFormatted, decimals);
        const receiverAddress = receiver || address!;

        console.log("Starting withdraw process:", {
          amount,
          amountToWithdraw: amountToWithdraw.toString(),
          userAssetsRaw: position.assetsNumber,
          userAssetsFormatted,
          userAssetsAmount: userAssetsAmount.toString(),
          vaultAddress,
          userAddress: address,
          receiverAddress,
        });

        // Validate against position data
        if (userAssetsAmount === BigInt(0)) {
          updateState({
            isLoading: false,
            error: "No assets available to withdraw",
          });
          return false;
        }

        if (amountToWithdraw > userAssetsAmount) {
          updateState({
            isLoading: false,
            error: `Insufficient balance. Available: ${userAssetsFormatted} USDC`,
          });
          return false;
        }

        console.log("Executing withdraw transaction...");

        // Execute withdraw transaction
        const withdrawTxHash = await walletClient!.writeContract({
          address: vaultAddress as Address,
          abi: MetaMorphoWithdrawABI,
          functionName: "withdraw",
          args: [amountToWithdraw, receiverAddress, address!],
        });

        console.log("Withdrawal transaction sent:", withdrawTxHash);
        updateState({ txHash: withdrawTxHash });

        // Wait for transaction confirmation
        const receipt = await publicClient!.waitForTransactionReceipt({
          hash: withdrawTxHash,
        });

        if (receipt.status === "success") {
          console.log("Withdrawal successful:", withdrawTxHash);
          updateState({ isLoading: false });
          return true;
        } else {
          throw new Error("Withdrawal transaction failed");
        }
      } catch (error) {
        console.error("Withdrawal error:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Withdrawal failed";
        updateState({
          isLoading: false,
          error: errorMessage.includes("User rejected")
            ? "Transaction rejected by user"
            : errorMessage,
        });
        return false;
      }
    },
    [
      address,
      publicClient,
      walletClient,
      vaultAddress,
      decimals,
      validateClients,
      updateState,
      getPositionData,
    ]
  );

  // Get max withdrawable amount (show USD value like in input)
  const getMaxWithdrawable = useCallback((): string => {
    const position = getPositionData();
    if (!position.hasPosition) {
      return "0";
    }
    // Return USD value for display consistency
    return position.assetsUsd.toFixed(2);
  }, [getPositionData]);

  // Get max withdrawable in token amount (for transaction)
  const getMaxWithdrawableTokens = useCallback((): string => {
    const position = getPositionData();
    if (!position.hasPosition) {
      return "0";
    }
    // Convert raw number to properly formatted token amount
    const formatted = formatUnits(
      BigInt(Math.floor(position.assetsNumber)),
      decimals
    );
    return formatted;
  }, [getPositionData, decimals]);

  // Check if user has withdrawable position
  const hasWithdrawablePosition = useCallback((): boolean => {
    const position = getPositionData();
    return position.hasPosition;
  }, [getPositionData]);

  // Reset state
  const reset = useCallback(() => {
    setState({
      isLoading: false,
      error: null,
      txHash: null,
    });
  }, []);

  // Get position data for component use
  const position = getPositionData();

  return {
    // Main functions
    withdraw,
    getMaxWithdrawable, // Returns USD value for display
    getMaxWithdrawableTokens, // Returns token amount for transactions
    hasWithdrawablePosition,

    // Utility
    reset,

    // State
    ...state,

    // Position data (for convenience)
    userShares: position.shares,
    userAssets: position.assets,
    userAssetsUsd: position.assetsUsd,
    hasPosition: position.hasPosition,
  };
};
