// hooks/useMorphoDeposit.ts
"use client";
import { useState, useCallback } from "react";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { parseUnits, Address } from "viem";
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
  Vault,
  VaultMarketConfig,
  Position,
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
import "@morpho-org/blue-sdk-viem/lib/augment/Vault";
import "@morpho-org/blue-sdk-viem/lib/augment/VaultMarketConfig";
import "@morpho-org/blue-sdk-viem/lib/augment/Position";
import { SimulationState } from "@morpho-org/simulation-sdk";

export interface DepositState {
  isLoading: boolean;
  error: string | null;
  txHash: string | null;
  step: "idle" | "approving" | "depositing" | "complete";
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
    step: "idle",
  });

  const { address, isConnected, chainId } = useAccount();
  const publicClient = usePublicClient({ chainId });
  const { data: walletClient } = useWalletClient();

  const updateState = (updates: Partial<DepositState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  };

  /**
   * Setup and execute bundled Morpho operations
   * This function handles approval and deposit in a single transaction
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
      if (
        operation.type.startsWith("Blue_") &&
        operation.type !== "Blue_SetAuthorization" &&
        "args" in operation &&
        "id" in (operation.args as any)
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

      if (operation.type.startsWith("MetaMorpho_") && "address" in operation) {
        tokens.add(operation.address as Address);

        const vault = startData.tryGetVault(operation.address as Address);
        if (vault) tokens.add(vault.asset);
      }

      if (operation.type.startsWith("Erc20_") && "address" in operation) {
        tokens.add(operation.address as Address);

        const unwrapped = getUnwrappedToken(
          operation.address as Address,
          startData.chainId
        );
        if (unwrapped != null) tokens.add(unwrapped);
      }
    });

    await onBundleTx?.(startData);

    // Sign signatures if required
    await Promise.all(
      bundle.requirements.signatures.map((requirement) =>
        requirement.sign(client, account)
      )
    );

    const txs = bundle.requirements.txs
      .map(({ tx }) => tx)
      .concat([bundle.tx()]);

    for (const tx of txs) {
      // Remove the type field to avoid conflicts with viem's type expectations
      const { type, ...txWithoutType } = tx;
      await client.sendTransaction({ ...txWithoutType, account } as any);
    }

    return { operations, bundle };
  };

  /**
   * Main function: Execute deposit using Morpho bundlers
   * This combines approval and deposit into a single seamless transaction
   */
  const deposit = useCallback(
    async (amount: string, receiver?: Address): Promise<boolean> => {
      console.log("\n" + "=".repeat(60));
      console.log("🚀 STARTING MORPHO DEPOSIT FLOW (BUNDLER)");
      console.log("=".repeat(60));
      console.log("Vault:", vaultAddress);
      console.log("Amount:", amount, "units");
      console.log("Receiver:", receiver || address);
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

      if (!amount) {
        updateState({ error: "Invalid amount" });
        return false;
      }

      if (!chainId) {
        updateState({ error: "Chain ID not available" });
        return false;
      }

      updateState({ isLoading: true, error: null, step: "idle" });

      try {
        // Parse amount to BigInt
        const amountToDeposit = parseUnits(amount, decimals);
        const receiverAddress = receiver || address;

        console.log("\n📊 Parsed amounts:");
        console.log("  Deposit:", amountToDeposit.toString(), "units");
        console.log("  Receiver:", receiverAddress);

        // Fetch vault data from blockchain
        console.log("\n📡 Fetching vault data from blockchain...");
        console.log("  Vault Address:", vaultAddress);
        console.log("  Chain ID:", chainId);

        let fetchedVault: Vault;
        try {
          fetchedVault = await Vault.fetch(
            vaultAddress as Address,
            publicClient
          );
          console.log("  ✅ Vault data loaded successfully");
          console.log("  Supply Queue:", fetchedVault.supplyQueue);
          console.log("  Withdraw Queue:", fetchedVault.withdrawQueue);
        } catch (error) {
          console.error("  ❌ Failed to fetch vault data:", error);
          throw new Error(
            "Vault not found on-chain. Please verify the vault exists and is valid."
          );
        }

        // Get all unique market IDs from vault's queues
        console.log("\n📡 Fetching data for all markets in vault queues...");
        const allMarketIds = [
          ...new Set([
            ...fetchedVault.supplyQueue,
            ...fetchedVault.withdrawQueue,
          ]),
        ];
        console.log(`  Found ${allMarketIds.length} unique markets`);

        // Fetch Market data for each market
        console.log("\n📡 Fetching market data...");
        const markets: Record<MarketId, Market | undefined> = {};

        for (const marketId of allMarketIds) {
          try {
            const market = await Market.fetch(marketId, publicClient);
            markets[marketId] = market;
            console.log(`  ✅ Loaded market data for ${marketId}`);
          } catch (error) {
            console.warn(
              `  ⚠️  Failed to fetch market data for ${marketId}:`,
              error
            );
            // Continue even if one market fetch fails
          }
        }

        // Fetch VaultMarketConfig for all markets
        console.log("\n📡 Fetching vault market configurations...");
        const vaultMarketConfigs: Record<
          MarketId,
          VaultMarketConfig | undefined
        > = {};

        for (const marketId of allMarketIds) {
          try {
            const config = await VaultMarketConfig.fetch(
              vaultAddress as Address,
              marketId,
              publicClient
            );
            vaultMarketConfigs[marketId] = config;
            console.log(`  ✅ Loaded config for market ${marketId}`);
          } catch (error) {
            console.warn(
              `  ⚠️  Failed to fetch config for market ${marketId}:`,
              error
            );
            // Continue even if one market config fails
          }
        }

        // Fetch vault's positions on all markets (vault itself has positions on markets)
        console.log("\n📡 Fetching vault positions on markets...");
        const vaultPositions: Record<MarketId, Position | undefined> = {};

        for (const marketId of allMarketIds) {
          try {
            const position = await Position.fetch(
              vaultAddress as Address,  // Fetch vault's position, not user's!
              marketId,
              publicClient
            );
            vaultPositions[marketId] = position;
            console.log(
              `  ✅ Loaded vault position for market ${marketId}`,
              position
            );
          } catch (error) {
            console.warn(
              `  ⚠️  Failed to fetch vault position for market ${marketId}:`,
              error
            );
            // Continue even if one position fetch fails
          }
        }

        // Also fetch user's position on the vault (if depositing to track existing shares)
        console.log("\n📡 Fetching user position on vault...");
        const userPositions: Record<MarketId, Position | undefined> = {};

        for (const marketId of allMarketIds) {
          try {
            const position = await Position.fetch(
              address,
              marketId,
              publicClient
            );
            userPositions[marketId] = position;
            console.log(
              `  ✅ Loaded user position for market ${marketId}`,
              position
            );
          } catch (error) {
            console.warn(
              `  ⚠️  Failed to fetch user position for market ${marketId}:`,
              error
            );
            // Continue even if one position fetch fails
          }
        }

        // Initialize SimulationState for bundler with fetched vault data
        console.log(
          "\n🔄 Initializing simulation state with vault, market configs, and positions..."
        );

        // Get current block information
        const block = await publicClient.getBlock();

        const simulationState = new SimulationState({
          chainId: chainId,
          block: {
            number: block.number,
            timestamp: block.timestamp,
          },
          markets: markets,  // Market data for all markets in vault queues
          vaults: {
            [vaultAddress as Address]: fetchedVault,
          },
          vaultMarketConfigs: {
            [vaultAddress as Address]: vaultMarketConfigs,
          },
          positions: {
            [vaultAddress as Address]: vaultPositions,  // Vault's positions on markets
            [address]: userPositions,  // User's positions on markets
          },
        });

        console.log("  Block:", block.number.toString());

        // Execute bundled transaction using setupBundle
        console.log("\n📦 Creating bundled transaction...");
        updateState({ step: "approving" });

        const { operations, bundle } = await setupBundle(
          walletClient,
          simulationState,
          [
            {
              type: "MetaMorpho_Deposit",
              address: vaultAddress as Address,
              sender: address,
              args: {
                assets: amountToDeposit,
                owner: receiverAddress,
              },
            },
          ]
        );

        console.log(
          "  ✅ Bundle created with",
          operations.length,
          "operations"
        );
        console.log(
          "  📋 Operations:",
          operations.map((op) => op.type).join(", ")
        );

        // The setupBundle function already executes the transaction
        console.log("\n" + "=".repeat(60));
        console.log("✅ DEPOSIT FLOW COMPLETE (BUNDLED)!");
        console.log(
          "   Executed",
          operations.length,
          "operations in a single transaction"
        );
        console.log("=".repeat(60) + "\n");

        updateState({ isLoading: false, step: "complete" });
        return true;
      } catch (error: any) {
        console.error("\n" + "=".repeat(60));
        console.error("❌ DEPOSIT FLOW ERROR");
        console.error("=".repeat(60));
        console.error(error);
        console.error("=".repeat(60) + "\n");

        let errorMessage = "Deposit flow failed";
        if (error.message?.includes("User rejected")) {
          errorMessage = "User rejected transaction";
        } else if (error.message?.includes("insufficient")) {
          errorMessage = "Insufficient balance";
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
      vaultAddress,
      decimals,
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
    deposit,
    reset,
    ...state,
  };
};
