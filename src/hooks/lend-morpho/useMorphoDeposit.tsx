// hooks/useMorphoDeposit.ts
"use client";
import React, { useState } from "react";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { parseUnits, Address, erc20Abi } from "viem";

// MetaMorpho ABI - Deposit functions only
const MetaMorphoDepositABI = [
  {
    name: "deposit",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "assets", type: "uint256" },
      { name: "receiver", type: "address" },
    ],
    outputs: [{ name: "shares", type: "uint256" }],
  },
  {
    name: "previewDeposit",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "assets", type: "uint256" }],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

export interface DepositState {
  isLoading: boolean;
  error: string | null;
  txHash: string | null;
  isApproving: boolean;
  needsApproval: boolean;
  allowance: bigint;
}

export const useMorphoDeposit = (
  vaultAddress: string,
  assetAddress: string,
  decimals: number
) => {
  const [state, setState] = useState<DepositState>({
    isLoading: false,
    error: null,
    txHash: null,
    isApproving: false,
    needsApproval: false,
    allowance: BigInt(0),
  });

  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const updateState = (updates: Partial<DepositState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  };

  // Basic validation helper
  const validateConnection = () => {
    if (!address || !isConnected) {
      return { valid: false, error: "Wallet not connected" };
    }
    if (!publicClient) {
      return { valid: false, error: "Public client not available" };
    }
    if (!walletClient) {
      return { valid: false, error: "Wallet client not available" };
    }
    return { valid: true, error: null };
  };

  // Check current allowance for deposits
  const checkAllowance = React.useCallback(
    async (amount: string): Promise<boolean> => {
      if (!address || !isConnected || !publicClient) {
        return false;
      }

      // Skip approval for ETH
      if (assetAddress === "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee") {
        updateState({ needsApproval: false });
        return true;
      }

      try {
        const amountToDeposit = parseUnits(amount, decimals);

        const allowance = await publicClient.readContract({
          address: assetAddress as Address,
          abi: erc20Abi,
          functionName: "allowance",
          args: [address, vaultAddress as Address],
        });

        const needsApproval = allowance < amountToDeposit;

        updateState({
          allowance,
          needsApproval,
        });

        return !needsApproval;
      } catch (error) {
        console.error("Error checking allowance:", error);
        return false;
      }
    },
    [address, isConnected, publicClient, assetAddress, vaultAddress, decimals]
  );

  // Approve the vault for deposits (standalone function)
  const approve = React.useCallback(
    async (amount: string): Promise<boolean> => {
      const validation = validateConnection();
      if (!validation.valid) {
        updateState({ error: validation.error });
        return false;
      }

      // Skip approval for ETH
      if (assetAddress === "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee") {
        return true;
      }

      updateState({ isApproving: true, error: null });

      try {
        const amountToDeposit = parseUnits(amount, decimals);

        const hash = await walletClient!.writeContract({
          address: assetAddress as Address,
          abi: erc20Abi,
          functionName: "approve",
          args: [vaultAddress as Address, amountToDeposit],
        });

        // Wait for approval transaction
        const receipt = await publicClient!.waitForTransactionReceipt({ hash });

        if (receipt.status === "success") {
          updateState({ isApproving: false, needsApproval: false });
          return true;
        } else {
          throw new Error("Approval transaction failed");
        }
      } catch (error) {
        console.error("Approval error:", error);
        let errorMessage = "Approval failed";

        if (error instanceof Error) {
          if (error.message.includes("User rejected")) {
            errorMessage = "Transaction rejected by user";
          } else {
            errorMessage = error.message;
          }
        }

        updateState({
          isApproving: false,
          error: errorMessage,
        });
        return false;
      }
    },
    [
      address,
      isConnected,
      walletClient,
      publicClient,
      assetAddress,
      vaultAddress,
      decimals,
    ]
  );

  // Main deposit function - handles approval automatically like BorrowForm
  const deposit = React.useCallback(
    async (amount: string, receiver?: Address): Promise<boolean> => {
      const validation = validateConnection();
      if (!validation.valid) {
        updateState({ error: validation.error });
        return false;
      }

      updateState({ isLoading: true, error: null, txHash: null });

      try {
        const amountToDeposit = parseUnits(amount, decimals);
        const receiverAddress = receiver || address!;

        console.log("Starting deposit process:", {
          amount,
          amountToDeposit: amountToDeposit.toString(),
          assetAddress,
          vaultAddress,
          userAddress: address,
          receiverAddress,
        });

        // Handle approval automatically for ERC20 tokens
        if (assetAddress !== "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee") {
          console.log("Checking allowance for ERC20 token...");

          // Check current allowance
          const allowance = await publicClient!.readContract({
            address: assetAddress as Address,
            abi: erc20Abi,
            functionName: "allowance",
            args: [address!, vaultAddress as Address],
          });

          console.log("Current allowance:", allowance.toString());
          console.log("Required amount:", amountToDeposit.toString());

          // If allowance is insufficient, request approval first
          if (allowance < amountToDeposit) {
            console.log("Insufficient allowance, requesting approval...");
            updateState({ isApproving: true });

            try {
              const approvalHash = await walletClient!.writeContract({
                address: assetAddress as Address,
                abi: erc20Abi,
                functionName: "approve",
                args: [vaultAddress as Address, amountToDeposit],
              });

              console.log("Approval transaction sent:", approvalHash);

              // Wait for approval to complete
              const approvalReceipt =
                await publicClient!.waitForTransactionReceipt({
                  hash: approvalHash,
                });

              if (approvalReceipt.status !== "success") {
                throw new Error("Approval transaction failed");
              }

              console.log("Approval successful!");
            } catch (approvalError) {
              console.error("Approval failed:", approvalError);

              // Handle approval-specific errors
              if (
                approvalError instanceof Error &&
                approvalError.message.includes("User rejected")
              ) {
                updateState({
                  isLoading: false,
                  isApproving: false,
                  error: "Approval rejected by user",
                });
              } else {
                updateState({
                  isLoading: false,
                  isApproving: false,
                  error: "Approval failed",
                });
              }
              return false;
            }

            updateState({ isApproving: false });
          }
        }

        console.log("Executing deposit transaction...");

        // Execute deposit transaction
        const depositTxHash = await walletClient!.writeContract({
          address: vaultAddress as Address,
          abi: MetaMorphoDepositABI,
          functionName: "deposit",
          args: [amountToDeposit, receiverAddress],
        });

        console.log("Deposit transaction sent:", depositTxHash);

        updateState({ txHash: depositTxHash });

        // Wait for transaction confirmation
        const receipt = await publicClient!.waitForTransactionReceipt({
          hash: depositTxHash,
        });

        if (receipt.status === "success") {
          console.log("Deposit successful:", depositTxHash);
          updateState({
            isLoading: false,
            isApproving: false,
            needsApproval: false,
          });
          return true;
        } else {
          throw new Error("Deposit transaction failed");
        }
      } catch (error) {
        console.error("Deposit error:", error);

        let errorMessage = "Deposit failed";
        if (error instanceof Error) {
          if (error.message.includes("User rejected")) {
            errorMessage = "Transaction rejected by user";
          } else if (error.message.includes("insufficient")) {
            errorMessage = "Insufficient balance";
          } else {
            errorMessage = error.message;
          }
        }

        updateState({
          isLoading: false,
          isApproving: false,
          error: errorMessage,
        });
        return false;
      }
    },
    [
      address,
      isConnected,
      publicClient,
      walletClient,
      assetAddress,
      vaultAddress,
      decimals,
    ]
  );

  // Get deposit preview
  const previewDeposit = React.useCallback(
    async (amount: string): Promise<bigint | null> => {
      if (!publicClient || !amount) {
        return null;
      }

      try {
        const amountToDeposit = parseUnits(amount, decimals);

        const shares = await publicClient.readContract({
          address: vaultAddress as Address,
          abi: MetaMorphoDepositABI,
          functionName: "previewDeposit",
          args: [amountToDeposit],
        });

        return shares as bigint;
      } catch (error) {
        console.error("Preview deposit error:", error);
        return null;
      }
    },
    [publicClient, decimals, vaultAddress]
  );

  // Reset state
  const reset = React.useCallback(() => {
    setState({
      isLoading: false,
      error: null,
      txHash: null,
      isApproving: false,
      needsApproval: false,
      allowance: BigInt(0),
    });
  }, []);

  return {
    // Main functions
    deposit,
    approve,
    checkAllowance,
    previewDeposit,
    reset,

    // State
    ...state,
  };
};
