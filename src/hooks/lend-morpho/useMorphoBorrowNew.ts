// /hooks/lend-morpho/useMorphoBorrowNew.ts
"use client";

import { useState, useCallback } from "react";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { parseUnits, Address } from "viem";
import { MarketData } from "@/hooks/lend-morpho/MarketDetailHooks";

import { type Account, WalletClient, zeroAddress } from "viem";
import { parseAccount } from "viem/accounts";
 
import {
  addresses,
  ChainId,
  DEFAULT_SLIPPAGE_TOLERANCE,
  MarketId,
  MarketParams,
  UnknownMarketParamsError,
  getUnwrappedToken,
  Market,
} from "@morpho-org/blue-sdk";
import {
  type BundlingOptions,
  type InputBundlerOperation,
  type BundlerOperation,
  encodeBundle,
  finalizeBundle,
  populateBundle,
} from "@morpho-org/bundler-sdk-viem";
import "@morpho-org/blue-sdk-viem/lib/augment";
import "@morpho-org/blue-sdk-viem/lib/augment/Market";
import {
  SimulationState,
} from "@morpho-org/simulation-sdk";
import { morph } from "viem/chains";

// Morpho Blue contract address (kept for reference, bundler handles the actual calls)
const MORPHO_BLUE_ADDRESS = "0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb";

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
   * Setup and execute bundled Morpho operations
   * This function handles approval, collateral supply, and borrowing in a single transaction
   */
  const setupBundle = async (
  client: WalletClient,
  startData: SimulationState,
  inputOperations: InputBundlerOperation[],
  {
    account: account_ = client.account,
    supportsSignature,
    unwrapTokens,
    unwrapSlippage,
    onBundleTx,
    ...options
  }: BundlingOptions & {
    account?: Address | Account;
    supportsSignature?: boolean;
    unwrapTokens?: Set<Address>;
    unwrapSlippage?: bigint;
    onBundleTx?: (data: SimulationState) => Promise<void> | void;
  } = {}
) => {
  if (!account_) throw new Error("Account is required");
  const account = parseAccount(account_);

  let { operations } = populateBundle(inputOperations, startData, {
    ...options,
    publicAllocatorOptions: {
      enabled: true,
      ...options.publicAllocatorOptions,
    },
  });
  operations = finalizeBundle(
    operations,
    startData,
    account.address,
    unwrapTokens,
    unwrapSlippage
  );
 
  const bundle = encodeBundle(operations, startData, supportsSignature);
 
  const tokens = new Set<Address>();

  operations.forEach((operation) => {
    // BundlerOperation has similar structure to Operation but with omitted callback
    // We can safely check the type field which exists on both
    if (
      operation.type.startsWith("Blue_") &&
      operation.type !== "Blue_SetAuthorization" &&
      'args' in operation &&
      'id' in (operation.args as any)
    ) {
      try {
        const marketParams = MarketParams.get((operation.args as any).id);

        if (marketParams.loanToken !== zeroAddress)
          tokens.add(marketParams.loanToken);

        if (marketParams.collateralToken !== zeroAddress)
          tokens.add(marketParams.collateralToken);
      } catch (error) {
        if (!(error instanceof UnknownMarketParamsError)) throw error;
      }
    }

    if (operation.type.startsWith("MetaMorpho_") && 'address' in operation) {
      tokens.add(operation.address as Address);

      const vault = startData.tryGetVault(operation.address as Address);
      if (vault) tokens.add(vault.asset);
    }

    if (operation.type.startsWith("Erc20_") && 'address' in operation) {
      tokens.add(operation.address as Address);

      const unwrapped = getUnwrappedToken(operation.address as Address, startData.chainId);
      if (unwrapped != null) tokens.add(unwrapped);
    }
  });
 
  await onBundleTx?.(startData);
 
  // here EOA should sign tx, if it is a contract, this can be ignored/removed
  await Promise.all(
    bundle.requirements.signatures.map((requirement) =>
      requirement.sign(client, account)
    )
  );
 
  const txs = bundle.requirements.txs.map(({ tx }) => tx).concat([bundle.tx()]);

  for (const tx of txs) {
    // Remove the type field to avoid conflicts with viem's type expectations
    const { type, ...txWithoutType } = tx;
    await client.sendTransaction({ ...txWithoutType, account } as any);
  }
 
  return { operations, bundle };
};

  /**
   * Main function: Execute complete borrow flow using Morpho bundlers
   * This combines collateral supply and borrowing into a single seamless transaction
   */
  const borrow = useCallback(
    async ({ market, collateralAmount, borrowAmount }: BorrowParams): Promise<boolean> => {
      console.log("\n" + "=".repeat(60));
      console.log("🚀 STARTING MORPHO BORROW FLOW (BUNDLER)");
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

      if (!publicClient) {
        updateState({ error: "Public client not ready - please try again" });
        return false;
      }

      if (!collateralAmount || !borrowAmount) {
        updateState({ error: "Invalid amounts" });
        return false;
      }

      if (!chainId) {
        updateState({ error: "Chain ID not available" });
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

        // Get the market ID from the market unique key
        const marketId = market.uniqueKey as MarketId;
        console.log("\n📡 Fetching market data from blockchain...");
        console.log("  Market ID:", marketId);
        console.log("  Chain ID:", chainId);

        // Fetch market data from blockchain
        let fetchedMarket: Market;
        try {
          fetchedMarket = await Market.fetch(marketId, publicClient);
          console.log("  ✅ Market data loaded successfully", fetchedMarket);
        } catch (error) {
          console.error("  ❌ Failed to fetch market data:", error);
          throw new Error("Market not found on-chain. Please verify the market exists and is valid.");
        }

        // Initialize SimulationState for bundler with fetched market data
        console.log("\n🔄 Initializing simulation state with market data...");

        // Get current block information
        const block = await publicClient.getBlock();

        const simulationState = new SimulationState({
          chainId: chainId,
          block: {
            number: block.number,
            timestamp: block.timestamp,
          },
          markets: {
            [marketId]: fetchedMarket,
          },
        });

        // Execute bundled transaction using setupBundle
        console.log("\n📦 Creating bundled transaction...");
        updateState({ step: "approving" });

        const { operations, bundle } = await setupBundle(
          walletClient,
          simulationState,
          [
            {
              type: "Blue_SupplyCollateral",
              sender: address,
              args: {
                id: marketId,
                assets: collateralAmountBN,
                onBehalf: address,
              },
            },
            {
              type: "Blue_Borrow",
              sender: address,
              args: {
                id: marketId,
                assets: borrowAmountBN,
                onBehalf: address,
                receiver: address,
                slippage: DEFAULT_SLIPPAGE_TOLERANCE,
              },
            },
          ]
        );

        console.log("  ✅ Bundle created with", operations.length, "operations");
        console.log("  📋 Operations:", operations.map(op => op.type).join(", "));

        // The setupBundle function already executes the transaction
        console.log("\n" + "=".repeat(60));
        console.log("✅ BORROW FLOW COMPLETE (BUNDLED)!");
        console.log("   Executed", operations.length, "operations in a single transaction");
        console.log("=".repeat(60) + "\n");

        updateState({ isLoading: false, step: "complete" });
        return true;

      } catch (error: any) {
        console.error("\n" + "=".repeat(60));
        console.error("❌ BORROW FLOW ERROR");
        console.error("=".repeat(60));
        console.error(error);
        console.error("=".repeat(60) + "\n");

        let errorMessage = "Borrow flow failed";
        if (error.message?.includes("User rejected")) {
          errorMessage = "User rejected transaction";
        } else if (error.message?.includes("insufficient")) {
          errorMessage = "Insufficient collateral or balance";
        } else if (error.message) {
          errorMessage = error.message;
        }

        updateState({
          isLoading: false,
          error: errorMessage,
          step: "idle",
        });
        return false;
      }
    },
    [
      address,
      isConnected,
      walletClient,
      publicClient,
      chainId,
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
