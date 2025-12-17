// hooks/useMorphoWithdraw.ts
"use client";
import React, { useState, useCallback } from "react";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { parseUnits, formatUnits, Address } from "viem";
import type { UserPosition } from "./useUserVaultPosition";
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

export interface WithdrawState {
  isLoading: boolean;
  error: string | null;
  txHash: string | null;
  step: "idle" | "withdrawing" | "complete";
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
    step: "idle",
  });

  const { address, isConnected, chainId } = useAccount();
  const publicClient = usePublicClient({ chainId });
  const { data: walletClient } = useWalletClient();

  const updateState = useCallback((updates: Partial<WithdrawState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  /**
   * Setup and execute bundled Morpho operations
   * This function handles withdrawal using the bundler
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

  /**
   * Main function: Execute withdraw using Morpho bundlers
   * This uses the bundler to handle the withdrawal transaction
   */
  const withdraw = useCallback(
    async (amount: string, receiver?: Address): Promise<boolean> => {
      console.log("\n" + "=".repeat(60));
      console.log("🚀 STARTING MORPHO WITHDRAW FLOW (BUNDLER)");
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

      const position = getPositionData();
      if (!position.hasPosition) {
        updateState({ error: "No position available to withdraw from" });
        return false;
      }

      updateState({ isLoading: true, error: null, step: "idle" });

      try {
        // Parse amount to BigInt
        const amountToWithdraw = parseUnits(amount, decimals);
        const receiverAddress = receiver || address;

        // Validate against position data
        const userAssetsFormatted = formatUnits(
          BigInt(Math.floor(position.assetsNumber)),
          decimals
        );
        const userAssetsAmount = parseUnits(userAssetsFormatted, decimals);

        console.log("\n📊 Parsed amounts:");
        console.log("  Withdraw:", amountToWithdraw.toString(), "units");
        console.log("  Available:", userAssetsAmount.toString(), "units");
        console.log("  Receiver:", receiverAddress);

        if (userAssetsAmount === BigInt(0)) {
          updateState({
            isLoading: false,
            error: "No assets available to withdraw",
            step: "idle",
          });
          return false;
        }

        if (amountToWithdraw > userAssetsAmount) {
          updateState({
            isLoading: false,
            error: `Insufficient balance. Available: ${userAssetsFormatted}`,
            step: "idle",
          });
          return false;
        }

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
          ...new Set([...fetchedVault.supplyQueue, ...fetchedVault.withdrawQueue]),
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
        const vaultMarketConfigs: Record<MarketId, VaultMarketConfig | undefined> = {};

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
            console.warn(`  ⚠️  Failed to fetch config for market ${marketId}:`, error);
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

        // Also fetch user's position on the vault (if withdrawing to calculate shares)
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
        console.log("\n🔄 Initializing simulation state with vault, market configs, and positions...");

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
        updateState({ step: "withdrawing" });

        const { operations, bundle } = await setupBundle(
          walletClient,
          simulationState,
          [
            {
              type: "MetaMorpho_Withdraw",
              address: vaultAddress as Address,
              sender: address,
              args: {
                assets: amountToWithdraw,
                receiver: receiverAddress,
                owner: address,
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
        console.log("✅ WITHDRAW FLOW COMPLETE (BUNDLED)!");
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
        console.error("❌ WITHDRAW FLOW ERROR");
        console.error("=".repeat(60));
        console.error(error);
        console.error("=".repeat(60) + "\n");

        let errorMessage = "Withdraw flow failed";
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
      step: "idle",
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
