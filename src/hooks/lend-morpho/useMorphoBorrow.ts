// /hooks/lend-morpho/useMorphoBorrow.ts
"use client";

import React, { useState } from "react";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { parseUnits, formatUnits, Address, erc20Abi } from "viem";
import { MarketData } from "@/hooks/lend-morpho/MarketDetailHooks";

// Morpho Blue ABI - Core functions
const MorphoBlueABI = [
  {
    name: "supplyCollateral",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      {
        name: "marketParams",
        type: "tuple",
        components: [
          { name: "loanToken", type: "address" },
          { name: "collateralToken", type: "address" },
          { name: "oracle", type: "address" },
          { name: "irm", type: "address" },
          { name: "lltv", type: "uint256" },
        ],
      },
      { name: "assets", type: "uint256" },
      { name: "onBehalf", type: "address" },
      { name: "data", type: "bytes" },
    ],
    outputs: [],
  },
  {
    name: "borrow",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      {
        name: "marketParams",
        type: "tuple",
        components: [
          { name: "loanToken", type: "address" },
          { name: "collateralToken", type: "address" },
          { name: "oracle", type: "address" },
          { name: "irm", type: "address" },
          { name: "lltv", type: "uint256" },
        ],
      },
      { name: "assets", type: "uint256" },
      { name: "shares", type: "uint256" },
      { name: "onBehalf", type: "address" },
      { name: "receiver", type: "address" },
    ],
    outputs: [
      { name: "assetsBorrowed", type: "uint256" },
      { name: "sharesBorrowed", type: "uint256" },
    ],
  },
] as const;

const MORPHO_BLUE_ADDRESS = "0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb";

interface BorrowParams {
  market: MarketData;
  collateralAmount: string;
  borrowAmount: string;
}

export interface BorrowState {
  isLoading: boolean;
  error: string | null;
  txHash: string | null;
  isApproving: boolean;
  needsApproval: boolean;
  allowance: bigint;
}

