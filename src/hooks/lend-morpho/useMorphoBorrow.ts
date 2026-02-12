// /hooks/lend-morpho/useMorphoBorrow.ts
"use client";

import React, { useState } from "react";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { parseUnits, formatUnits, Address, erc20Abi } from "viem";
import { MarketData } from "@/hooks/lend-morpho/MarketDetailHooks";
import { addresses } from "@morpho-org/blue-sdk";

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

const {
  morpho,
} = addresses[747474];

const MORPHO_BLUE_ADDRESS = morpho;


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
        console.log("=== CHECKING ALLOWANCE ===");
        console.log("Checking allowance for borrow:", {
          address,
          isConnected,
          publicClient: !!publicClient,
        });

        // Only validate what we need for READ operation
        // Note: walletClient is NOT needed for checking allowance (read-only)
        if (!address || !isConnected) {
          console.log("❌ Wallet not connected");
          return false;
        }

        if (!publicClient) {
          console.log("❌ Public client not available");
          return false;
        }

        // Skip approval for ETH
        if (collateralAddress === "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee") {
          console.log("✓ Native ETH - no approval needed");
          return true;
        }

        try {
          const amountToSupply = parseUnits(amount, decimals);

          console.log("Reading allowance from contract:", {
            collateralAddress,
            morphoAddress: MORPHO_BLUE_ADDRESS,
            userAddress: address,
            amountNeeded: amountToSupply.toString(),
          });

          const allowance = await publicClient!.readContract({
            address: collateralAddress as Address,
            abi: erc20Abi,
            functionName: "allowance",
            args: [address!, MORPHO_BLUE_ADDRESS as Address],
          });

          console.log("Current allowance:", allowance.toString());
          console.log("Required amount:", amountToSupply.toString());

          const hasEnoughAllowance = allowance >= amountToSupply;
          console.log("Has enough allowance:", hasEnoughAllowance);

          // ✅ CRITICAL: Update state regardless of result
          updateState({
            allowance,
            needsApproval: !hasEnoughAllowance,
          });

          if (!hasEnoughAllowance) {
            console.log("⚠️ APPROVAL NEEDED - Current allowance insufficient");
          } else {
            console.log("✓ Allowance sufficient - no approval needed");
          }

          return hasEnoughAllowance;
        } catch (error) {
          console.error("❌ Error checking allowance:", error);
          updateState({
            error: "Failed to check token allowance",
            needsApproval: true // Assume approval needed on error
          });
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
        console.log("=== STARTING APPROVAL ===");
        console.log("Approval params:", {
          address,
          isConnected,
          walletClient: !!walletClient,
          collateralAddress,
          amount,
        });

        // NOW we need walletClient for WRITE operation
        if (!address || !isConnected) {
          const error = "Wallet not connected";
          console.log("❌", error);
          updateState({ error });
          return false;
        }

        if (!publicClient) {
          const error = "Public client not available";
          console.log("❌", error);
          updateState({ error });
          return false;
        }

        if (!walletClient) {
          const error = "Wallet client not available - please wait and try again";
          console.log("❌", error);
          updateState({ error });
          return false;
        }

        // Skip approval for ETH
        if (collateralAddress === "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee") {
          console.log("✓ Native ETH - no approval needed");
          return true;
        }

        updateState({ isApproving: true, error: null });

        try {
          const amountToSupply = parseUnits(amount, decimals);

          console.log("Calling approve on ERC20:", {
            collateralAddress,
            spender: MORPHO_BLUE_ADDRESS,
            amount: amountToSupply.toString(),
          });

          // THIS SHOULD TRIGGER METAMASK POPUP
          const hash = await walletClient!.writeContract({
            address: collateralAddress as Address,
            abi: erc20Abi,
            functionName: "approve",
            args: [MORPHO_BLUE_ADDRESS as Address, amountToSupply],
          });

          console.log("✓ Approval transaction sent:", hash);
          console.log("⏳ Waiting for approval confirmation...");

          // Wait for approval transaction
          const receipt = await publicClient!.waitForTransactionReceipt({ hash });

          console.log("Approval receipt:", receipt);

          if (receipt.status === "success") {
            console.log("✅ APPROVAL SUCCESSFUL:", hash);
            updateState({
              isApproving: false,
              needsApproval: false,
              allowance: amountToSupply // Update allowance to approved amount
            });
            return true;
          } else {
            throw new Error("Approval transaction failed");
          }
        } catch (error) {
          console.error("❌ Approval error:", error);
          let errorMessage = "Approval failed";

          if (error instanceof Error) {
            if (error.message.includes("User rejected")) {
              errorMessage = "Transaction rejected by user";
            } else if (error.message.includes("zero address")) {
              errorMessage = "Wallet not properly connected - please disconnect and reconnect";
            } else {
              errorMessage = error.message;
            }
          }

          console.log("Error message:", errorMessage);

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
      if (!address || !isConnected) {
          console.log("Wallet not connected");
          return false;
        }

        if (!publicClient) {
          console.log("Public client not available");
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
