"use client";

import React, { useState, useEffect, useMemo } from "react";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import {
  OrderStatus,
  OrderType,
  getOrderExcecutionRate,
  getOrderLimitPriceRate,
  zeroAddress,
} from "@orbs-network/twap-sdk";
import { format } from "date-fns";
import type { TwapSupportedChainId } from "@/utils/config";
import { type TwapOrder, useTwapOrders } from "@/hooks/sushiswap/useTwapOrders";
import { useTokenWithCache } from "@/hooks/sushiswap/useTokenWithCache";
import type { Token } from "@/store/limit-order/utils/token.types";
import { SimpleAmount } from "@/store/limit-order/utils/simpleCurrency";
import {
  isNativeToken,
  createNativeToken,
} from "@/store/limit-order/utils/token.types";
import type { Address } from "viem";
import { useAccount } from "wagmi";
import { useDerivedStateTwap } from "@/store/limit-order/derivedstate-twap-provider";
import { TwapCancelOrderButton } from "./TwapCancelOrderButton";

enum OrderFilter {
  All = "ALL",
  Open = "OPEN",
  Canceled = "CANCELED",
  Completed = "COMPLETED",
  Expired = "EXPIRED",
}

interface TwapOrdersDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

// Utility functions
const shortenAddress = (address: string, chars = 4): string => {
  if (!address) return "";
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
};

const shortenHash = (hash: string, chars = 6): string => {
  if (!hash) return "";
  return `${hash.slice(0, chars + 2)}...${hash.slice(-chars)}`;
};

const withoutScientificNotation = (value: string): string => {
  if (!value) return "0";

  try {
    const num = parseFloat(value);
    if (isNaN(num)) return "0";

    if (num < 1e-6 && num > 0) {
      return num.toFixed(18).replace(/\.?0+$/, "");
    }

    return num.toString();
  } catch {
    return "0";
  }
};

// Chain utilities
const getExplorerUrl = (chainId: number): string => {
  switch (chainId) {
    case 1:
      return "https://etherscan.io";
    case 747474:
      return "https://katanascan.com";
    default:
      return "https://etherscan.io";
  }
};

const getAccountUrl = (chainId: number, address: string): string => {
  return `${getExplorerUrl(chainId)}/address/${address}`;
};

const getTxUrl = (chainId: number, txHash: string): string => {
  return `${getExplorerUrl(chainId)}/tx/${txHash}`;
};

