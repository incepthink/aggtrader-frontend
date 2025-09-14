"use client";

import React, { useCallback, useMemo } from "react";
import { OrderType } from "@orbs-network/twap-sdk";
import type { TwapSupportedChainId } from "@/utils/config";
import {
  type TwapOrder,
  usePersistedOrdersStore,
} from "@/hooks/sushiswap/useTwapOrders";
import { TwapSDK } from "@/lib/swap/twap/index";
import { twapAbi_cancel } from "@/lib/swap/twap/abi/twapAbi_cancel";
import {
  type Address,
  type SendTransactionReturnType,
  UserRejectedRequestError,
  encodeFunctionData,
} from "viem";
import {
  useAccount,
  useEstimateGas,
  usePublicClient,
  useSendTransaction,
  useWaitForTransactionReceipt,
} from "wagmi";

interface TwapCancelOrderButtonProps {
  chainId: TwapSupportedChainId;
  order: TwapOrder;
}

// Simple notification functions - you can replace with your actual notification system later
const createToast = (options: {
  account?: string;
  type: string;
  chainId: number;
  txHash: string;
  promise: Promise<any>;
  summary: {
    pending: string;
    completed: string;
    failed: string;
  };
  timestamp: number;
  groupTimestamp: number;
}) => {
  console.log("🔄 Toast:", options.summary.pending);

  options.promise
    .then(() => {
      console.log("✅ Toast Success:", options.summary.completed);
    })
    .catch(() => {
      console.log("❌ Toast Error:", options.summary.failed);
    });
};

const createErrorToast = (message: string, persist: boolean = true) => {
  console.error("❌ Error Toast:", message);
};

export const TwapCancelOrderButton: React.FC<TwapCancelOrderButtonProps> = ({
  chainId,
  order,
}) => {
  const client = usePublicClient();
  const { address } = useAccount();

  const { addCancelledOrderId } = usePersistedOrdersStore({
    chainId,
    account: address,
  });

  const tx = useMemo(() => {
    if (!address) return undefined;

    return {
      chainId,
      account: address,
      to: TwapSDK.onNetwork(chainId).config.twapAddress as Address,
      data: encodeFunctionData({
        abi: twapAbi_cancel,
        functionName: "cancel",
        args: [BigInt(order.id)],
      }),
    };
  }, [chainId, order, address]);

  const { data: estGas, isError: isEstGasError } = useEstimateGas({
    ...tx,
    query: {
      enabled: Boolean(tx),
    },
  });

  const onCancelSuccess = useCallback(
    async (hash: SendTransactionReturnType) => {
      const isLimitOrder = order.type === OrderType.LIMIT;

      try {
        const ts = new Date().getTime();
        const promise = client?.waitForTransactionReceipt({
          hash,
        });

        if (promise) {
          createToast({
            account: address,
            type: "swap",
            chainId: tx?.chainId || chainId,
            txHash: hash,
            promise,
            summary: {
              pending: `Canceling ${isLimitOrder ? "limit" : "DCA"} order`,
              completed: `Canceled ${isLimitOrder ? "limit" : "DCA"} order`,
              failed: `Something went wrong when canceling ${
                isLimitOrder ? "limit" : "DCA"
              } order`,
            },
            timestamp: ts,
            groupTimestamp: ts,
          });
        }
      } finally {
        addCancelledOrderId(order.id);
      }
    },
    [order, tx, client, address, addCancelledOrderId, chainId]
  );

  const onCancelError = useCallback((e: Error) => {
    if (e.cause instanceof UserRejectedRequestError) {
      return;
    }

    createErrorToast(e.message, false);
  }, []);

  const {
    sendTransactionAsync,
    isPending: isWritePending,
    data,
  } = useSendTransaction({
    mutation: {
      onSuccess: onCancelSuccess,
      onError: onCancelError,
    },
  });

  const write = useMemo(() => {
    if (!sendTransactionAsync || !estGas || !tx) return undefined;

    return async (confirm?: () => void) => {
      await sendTransactionAsync({
        ...tx,
        gas: (estGas * BigInt(6)) / BigInt(5), // Add 20% buffer
      });
      confirm?.();
    };
  }, [sendTransactionAsync, tx, estGas]);

  const { isLoading: isTxLoading, isError: isTxError } =
    useWaitForTransactionReceipt({
      chainId: chainId,
      hash: data,
    });

  const isDisabled = Boolean(
    isEstGasError ||
      isWritePending ||
      isTxLoading ||
      !sendTransactionAsync ||
      !write
  );

  const getButtonText = () => {
    if (isEstGasError || isTxError) {
      return "Shoot! Something went wrong :(";
    }
    if (isWritePending || isTxLoading) {
      return "Canceling...";
    }
    return "Cancel Order";
  };

  return (
    <button
      onClick={() => write?.()}
      disabled={isDisabled}
      className={`w-full py-3 rounded-lg font-medium transition-colors ${
        isDisabled
          ? "bg-gray-600 text-gray-300 cursor-not-allowed"
          : isEstGasError || isTxError
          ? "bg-red-600 text-white hover:bg-red-700"
          : "bg-red-600 text-white hover:bg-red-700"
      }`}
    >
      {getButtonText()}
    </button>
  );
};