export const useMorphoBorrow = () => {
  const [state, setState] = useState<BorrowState>({
    isLoading: false,
    error: null,
    txHash: null,
    isApproving: false,
    needsApproval: false,
    allowance: BigInt(0),
  });

  const { address, isConnected, chainId } = useAccount();
  const publicClient = usePublicClient({ chainId });
  const { data: walletClient } = useWalletClient();

  const updateState = (updates: Partial<BorrowState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  };

  // Validation helper
  const validateClients = () => {
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
  };

  // Check current allowance for collateral
  const checkAllowance = React.useCallback(
    async (
      collateralAddress: string,
      amount: string,
      decimals: number
    ): Promise<boolean> => {
      console.log("Checking allowance for borrow:", {
        address,
        isConnected,
        publicClient: !!publicClient,
      });

      const validation = validateClients();
      if (!validation.valid) {
        console.log("Validation failed:", validation.error);
        updateState({ error: validation.error });
        return false;
      }

      // Skip approval for ETH
      if (collateralAddress === "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee") {
        return true;
      }

      try {
        const amountToSupply = parseUnits(amount, decimals);

        console.log("Checking collateral allowance:", {
          collateralAddress,
          morphoAddress: MORPHO_BLUE_ADDRESS,
          userAddress: address,
          amount: amountToSupply.toString(),
        });

        const allowance = await publicClient!.readContract({
          address: collateralAddress as Address,
          abi: erc20Abi,
          functionName: "allowance",
          args: [address!, MORPHO_BLUE_ADDRESS as Address],
        });

        console.log("Current allowance:", allowance.toString());

        updateState({
          allowance,
          needsApproval: allowance < amountToSupply,
        });

        return allowance >= amountToSupply;
      } catch (error) {
        console.error("Error checking allowance:", error);
        updateState({ error: "Failed to check token allowance" });
        return false;
      }
    },
    [address, isConnected, publicClient]
  );

  // Approve Morpho for collateral
  const approve = React.useCallback(
    async (
      collateralAddress: string,
      amount: string,
      decimals: number
    ): Promise<boolean> => {
      console.log("Starting approval for borrow:", {
        address,
        isConnected,
        walletClient: !!walletClient,
      });

      const validation = validateClients();
      if (!validation.valid) {
        updateState({ error: validation.error });
        return false;
      }

      // Skip approval for ETH
      if (collateralAddress === "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee") {
        return true;
      }

      updateState({ isApproving: true, error: null });

      try {
        const amountToSupply = parseUnits(amount, decimals);

        console.log("Approving collateral token:", {
          collateralAddress,
          morphoAddress: MORPHO_BLUE_ADDRESS,
          userAddress: address,
          amount: amountToSupply.toString(),
        });

        const hash = await walletClient!.writeContract({
          address: collateralAddress as Address,
          abi: erc20Abi,
          functionName: "approve",
          args: [MORPHO_BLUE_ADDRESS as Address, amountToSupply],
        });

        console.log("Approval transaction sent:", hash);

        // Wait for approval transaction
        const receipt = await publicClient!.waitForTransactionReceipt({ hash });

        if (receipt.status === "success") {
          console.log("Approval successful:", hash);
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
          } else if (error.message.includes("zero address")) {
            errorMessage =
              "Wallet not properly connected - please disconnect and reconnect";
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
    [address, isConnected, walletClient, publicClient]
  );

  // Execute borrow with collateral supply
  const borrow = React.useCallback(
    async ({
      market,
      collateralAmount,
      borrowAmount,
    }: BorrowParams): Promise<boolean> => {
      console.log("=== BORROW FUNCTION CALLED ===");
      console.log("Params:", {
        market: market.uniqueKey,
        collateralAmount,
        borrowAmount,
      });

      const validation = validateClients();
      if (!validation.valid) {
        console.log("Validation failed:", validation.error);
        updateState({ error: validation.error });
        return false;
      }

      if (!collateralAmount || !borrowAmount) {
        console.log("Invalid amounts:", { collateralAmount, borrowAmount });
        updateState({ error: "Please enter valid amounts" });
        return false;
      }

      updateState({ isLoading: true, error: null, txHash: null });

      try {
        const collateralAmountBN = parseUnits(
          collateralAmount,
          market.collateralAsset.decimals
        );
        const borrowAmountBN = parseUnits(
          borrowAmount,
          market.loanAsset.decimals
        );

        console.log("=== AMOUNTS PARSED ===");
        console.log("Collateral amount BN:", collateralAmountBN.toString());
        console.log("Borrow amount BN:", borrowAmountBN.toString());

        // Market parameters for Morpho
        const marketParams = {
          loanToken: market.loanAsset.address as Address,
          collateralToken: market.collateralAsset.address as Address,
          oracle: market.oracleAddress as Address,
          irm: market.irmAddress as Address,
          lltv: BigInt(market.lltv),
        };

        console.log("=== MARKET PARAMS ===");
        console.log("Market params:", marketParams);

        // Check allowance first if supplying collateral
        if (collateralAmountBN > BigInt(0)) {
          console.log("=== CHECKING ALLOWANCE ===");
          const hasAllowance = await checkAllowance(
            market.collateralAsset.address,
            collateralAmount,
            market.collateralAsset.decimals
          );

          console.log(
            "Has allowance:",
            hasAllowance,
            "Needs approval:",
            state.needsApproval
          );

          if (!hasAllowance && state.needsApproval) {
            console.log("=== APPROVING TOKEN ===");
            const approved = await approve(
              market.collateralAsset.address,
              collateralAmount,
              market.collateralAsset.decimals
            );
            if (!approved) {
              console.log("Approval failed");
              updateState({ isLoading: false });
              return false;
            }
          }
        }

        console.log("=== EXECUTING TRANSACTIONS ===");

        // Step 1: Supply collateral if amount > 0
        if (collateralAmountBN > BigInt(0)) {
          console.log("=== SUPPLYING COLLATERAL ===");
          console.log("Supply params:", {
            address: MORPHO_BLUE_ADDRESS,
            marketParams,
            assets: collateralAmountBN.toString(),
            onBehalf: address,
          });

          const supplyHash = await walletClient!.writeContract({
            address: MORPHO_BLUE_ADDRESS as Address,
            abi: MorphoBlueABI,
            functionName: "supplyCollateral",
            args: [marketParams, collateralAmountBN, address!, "0x"],
          });

          console.log("Supply collateral transaction sent:", supplyHash);

          const supplyReceipt = await publicClient!.waitForTransactionReceipt({
            hash: supplyHash,
          });

          console.log("Supply receipt:", supplyReceipt);

          if (supplyReceipt.status !== "success") {
            throw new Error("Supply collateral transaction failed");
          }
        }

        // Step 2: Borrow assets
        console.log("=== BORROWING ASSETS ===");
        console.log("Borrow params:", {
          address: MORPHO_BLUE_ADDRESS,
          marketParams,
          assets: borrowAmountBN.toString(),
          shares: "0",
          onBehalf: address,
          receiver: address,
        });

        const borrowHash = await walletClient!.writeContract({
          address: MORPHO_BLUE_ADDRESS as Address,
          abi: MorphoBlueABI,
          functionName: "borrow",
          args: [marketParams, borrowAmountBN, BigInt(0), address!, address!],
        });

        console.log("Borrow transaction sent:", borrowHash);

        updateState({ txHash: borrowHash });

        // Wait for borrow transaction confirmation
        const borrowReceipt = await publicClient!.waitForTransactionReceipt({
          hash: borrowHash,
        });

        console.log("Borrow receipt:", borrowReceipt);

        if (borrowReceipt.status === "success") {
          console.log("=== BORROW SUCCESSFUL ===");
          updateState({ isLoading: false });
          return true;
        } else {
          throw new Error("Borrow transaction failed");
        }
      } catch (error) {
        console.error("=== BORROW ERROR ===");
        console.error("Full error:", error);

        let errorMessage = "Borrow transaction failed";
        if (error instanceof Error) {
          console.error("Error message:", error.message);
          console.error("Error stack:", error.stack);

          if (error.message.includes("User rejected")) {
            errorMessage = "Transaction rejected by user";
          } else if (error.message.includes("LLTV")) {
            errorMessage = "Position would exceed liquidation threshold";
          } else if (error.message.includes("insufficient funds")) {
            errorMessage = "Insufficient funds for transaction";
          } else {
            errorMessage = error.message;
          }
        }

        updateState({
          isLoading: false,
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
      checkAllowance,
      approve,
      state.needsApproval,
    ]
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
    borrow,
    approve,
    checkAllowance,
    reset,

    // State
    ...state,
  };
};
