// LimitTradeReviewDialog.tsx
"use client";

import React, { useState, useCallback, useMemo } from "react";
import {
  useDerivedStateTwap,
  useTwapTrade,
} from "../../../store/limit-order/derivedstate-twap-provider";
import {
  useAccount,
  useSendTransaction,
  useWaitForTransactionReceipt,
} from "wagmi";
import { format } from "date-fns";
import { getFeeString } from "@/utils/config";
import { TwapSDK } from "@/lib/swap/twap/index";
import { ApprovalButton } from "./ApprovalButton";
import {
  useTokenApproval,
  ApprovalState,
} from "@/hooks/sushiswap/useTokenApproval";
import { isNativeToken } from "@/store/limit-order/utils/token.types";
import type { Address } from "viem";
import { syncLimitOrders } from "@/utils/tracking/limitOrderTracking";

interface LimitTradeReviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LimitTradeReviewDialog: React.FC<LimitTradeReviewDialogProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    state: {
      token0,
      token1,
      chainId,
      swapAmount,
      recipient,
      limitPrice,
      isLimitOrder,
      token0PriceUSD,
      token1PriceUSD,
      deadline,
    },
    mutate: { setSwapAmount },
  } = useDerivedStateTwap();

  const { data: trade } = useTwapTrade();
  const { address } = useAccount();
  const [acceptDisclaimer, setAcceptDisclaimer] = useState(true);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isTrackingOrder, setIsTrackingOrder] = useState(false);
  const [transactionError, setTransactionError] = useState<string | null>(null);

  const {
    sendTransactionAsync,
    isPending: isWritePending,
    data: txHash,
    error: sendTxError,
  } = useSendTransaction();

  const { status, error: receiptError } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  // Get TWAP contract address for approval
  const twapContractAddress = useMemo(() => {
    try {
      return TwapSDK.onNetwork(chainId).config.twapAddress as Address;
    } catch {
      return undefined;
    }
  }, [chainId]);

  // Check approval state for the token being sold
  const { approvalState } = useTokenApproval({
    token: token0,
    amount: swapAmount,
    spender: twapContractAddress,
    chainId,
    owner: address,
    enabled: Boolean(
      token0 &&
        swapAmount &&
        twapContractAddress &&
        address &&
        !isNativeToken(token0)
    ),
  });

  const fee = useMemo(() => {
    return "0.25%";

    // if (!trade || !isLimitOrder || !token0 || !token1 || !trade.minAmountOut) {
    //   return "0.25%";
    // }

    // return getFeeString({
    //   fromToken: token0,
    //   toToken: token1,
    //   tokenOutPrice: token1PriceUSD,
    //   minAmountOut: trade.minAmountOut,
    // });
  }, [trade, isLimitOrder, token0, token1, token1PriceUSD]);

  const handleConfirm = useCallback(async () => {
    console.log(
      "🚀 [LIMIT ORDER] Initiating transaction with trade data:",
      trade
    );

    if (!trade?.tx || !sendTransactionAsync) return;

    setIsConfirming(true);
    setTransactionError(null);

    try {
      // console.log("📤 [LIMIT ORDER] Sending transaction:", {
      //   to: trade.tx.to,
      //   data: trade.tx.data,
      //   value: trade.tx.value,
      //   chainId: trade.tx.chainId,
      // });

      const hash = await sendTransactionAsync(trade.tx);
      console.log(
        "✅ [LIMIT ORDER] Transaction sent successfully, hash:",
        hash
      );
      // Success will be handled by the transaction receipt hook
    } catch (error: any) {
      console.error("❌ [LIMIT ORDER] Transaction failed:", error);
      console.error("❌ [LIMIT ORDER] Error details:", {
        message: error?.message,
        cause: error?.cause,
        shortMessage: error?.shortMessage,
        details: error?.details,
        metaMessages: error?.metaMessages,
      });

      // Extract user-friendly error message
      let errorMsg = "Transaction failed";
      if (error?.shortMessage) {
        errorMsg = error.shortMessage;
      } else if (error?.message) {
        errorMsg = error.message;
      }

      setTransactionError(errorMsg);
      setIsConfirming(false);
    }
  }, [trade?.tx, sendTransactionAsync]);

  const onSuccess = useCallback(() => {
    setSwapAmount("");
    onClose();
    // You might want to add a success toast here
  }, [setSwapAmount, onClose]);

  const trackNewlyCreatedOrder = useCallback(async () => {
    if (!address || !txHash) return;

    setIsTrackingOrder(true);

    try {
      console.log("🔄 Fetching newly created order from blockchain...");

      // Fetch all orders from blockchain
      const allOrders = await TwapSDK.onNetwork(chainId).getOrders(address);

      // Find the order that was just created by matching transaction hash
      const newOrder = allOrders.find((order) => order.txHash === txHash);

      if (newOrder) {
        console.log("📦 Found new order:", newOrder.id);

        // Send only this order to backend (AWAIT completion)
        await syncLimitOrders({
          walletAddress: address,
          chainId,
          orders: [newOrder], // Single-item array
        });

        console.log(
          "✅ Order placed on-chain AND stored in backend:",
          newOrder.id
        );

        // Backend storage successful, now clear form and close dialog
        onSuccess();
      } else {
        console.warn(
          "⚠️ Could not find newly created order in blockchain data"
        );
        // Still call onSuccess even if backend fails (order is on-chain)
        onSuccess();
      }
    } catch (error) {
      console.error("❌ Failed to track order creation:", error);
      // Still call onSuccess even if backend fails (order is on-chain)
      onSuccess();
    } finally {
      setIsTrackingOrder(false);
    }
  }, [address, txHash, chainId, onSuccess]);

  const handleApprovalSuccess = useCallback(() => {
    // Approval completed, user can now place the order
    console.log("Approval successful");
  }, []);

  // Handle transaction status
  React.useEffect(() => {
    if (status === "success" && !isTrackingOrder) {
      console.log("✅ [LIMIT ORDER] Transaction confirmed on-chain");
      // Track order in backend first, THEN call onSuccess
      trackNewlyCreatedOrder();
    } else if (status === "error") {
      console.error(
        "❌ [LIMIT ORDER] Transaction receipt error:",
        receiptError
      );
      // console.error("❌ [LIMIT ORDER] Receipt error details:", {
      //   message: receiptError?.message,
      //   cause: receiptError?.cause,
      //   shortMessage: receiptError?.shortMessage,
      // });

      let errorMsg = "Transaction failed on-chain";
      if (receiptError?.message) {
        errorMsg = receiptError.message;
      }

      setTransactionError(errorMsg);
      setIsConfirming(false);
      setIsTrackingOrder(false);
    }
  }, [status, isTrackingOrder, trackNewlyCreatedOrder, receiptError]);

  if (!isOpen) return null;

  const formatAmount = (amount: any) => {
    if (!amount) return "0";

    try {
      let numValue: number;

      // Handle SimpleAmount objects
      if (amount && typeof amount.toSignificant === "function") {
        numValue = parseFloat(amount.toSignificant(6));
      }
      // Handle numbers
      else if (typeof amount === "number") {
        numValue = amount;
      }
      // Handle string numbers
      else {
        numValue = parseFloat(String(amount));
        if (isNaN(numValue)) return "0";
      }

      // Format without scientific notation
      return numValue.toLocaleString("en-US", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 6,
        useGrouping: false,
      });
    } catch {
      return "0";
    }
  };

  const getNetworkName = (chainId: number) => {
    switch (chainId) {
      case 1:
        return "Ethereum";
      case 747474:
        return "Katana";
      default:
        return `Chain ${chainId}`;
    }
  };
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getTransactionStatus = () => {
    if (isWritePending || isConfirming) return "Confirming on-chain...";
    if (isTrackingOrder) return "Saving to backend...";
    return "Place Limit Order";
  };

  // Determine if we need approval (only for non-native tokens)
  const needsApproval =
    token0 &&
    !isNativeToken(token0) &&
    swapAmount &&
    twapContractAddress &&
    address &&
    (approvalState === ApprovalState.NOT_APPROVED ||
      approvalState === ApprovalState.LOADING);

  const isTransactionDisabled =
    !trade ||
    !acceptDisclaimer ||
    isConfirming ||
    isWritePending ||
    isTrackingOrder ||
    needsApproval;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-white">
              Review Limit Order
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div className="mt-2">
            <h3 className="text-lg font-medium text-white">
              Sell {formatAmount(swapAmount)} {token0?.ticker}
            </h3>
            <p className="text-gray-400">
              {trade
                ? `Receive at least ${Number(trade.minAmountOut?.toExact())} ${
                    token1?.ticker
                  }`
                : "Loading..."}
            </p>
          </div>
        </div>

        {/* Details */}
        <div className="p-6 space-y-4 text-white">
          {/* Network */}
          <div className="flex justify-between">
            <span className="text-gray-400">Network</span>
            <span>{getNetworkName(chainId)}</span>
          </div>

          {/* Limit Price */}
          {limitPrice && (
            <div className="flex justify-between">
              <span className="text-gray-400">Limit price</span>
              <div className="text-right">
                <div>
                  1 {limitPrice.baseCurrency.ticker} ={" "}
                  {limitPrice.toSignificant()} {limitPrice.quoteCurrency.ticker}
                </div>
                {token0PriceUSD && (
                  <div className="text-sm text-gray-400">
                    (Market: ${Number(token0PriceUSD.toFixed(2))})
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Expiry */}
          {deadline && (
            <div className="flex justify-between">
              <span className="text-gray-400">Expiry</span>
              <span>
                {format(new Date(deadline), "MMM d, yyyy 'at' h:mm a")}
              </span>
            </div>
          )}

          {/* Recipient */}
          {recipient && (
            <div className="flex justify-between">
              <span className="text-gray-400">Recipient</span>
              <span className="font-mono text-sm">
                {formatAddress(recipient)}
              </span>
            </div>
          )}

          {/* Fee */}
          <div className="flex justify-between">
            <span className="text-gray-400">Fee</span>
            <span>{fee}</span>
          </div>

          {/* Disclaimer */}
          <div className="flex items-start gap-3 p-4 bg-gray-700/50 rounded-lg">
            <input
              type="checkbox"
              id="disclaimer"
              checked={acceptDisclaimer}
              onChange={(e) => setAcceptDisclaimer(e.target.checked)}
              className="mt-1"
            />
            <label htmlFor="disclaimer" className="text-sm text-gray-300">
              I accept the{" "}
              <a
                href="https://www.orbs.com/dtwap-dlimit-disclaimer/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#00F5E0] hover:underline"
              >
                Disclaimer
              </a>
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-gray-700 space-y-3">
          {/* Error Display */}
          {transactionError && (
            <div className="p-3 bg-red-900/30 border border-red-500/50 rounded-lg">
              <p className="text-sm text-red-400 font-medium">Error:</p>
              <p className="text-xs text-red-300 mt-1 break-words">
                {transactionError}
              </p>
            </div>
          )}

          {!address ? (
            <button className="w-full py-3 bg-gray-600 text-gray-300 rounded-lg cursor-not-allowed">
              Connect Wallet
            </button>
          ) : needsApproval && token0 && swapAmount && twapContractAddress ? (
            <ApprovalButton
              token={token0}
              amount={swapAmount}
              spender={twapContractAddress}
              chainId={chainId}
              owner={address}
              onApprovalSuccess={handleApprovalSuccess}
              className="w-full"
            />
          ) : (
            <button
              data-testid="confirm-limit-order-button"
              onClick={handleConfirm}
              disabled={isTransactionDisabled}
              className={`w-full py-3 rounded-lg font-medium transition-colors ${
                isTransactionDisabled
                  ? "bg-gray-600 text-gray-300 cursor-not-allowed"
                  : "bg-[#00F5E0] text-black hover:bg-[#00F5E0]/90"
              }`}
            >
              {getTransactionStatus()}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