// Fill delay text helper
const fillDelayText = (fillDelayMs: number): string => {
  const seconds = Math.floor(fillDelayMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days} day${days > 1 ? "s" : ""}`;
  }
  if (hours > 0) {
    return `${hours} hour${hours > 1 ? "s" : ""}`;
  }
  if (minutes > 0) {
    return `${minutes} minute${minutes > 1 ? "s" : ""}`;
  }
  return `${seconds} second${seconds !== 1 ? "s" : ""}`;
};

export const TwapOrdersDialog: React.FC<TwapOrdersDialogProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    state: { chainId },
  } = useDerivedStateTwap();

  const { address } = useAccount();

  const { data: orders, isLoading: isOrdersLoading } = useTwapOrders({
    chainId,
    account: address,
    enabled: isOpen,
  });
  console.log("TWAP ORDERS", orders);

  const [orderFilter, setOrderFilter] = useState<OrderFilter>(OrderFilter.All);
  const [selectedOrderIndex, setSelectedOrderIndex] = useState<
    number | undefined
  >(undefined);

  const filteredOrders = useMemo(() => {
    if (!orders) return [];

    switch (orderFilter) {
      case OrderFilter.All:
        return orders.ALL;
      case OrderFilter.Open:
        return orders.OPEN;
      case OrderFilter.Completed:
        return orders.COMPLETED;
      case OrderFilter.Canceled:
        return orders.CANCELED;
      case OrderFilter.Expired:
        return orders.EXPIRED;
      default:
        return orders.ALL;
    }
  }, [orders, orderFilter]);

  useEffect(() => {
    if (!isOpen) {
      setSelectedOrderIndex(undefined);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {typeof selectedOrderIndex === "number" ? (
          <TwapOrderDialogContent
            order={filteredOrders[selectedOrderIndex]}
            chainId={chainId}
            onBack={() => setSelectedOrderIndex(undefined)}
            onClose={onClose}
          />
        ) : (
          <>
            {/* Header */}
            <div className="p-6 border-b border-gray-700">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <h2 className="text-xl font-semibold text-white">Orders</h2>

                  {/* Filter Dropdown */}
                  <div className="relative">
                    <select
                      value={orderFilter}
                      onChange={(e) =>
                        setOrderFilter(e.target.value as OrderFilter)
                      }
                      className="bg-gray-700 text-white px-3 py-1 rounded-lg text-sm appearance-none pr-8 cursor-pointer"
                    >
                      {Object.entries(OrderFilter).map(([label, value]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                    <ExpandMoreIcon className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>

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
            </div>

            {/* Orders List */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="min-h-[420px] max-h-[75vh]">
                {isOrdersLoading ? (
                  <div className="flex items-center justify-center h-40">
                    <div className="text-gray-400">Loading orders...</div>
                  </div>
                ) : filteredOrders.length ? (
                  <div className="space-y-4">
                    {filteredOrders.map((order, i) => (
                      <button
                        key={order.id}
                        type="button"
                        onClick={() => setSelectedOrderIndex(i)}
                        className="w-full"
                      >
                        <TwapOrderCard order={order} chainId={chainId} />
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-40">
                    <div className="text-gray-400">No orders found</div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

function parseOrderAmount(
  token: Token | undefined,
  orderAmount: string
): SimpleAmount | undefined {
  const amount = withoutScientificNotation(orderAmount);
  if (!token || !amount) return undefined;
  return SimpleAmount.fromRawAmount(token, amount);
}

interface TwapOrderDialogContentProps {
  chainId: TwapSupportedChainId;
  order: TwapOrder;
  onBack: () => void;
  onClose: () => void;
}

const TwapOrderDialogContent: React.FC<TwapOrderDialogContentProps> = ({
  chainId,
  order,
  onBack,
  onClose,
}) => {
  const { address } = useAccount();
  const isLimit = order.type === OrderType.LIMIT;

  const { data: token0 } = useTokenWithCache({
    chainId,
    address: order.srcTokenAddress as Address,
  });

  const { data: _token1 } = useTokenWithCache({
    chainId,
    address: order.dstTokenAddress as Address,
    enabled: order.dstTokenAddress !== zeroAddress,
  });

  const token1 = useMemo(
    () =>
      order.dstTokenAddress === zeroAddress
        ? createNativeToken(chainId)
        : _token1,
    [order, chainId, _token1]
  );

  const {
    srcAmount,
    srcChunkAmount,
    srcFilledAmount,
    dstFilledAmount,
    dstMinAmountOut,
    executionPrice,
    limitPrice,
  } = useMemo(() => {
    return {
      srcAmount: parseOrderAmount(token0, order.srcAmount),
      srcChunkAmount: parseOrderAmount(token0, order.srcAmountPerChunk),
      srcFilledAmount: parseOrderAmount(token0, order.filledSrcAmount),
      dstFilledAmount: parseOrderAmount(token1, order.filledDstAmount),
      dstMinAmountOut: parseOrderAmount(token1, order.dstMinAmount),
      executionPrice:
        token0 && token1
          ? getOrderExcecutionRate(order, token0.decimals, token1.decimals)
          : undefined,
      limitPrice:
        token0 && token1
          ? getOrderLimitPriceRate(order, token0.decimals, token1.decimals)
          : undefined,
    };
  }, [token0, token1, order]);

  return (
    <>
      {/* Header */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowBackIcon className="w-5 h-5 text-gray-400" />
          </button>
          <h2 className="text-xl font-semibold text-white">
            {isLimit ? "Limit" : "DCA"} Order #{order.id}
          </h2>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-6">
          {/* Token Display */}
          <div className="bg-gray-700/50 rounded-xl p-4 space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex flex-col">
                <span className="text-gray-400 text-sm">Sell</span>
                <span className="text-white font-medium">{token0?.ticker}</span>
              </div>
              {token0 ? (
                <div className="w-9 h-9 rounded-full bg-gray-600 flex items-center justify-center overflow-hidden">
                  {token0.img ? (
                    <img
                      src={token0.img}
                      alt={token0.ticker}
                      className="w-9 h-9 rounded-full"
                    />
                  ) : (
                    <span className="text-white text-xs font-medium">
                      {token0.ticker?.slice(0, 2)}
                    </span>
                  )}
                </div>
              ) : (
                <div className="w-9 h-9 rounded-full bg-gray-600 animate-pulse" />
              )}
            </div>

            <div className="flex justify-between items-center">
              <div className="flex flex-col">
                <span className="text-gray-400 text-sm">Buy</span>
                <span className="text-white font-medium">{token1?.ticker}</span>
              </div>
              {token1 ? (
                <div className="w-9 h-9 rounded-full bg-gray-600 flex items-center justify-center overflow-hidden">
                  {token1.img ? (
                    <img
                      src={token1.img}
                      alt={token1.ticker}
                      className="w-9 h-9 rounded-full"
                    />
                  ) : (
                    <span className="text-white text-xs font-medium">
                      {token1.ticker?.slice(0, 2)}
                    </span>
                  )}
                </div>
              ) : (
                <div className="w-9 h-9 rounded-full bg-gray-600 animate-pulse" />
              )}
            </div>

            {!isLimit && (
              <div className="text-gray-400 text-sm">
                Every {fillDelayText(order.fillDelayMs)} over {order.chunks}{" "}
                order{order.chunks > 1 ? "s" : ""}
              </div>
            )}
          </div>

          {/* Execution Summary */}
          <div className="bg-gray-700/50 rounded-xl p-4">
            <h3 className="text-white font-medium mb-4">Execution Summary</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Status</span>
                <span className="text-white capitalize">
                  {order.status.toLowerCase()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Amount sent</span>
                <span className="text-white">
                  {srcFilledAmount?.toSignificant(6)} {token0?.ticker}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Amount received</span>
                <span className="text-white">
                  {dstFilledAmount?.toSignificant(6)} {token1?.ticker}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Final execution price</span>
                {executionPrice ? (
                  <span className="text-white">
                    1 {token0?.ticker} = {Number(executionPrice).toFixed(6)}{" "}
                    {token1?.ticker}
                  </span>
                ) : (
                  <span className="text-white">-</span>
                )}
              </div>
            </div>
          </div>

          {/* Order Info */}
          <div className="bg-gray-700/50 rounded-xl p-4">
            <h3 className="text-white font-medium mb-4">Order Info</h3>
            <div className="space-y-3 text-sm">
              {!order.isMarketOrder && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Limit Price</span>
                  <span className="text-white">
                    1 {token0?.ticker} = {Number(limitPrice || 0).toFixed(6)}{" "}
                    {token1?.ticker}
                  </span>
                </div>
              )}

              <div className="flex justify-between">
                <span className="text-gray-400">Created at</span>
                <span className="text-white">
                  {format(order.createdAt, "MMM d, yyyy h:mm a")}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-400">Expiry</span>
                <span className="text-white">
                  {format(order.deadline, "MMM d, yyyy h:mm a")}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-400">Amount in</span>
                <span className="text-white">
                  {srcAmount?.toSignificant(6)} {token0?.ticker}
                </span>
              </div>

              {!isLimit && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Individual trade size</span>
                    <span className="text-white">
                      {srcChunkAmount?.toSignificant(6)} {token0?.ticker}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Trade interval</span>
                    <span className="text-white">
                      {fillDelayText(order.fillDelayMs)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Number of trades</span>
                    <span className="text-white">{order.chunks}</span>
                  </div>
                </>
              )}

              {!order.isMarketOrder && (
                <div className="flex justify-between">
                  <span className="text-gray-400">
                    {order.chunks === 1
                      ? "Min. received"
                      : "Min. received per trade"}
                  </span>
                  <span className="text-white">
                    {dstMinAmountOut?.toSignificant(6)} {token1?.ticker}
                  </span>
                </div>
              )}

              {address && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Recipient</span>
                  <a
                    href={getAccountUrl(chainId, address)}
                    className="text-[#00F5E0] hover:underline text-sm"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {shortenAddress(address)}
                  </a>
                </div>
              )}

              <div className="flex justify-between">
                <span className="text-gray-400">Transaction Hash</span>
                <a
                  href={getTxUrl(chainId, order.txHash)}
                  className="text-[#00F5E0] hover:underline text-sm"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {shortenHash(order.txHash)}
                </a>
              </div>
            </div>
          </div>

          {/* Cancel Button */}
          {order.status === OrderStatus.Open && (
            <TwapCancelOrderButton chainId={chainId} order={order} />
          )}
        </div>
      </div>
    </>
  );
};

interface TwapOrderCardProps {
  chainId: TwapSupportedChainId;
  order: TwapOrder;
}

const TwapOrderCard: React.FC<TwapOrderCardProps> = ({ chainId, order }) => {
  const { data: token0 } = useTokenWithCache({
    chainId,
    address: order.srcTokenAddress as Address,
  });
  console.log("TwapOrderCard", token0);

  const { data: _token1 } = useTokenWithCache({
    chainId,
    address: order.dstTokenAddress as Address,
    enabled: order.dstTokenAddress !== zeroAddress,
  });
  console.log("TwapOrderCard", _token1);

  const token1 = useMemo(
    () =>
      order.dstTokenAddress === zeroAddress
        ? createNativeToken(chainId)
        : _token1,
    [order, chainId, _token1]
  );

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.Open:
        return "bg-blue-500/20 text-blue-400";
      case OrderStatus.Completed:
        return "bg-green-500/20 text-green-400";
      case OrderStatus.Canceled:
        return "bg-yellow-500/20 text-yellow-400";
      case OrderStatus.Expired:
        return "bg-gray-500/20 text-gray-400";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };

  return (
    <div className="bg-gray-700/50 rounded-xl p-4 hover:bg-gray-700/70 transition-colors cursor-pointer">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-400">
          #{order.id} {order.type === OrderType.LIMIT ? "Limit" : "DCA"}{" "}
          <span className="text-gray-500">
            ({format(order.createdAt, "MMM d, yyyy h:mm a")})
          </span>
        </span>
        <div
          className={`rounded-full px-2 py-1 text-xs ${getStatusColor(
            order.status
          )}`}
        >
          <span className="capitalize">{order.status.toLowerCase()}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-2">
        <div className="w-full bg-gray-600 rounded-full h-2">
          <div
            className="bg-[#00F5E0] h-2 rounded-full transition-all"
            style={{ width: `${order.progress}%` }}
          />
        </div>
        <span className="text-xs text-gray-400 whitespace-nowrap">
          {order.progress}%
        </span>
      </div>

      <div className="flex gap-2 items-center">
        <span className="flex gap-1 items-center text-xs text-gray-400">
          {token0 ? (
            <div className="w-4 h-4 rounded-full bg-gray-600 flex items-center justify-center overflow-hidden">
              {token0.img ? (
                <img
                  src={token0.img}
                  alt={token0.ticker}
                  className="w-4 h-4 rounded-full"
                />
              ) : (
                <span className="text-white text-xs font-medium">
                  {token0.ticker?.slice(0, 1)}
                </span>
              )}
            </div>
          ) : (
            <div className="w-4 h-4 rounded-full bg-gray-600 animate-pulse" />
          )}
          {token0?.ticker}
        </span>
        <ArrowForwardIcon className="w-3 h-3 text-gray-400" />
        <span className="flex gap-1 items-center text-xs text-gray-400">
          {token1 ? (
            <div className="w-4 h-4 rounded-full bg-gray-600 flex items-center justify-center overflow-hidden">
              {token1.img ? (
                <img
                  src={token1.img}
                  alt={token1.ticker}
                  className="w-4 h-4 rounded-full"
                />
              ) : (
                <span className="text-white text-xs font-medium">
                  {token1.ticker?.slice(0, 1)}
                </span>
              )}
            </div>
          ) : (
            <div className="w-4 h-4 rounded-full bg-gray-600 animate-pulse" />
          )}
          {token1?.ticker}
        </span>
      </div>
    </div>
  );
};
