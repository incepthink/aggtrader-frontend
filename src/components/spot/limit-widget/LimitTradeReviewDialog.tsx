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

  const {
    sendTransactionAsync,
    isPending: isWritePending,
    data: txHash,
  } = useSendTransaction();

  const { status } = useWaitForTransactionReceipt({
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
    console.log("USETRADE", "trade", trade);

    if (!trade?.tx || !sendTransactionAsync) return;

    setIsConfirming(true);
    try {
      await sendTransactionAsync(trade.tx);
      // Success will be handled by the transaction receipt hook
    } catch (error) {
      console.error("Transaction failed:", error);
      setIsConfirming(false);
    }
  }, [trade?.tx, sendTransactionAsync]);

  const onSuccess = useCallback(() => {
    setSwapAmount("");
    onClose();
    // You might want to add a success toast here
  }, [setSwapAmount, onClose]);

  const handleApprovalSuccess = useCallback(() => {
    // Approval completed, user can now place the order
    console.log("Approval successful");
  }, []);

  // Handle transaction status
  React.useEffect(() => {
    if (status === "success") {
      onSuccess();
    } else if (status === "error") {
      setIsConfirming(false);
    }
  }, [status, onSuccess]);

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
    if (isConfirming || isWritePending) return "Confirming...";
    if (status === "pending") return "Place Limit Order";
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
                ? `Receive at least ${Number(trade.minAmountOut.toExact())} ${
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
        <div className="p-6 border-t border-gray-700">
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
