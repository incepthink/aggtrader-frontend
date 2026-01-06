// /hooks/lend-morpho/useMorphoRepay.ts
"use client";

import React, { useState } from "react";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { parseUnits, formatUnits, Address, erc20Abi } from "viem";
import { MarketData } from "@/hooks/lend-morpho/MarketDetailHooks";

// Morpho Blue ABI - Repay and Withdraw functions
const MorphoBlueABI = [
  {
    name: "repay",
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
      { name: "data", type: "bytes" },
    ],
    outputs: [
      { name: "assetsRepaid", type: "uint256" },
      { name: "sharesRepaid", type: "uint256" },
    ],
  },
  {
    name: "withdrawCollateral",
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
      { name: "receiver", type: "address" },
    ],
    outputs: [],
  },
] as const;

const MORPHO_BLUE_ADDRESS = "0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb";

interface RepayParams {
  market: MarketData;
  repayAmount: string;
  withdrawAmount?: string;
}

export interface RepayState {
  isLoading: boolean;
  error: string | null;
  txHash: string | null;
  isApproving: boolean;
  needsApproval: boolean;
  allowance: bigint;
}

export const useMorphoRepay = () => {
  const [state, setState] = useState<RepayState>({
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

  const updateState = (updates: Partial<RepayState>) => {
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

  // Check current allowance for loan token (needed for repay)
  const checkAllowance = React.useCallback(
    async (
      loanTokenAddress: string,
      amount: string,
      decimals: number
    ): Promise<boolean> => {
      console.log("Checking loan token allowance for repay:", {
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
      if (loanTokenAddress === "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee") {
        return true;
      }

      try {
        const amountToRepay = parseUnits(amount, decimals);

        console.log("Checking loan token allowance:", {
          loanTokenAddress,
          morphoAddress: MORPHO_BLUE_ADDRESS,
          userAddress: address,
          amount: amountToRepay.toString(),
        });

        const allowance = await publicClient!.readContract({
          address: loanTokenAddress as Address,
          abi: erc20Abi,
          functionName: "allowance",
          args: [address!, MORPHO_BLUE_ADDRESS as Address],
        });

        console.log("Current loan token allowance:", allowance.toString());

        updateState({
          allowance,
          needsApproval: allowance < amountToRepay,
        });

        return allowance >= amountToRepay;
      } catch (error) {
        console.error("Error checking loan token allowance:", error);
        updateState({ error: "Failed to check token allowance" });
        return false;
      }
    },
    [address, isConnected, publicClient]
  );

  // Approve Morpho for loan token (needed for repay)
  const approve = React.useCallback(
    async (
      loanTokenAddress: string,
      amount: string,
      decimals: number
    ): Promise<boolean> => {
      console.log("Starting loan token approval for repay:", {
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
      if (loanTokenAddress === "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee") {
        return true;
      }

      updateState({ isApproving: true, error: null });

      try {
        const amountToRepay = parseUnits(amount, decimals);

        console.log("Approving loan token:", {
          loanTokenAddress,
          morphoAddress: MORPHO_BLUE_ADDRESS,
          userAddress: address,
          amount: amountToRepay.toString(),
        });

        const hash = await walletClient!.writeContract({
          address: loanTokenAddress as Address,
          abi: erc20Abi,
          functionName: "approve",
          args: [MORPHO_BLUE_ADDRESS as Address, amountToRepay],
        });

        console.log("Loan token approval transaction sent:", hash);

        // Wait for approval transaction
        const receipt = await publicClient!.waitForTransactionReceipt({ hash });

        if (receipt.status === "success") {
          console.log("Loan token approval successful:", hash);
          updateState({ isApproving: false, needsApproval: false });
          return true;
        } else {
          throw new Error("Approval transaction failed");
        }
      } catch (error) {
        console.error("Loan token approval error:", error);
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

  // Execute repay and optionally withdraw collateral
  const repay = React.useCallback(
    async ({
      market,
      repayAmount,
      withdrawAmount = "0",
    }: RepayParams): Promise<boolean> => {
      console.log("=== REPAY FUNCTION CALLED ===");
      console.log("Params:", {
        market: market.uniqueKey,
        repayAmount,
        withdrawAmount,
      });

      const validation = validateClients();
      if (!validation.valid) {
        console.log("Validation failed:", validation.error);
        updateState({ error: validation.error });
        return false;
      }

      if (!repayAmount || parseFloat(repayAmount) === 0) {
        console.log("Invalid repay amount:", repayAmount);
        updateState({ error: "Please enter a valid repay amount" });
        return false;
      }

      updateState({ isLoading: true, error: null, txHash: null });

      try {
        const repayAmountBN = parseUnits(
          repayAmount,
          market.loanAsset.decimals
        );
        const withdrawAmountBN = withdrawAmount
          ? parseUnits(withdrawAmount, market.collateralAsset.decimals)
          : BigInt(0);

        console.log("=== AMOUNTS PARSED ===");
        console.log("Repay amount BN:", repayAmountBN.toString());
        console.log("Withdraw amount BN:", withdrawAmountBN.toString());

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

        // Check allowance for loan token
        console.log("=== CHECKING LOAN TOKEN ALLOWANCE ===");
        const hasAllowance = await checkAllowance(
          market.loanAsset.address,
          repayAmount,
          market.loanAsset.decimals
        );

        console.log(
          "Has loan token allowance:",
          hasAllowance,
          "Needs approval:",
          state.needsApproval
        );

        if (!hasAllowance && state.needsApproval) {
          console.log("=== APPROVING LOAN TOKEN ===");
          const approved = await approve(
            market.loanAsset.address,
            repayAmount,
            market.loanAsset.decimals
          );
          if (!approved) {
            console.log("Loan token approval failed");
            updateState({ isLoading: false });
            return false;
          }
        }

        console.log("=== EXECUTING REPAY TRANSACTION ===");

        // Step 1: Repay debt
        console.log("=== REPAYING DEBT ===");
        console.log("Repay params:", {
          address: MORPHO_BLUE_ADDRESS,
          marketParams,
          assets: repayAmountBN.toString(),
          shares: "0",
          onBehalf: address,
        });

        const repayHash = await walletClient!.writeContract({
          address: MORPHO_BLUE_ADDRESS as Address,
          abi: MorphoBlueABI,
          functionName: "repay",
          args: [marketParams, repayAmountBN, BigInt(0), address!, "0x"],
        });

        console.log("Repay transaction sent:", repayHash);

        updateState({ txHash: repayHash });

        // Wait for repay transaction confirmation
        const repayReceipt = await publicClient!.waitForTransactionReceipt({
          hash: repayHash,
        });

        console.log("Repay receipt:", repayReceipt);

        if (repayReceipt.status !== "success") {
          throw new Error("Repay transaction failed");
        }

        // Step 2: Withdraw collateral if amount > 0
        if (withdrawAmountBN > BigInt(0)) {
          console.log("=== WITHDRAWING COLLATERAL ===");
          console.log("Withdraw params:", {
            address: MORPHO_BLUE_ADDRESS,
            marketParams,
            assets: withdrawAmountBN.toString(),
            onBehalf: address,
            receiver: address,
          });

          const withdrawHash = await walletClient!.writeContract({
            address: MORPHO_BLUE_ADDRESS as Address,
            abi: MorphoBlueABI,
            functionName: "withdrawCollateral",
            args: [marketParams, withdrawAmountBN, address!, address!],
          });

          console.log("Withdraw collateral transaction sent:", withdrawHash);

          // Wait for withdraw transaction confirmation
          const withdrawReceipt = await publicClient!.waitForTransactionReceipt(
            {
              hash: withdrawHash,
            }
          );

          console.log("Withdraw receipt:", withdrawReceipt);

          if (withdrawReceipt.status !== "success") {
            throw new Error("Withdraw collateral transaction failed");
          }

          // Update txHash to the withdraw transaction for UI purposes
          updateState({ txHash: withdrawHash });
        }

        console.log("=== REPAY/WITHDRAW SUCCESSFUL ===");
        updateState({ isLoading: false });
        return true;
      } catch (error) {
        console.error("=== REPAY/WITHDRAW ERROR ===");
        console.error("Full error:", error);

        let errorMessage = "Repay transaction failed";
        if (error instanceof Error) {
          console.error("Error message:", error.message);
          console.error("Error stack:", error.stack);

          if (error.message.includes("User rejected")) {
            errorMessage = "Transaction rejected by user";
          } else if (error.message.includes("insufficient funds")) {
            errorMessage = "Insufficient funds for transaction";
          } else if (error.message.includes("LLTV")) {
            errorMessage = "Operation would violate liquidation threshold";
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
    repay,
    approve,
    checkAllowance,
    reset,

    // State
    ...state,
  };
};