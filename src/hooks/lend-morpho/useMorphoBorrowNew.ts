// /hooks/lend-morpho/useMorphoBorrowNew.ts
"use client";

import { useState, useCallback } from "react";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { parseUnits, Address, erc20Abi, formatUnits } from "viem";
import { MarketData } from "@/hooks/lend-morpho/MarketDetailHooks";

// Morpho Blue contract address
const MORPHO_BLUE_ADDRESS = "0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb";

// Morpho Blue ABI - Only the functions we need
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

interface BorrowParams {
  market: MarketData;
  collateralAmount: string;
  borrowAmount: string;
}

interface BorrowState {
  isLoading: boolean;
  error: string | null;
  txHash: string | null;
  step: "idle" | "approving" | "supplying" | "borrowing" | "complete";
}

export const useMorphoBorrowNew = () => {
  const [state, setState] = useState<BorrowState>({
    isLoading: false,
    error: null,
    txHash: null,
    step: "idle",
  });

  const { address, isConnected, chainId } = useAccount();
  const publicClient = usePublicClient({ chainId });
  const { data: walletClient } = useWalletClient();

  const updateState = (updates: Partial<BorrowState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  };

  /**
   * Step 1: Check if collateral token needs approval
   */
  const checkAllowance = useCallback(
    async (
      tokenAddress: Address,
      amount: bigint
    ): Promise<boolean> => {
      if (!address || !publicClient) {
        console.log("❌ Cannot check allowance: missing address or publicClient");
        return false;
      }

      console.log("📋 Checking allowance...");
      console.log("  Token:", tokenAddress);
      console.log("  Spender:", MORPHO_BLUE_ADDRESS);
      console.log("  Amount needed:", amount.toString());

      try {
        const allowance = await publicClient.readContract({
          address: tokenAddress,
          abi: erc20Abi,
          functionName: "allowance",
          args: [address, MORPHO_BLUE_ADDRESS as Address],
        });

        console.log("  Current allowance:", allowance.toString());

        const hasEnoughAllowance = allowance >= amount;
        console.log(hasEnoughAllowance ? "✅ Allowance sufficient" : "⚠️ Approval required");

        return hasEnoughAllowance;
      } catch (error) {
        console.error("❌ Error checking allowance:", error);
        return false;
      }
    },
    [address, publicClient]
  );

  /**
   * Step 2: Approve collateral token
   */
  const approveToken = useCallback(
    async (
      tokenAddress: Address,
      amount: bigint
    ): Promise<boolean> => {
      if (!address || !walletClient || !publicClient) {
        console.log("❌ Cannot approve: missing wallet client");
        updateState({ error: "Wallet not connected" });
        return false;
      }

      updateState({ step: "approving", error: null });

      console.log("\n🔐 STEP 1: Approving collateral token...");
      console.log("  Token:", tokenAddress);
      console.log("  Spender:", MORPHO_BLUE_ADDRESS);
      console.log("  Amount:", amount.toString());

      try {
        const hash = await walletClient.writeContract({
          address: tokenAddress,
          abi: erc20Abi,
          functionName: "approve",
          args: [MORPHO_BLUE_ADDRESS as Address, amount],
        });

        console.log("  📝 Approval tx sent:", hash);
        console.log("  ⏳ Waiting for confirmation...");

        const receipt = await publicClient.waitForTransactionReceipt({ hash });

        if (receipt.status === "success") {
          console.log("  ✅ Approval confirmed!");
          return true;
        } else {
          throw new Error("Approval transaction failed");
        }
      } catch (error: any) {
        console.error("  ❌ Approval failed:", error);

        let errorMessage = "Approval failed";
        if (error.message?.includes("User rejected")) {
          errorMessage = "User rejected approval";
        }

        updateState({ error: errorMessage, step: "idle" });
        return false;
      }
    },
    [address, walletClient, publicClient]
  );

  /**
   * Step 3: Supply collateral to Morpho
   */
  const supplyCollateral = useCallback(
    async (
      market: MarketData,
      collateralAmountBN: bigint
    ): Promise<boolean> => {
      if (!address || !walletClient || !publicClient) {
        console.log("❌ Cannot supply: missing wallet client");
        return false;
      }

      updateState({ step: "supplying" });

      console.log("\n💰 STEP 2: Supplying collateral...");

      const marketParams = {
        loanToken: market.loanAsset.address as Address,
        collateralToken: market.collateralAsset.address as Address,
        oracle: market.oracleAddress as Address,
        irm: market.irmAddress as Address,
        lltv: BigInt(market.lltv),
      };

      console.log("  Market params:", {
        loanToken: marketParams.loanToken,
        collateralToken: marketParams.collateralToken,
        oracle: marketParams.oracle,
        irm: marketParams.irm,
        lltv: marketParams.lltv.toString(),
      });
      console.log("  Amount:", collateralAmountBN.toString());
      console.log("  On behalf:", address);

      try {
        const hash = await walletClient.writeContract({
          address: MORPHO_BLUE_ADDRESS as Address,
          abi: MorphoBlueABI,
          functionName: "supplyCollateral",
          args: [
            marketParams,
            collateralAmountBN,
            address,
            "0x" // empty callback data
          ],
        });

        console.log("  📝 Supply tx sent:", hash);
        console.log("  ⏳ Waiting for confirmation...");

        const receipt = await publicClient.waitForTransactionReceipt({ hash });

        console.log("  Receipt status:", receipt.status);
        console.log("  Gas used:", receipt.gasUsed.toString());
        console.log("  Logs emitted:", receipt.logs.length);

        if (receipt.status === "success") {
          if (receipt.logs.length > 0) {
            console.log("  ✅ Collateral supplied successfully!");
            console.log("  📊 Events emitted:", receipt.logs.length);
            return true;
          } else {
            console.log("  ⚠️ Transaction succeeded but no events emitted");
            console.log("  This may indicate the operation had no effect");
            return false;
          }
        } else {
          throw new Error("Supply collateral transaction failed");
        }
      } catch (error: any) {
        console.error("  ❌ Supply failed:", error);
        updateState({ error: error.message || "Supply failed", step: "idle" });
        return false;
      }
    },
    [address, walletClient, publicClient]
  );

  /**
   * Step 4: Borrow assets from Morpho
   */
  const borrowAssets = useCallback(
    async (
      market: MarketData,
      borrowAmountBN: bigint
    ): Promise<string | null> => {
      if (!address || !walletClient || !publicClient) {
        console.log("❌ Cannot borrow: missing wallet client");
        return null;
      }

      updateState({ step: "borrowing" });

      console.log("\n💸 STEP 3: Borrowing assets...");

      const marketParams = {
        loanToken: market.loanAsset.address as Address,
        collateralToken: market.collateralAsset.address as Address,
        oracle: market.oracleAddress as Address,
        irm: market.irmAddress as Address,
        lltv: BigInt(market.lltv),
      };

      console.log("  Market params:", {
        loanToken: marketParams.loanToken,
        collateralToken: marketParams.collateralToken,
      });
      console.log("  Borrow amount:", borrowAmountBN.toString());
      console.log("  Shares:", "0 (using assets)");
      console.log("  On behalf:", address);
      console.log("  Receiver:", address);

      try {
        const hash = await walletClient.writeContract({
          address: MORPHO_BLUE_ADDRESS as Address,
          abi: MorphoBlueABI,
          functionName: "borrow",
          args: [
            marketParams,
            borrowAmountBN,
            BigInt(0), // shares = 0 means we're using assets parameter
            address,    // onBehalf
            address     // receiver
          ],
        });

        console.log("  📝 Borrow tx sent:", hash);
        console.log("  ⏳ Waiting for confirmation...");

        const receipt = await publicClient.waitForTransactionReceipt({ hash });

        console.log("  Receipt status:", receipt.status);
        console.log("  Gas used:", receipt.gasUsed.toString());
        console.log("  Logs emitted:", receipt.logs.length);

        if (receipt.status === "success") {
          if (receipt.logs.length > 0) {
            console.log("  ✅ Borrow successful!");
            console.log("  📊 Events emitted:", receipt.logs.length);
            updateState({ txHash: hash, step: "complete" });
            return hash;
          } else {
            console.log("  ⚠️ Transaction succeeded but no events emitted");
            updateState({ error: "Borrow had no effect", step: "idle" });
            return null;
          }
        } else {
          throw new Error("Borrow transaction failed");
        }
      } catch (error: any) {
        console.error("  ❌ Borrow failed:", error);

        let errorMessage = "Borrow failed";
        if (error.message?.includes("insufficient collateral")) {
          errorMessage = "Insufficient collateral for borrow amount";
        } else if (error.message?.includes("User rejected")) {
          errorMessage = "User rejected transaction";
        }

        updateState({ error: errorMessage, step: "idle" });
        return null;
      }
    },
    [address, walletClient, publicClient]
  );

  /**
   * Main function: Execute complete borrow flow
   */
  const borrow = useCallback(
    async ({ market, collateralAmount, borrowAmount }: BorrowParams): Promise<boolean> => {
      console.log("\n" + "=".repeat(60));
      console.log("🚀 STARTING MORPHO BORROW FLOW");
      console.log("=".repeat(60));
      console.log("Market:", market.uniqueKey);
      console.log("Collateral:", collateralAmount, market.collateralAsset.symbol);
      console.log("Borrow:", borrowAmount, market.loanAsset.symbol);
      console.log("=".repeat(60));

      // Validate inputs
      if (!address || !isConnected) {
        updateState({ error: "Wallet not connected" });
        return false;
      }

      if (!walletClient) {
        updateState({ error: "Wallet client not ready - please try again" });
        return false;
      }

      if (!collateralAmount || !borrowAmount) {
        updateState({ error: "Invalid amounts" });
        return false;
      }

      updateState({ isLoading: true, error: null, step: "idle" });

      try {
        // Parse amounts to BigInt
        const collateralAmountBN = parseUnits(
          collateralAmount,
          market.collateralAsset.decimals
        );
        const borrowAmountBN = parseUnits(
          borrowAmount,
          market.loanAsset.decimals
        );

        console.log("\n📊 Parsed amounts:");
        console.log("  Collateral:", collateralAmountBN.toString(), "units");
        console.log("  Borrow:", borrowAmountBN.toString(), "units");

        // STEP 1: Check and approve collateral if needed
        const hasAllowance = await checkAllowance(
          market.collateralAsset.address as Address,
          collateralAmountBN
        );

        if (!hasAllowance) {
          const approved = await approveToken(
            market.collateralAsset.address as Address,
            collateralAmountBN
          );

          if (!approved) {
            console.log("\n❌ FLOW ABORTED: Approval failed");
            updateState({ isLoading: false });
            return false;
          }
        } else {
          console.log("\n✅ Approval not needed (sufficient allowance)");
        }

        // STEP 2: Supply collateral
        const supplied = await supplyCollateral(market, collateralAmountBN);

        if (!supplied) {
          console.log("\n❌ FLOW ABORTED: Supply collateral failed");
          updateState({ isLoading: false });
          return false;
        }

        // STEP 3: Borrow assets
        const txHash = await borrowAssets(market, borrowAmountBN);

        if (!txHash) {
          console.log("\n❌ FLOW ABORTED: Borrow failed");
          updateState({ isLoading: false });
          return false;
        }

        // Success!
        console.log("\n" + "=".repeat(60));
        console.log("✅ BORROW FLOW COMPLETE!");
        console.log("   Transaction hash:", txHash);
        console.log("=".repeat(60) + "\n");

        updateState({ isLoading: false });
        return true;

      } catch (error: any) {
        console.error("\n" + "=".repeat(60));
        console.error("❌ BORROW FLOW ERROR");
        console.error("=".repeat(60));
        console.error(error);
        console.error("=".repeat(60) + "\n");

        updateState({
          isLoading: false,
          error: error.message || "Borrow flow failed",
          step: "idle",
        });
        return false;
      }
    },
    [
      address,
      isConnected,
      walletClient,
      checkAllowance,
      approveToken,
      supplyCollateral,
      borrowAssets,
    ]
  );

  const reset = useCallback(() => {
    setState({
      isLoading: false,
      error: null,
      txHash: null,
      step: "idle",
    });
  }, []);

  return {
    borrow,
    reset,
    ...state,
  };
};
