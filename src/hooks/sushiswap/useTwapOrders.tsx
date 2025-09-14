import {
  type Order,
  OrderStatus,
  buildOrder,
  getOrderFillDelayMillis,
  zeroAddress,
} from "@orbs-network/twap-sdk";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import type { TwapSupportedChainId } from "@/utils/config";
import { TwapSDK } from "@/lib/swap/twap/index";
import type { Token } from "@/store/limit-order/utils/token.types";
import { isNativeToken } from "@/store/limit-order/utils/token.types";
import type { Address } from "viem";
import { useConfig } from "wagmi";

export type TwapOrder = Order & {
  status: OrderStatus;
  fillDelayMs: number;
};

interface TwapOrdersStoreParams {
  chainId: TwapSupportedChainId;
  account: Address | undefined;
}

export const usePersistedOrdersStore = ({
  chainId,
  account,
}: TwapOrdersStoreParams) => {
  const queryClient = useQueryClient();
  const ordersKey = `orders-${chainId}:${account}`;
  const cancelledOrderIdsKey = `cancelled-orders-${chainId}:${account}`;

  const getCreatedOrders = useCallback((): Order[] => {
    if (typeof window === "undefined") return [];
    const res = localStorage.getItem(ordersKey);
    if (!res) return [];
    try {
      return JSON.parse(res);
    } catch {
      return [];
    }
  }, [ordersKey]);

  const getCancelledOrderIds = useCallback((): number[] => {
    if (typeof window === "undefined") return [];
    const res = localStorage.getItem(cancelledOrderIdsKey);
    if (!res) return [];
    try {
      return JSON.parse(res);
    } catch {
      return [];
    }
  }, [cancelledOrderIdsKey]);

  const addCreatedOrder = useCallback(
    (
      orderId: number,
      txHash: string,
      params: string[],
      srcToken: Token,
      dstToken: Token
    ) => {
      if (!account || typeof window === "undefined") return;

      const sdk = TwapSDK.onNetwork(chainId);

      const order = buildOrder({
        srcAmount: params[3],
        srcTokenAddress: srcToken.address,
        dstTokenAddress: isNativeToken(dstToken)
          ? zeroAddress
          : dstToken.address,
        srcAmountPerChunk: params[4],
        deadline: Number(params[6]) * 1000,
        dstMinAmountPerChunk: params[5],
        tradeDollarValueIn: "",
        blockNumber: 0,
        id: orderId,
        fillDelay: Number(params[8]),
        createdAt: Date.now(),
        txHash,
        maker: account,
        exchange: sdk.config.exchangeAddress,
        twapAddress: sdk.config.twapAddress,
        chainId,
        status: OrderStatus.Open,
      });

      const orders = getCreatedOrders();
      if (orders.some((o) => o.id === order.id)) return;
      orders.push(order);
      localStorage.setItem(ordersKey, JSON.stringify(orders));

      const queryKey = ["twap-orders", chainId, account];
      queryClient.setQueryData(queryKey, (orders?: TwapOrder[]) => {
        const _order = {
          ...order,
          status: OrderStatus.Open,
          fillDelayMs: getOrderFillDelayMillis(
            order,
            TwapSDK.onNetwork(chainId).config
          ),
        };
        if (!orders) return [_order];
        return [_order, ...orders];
      });
      queryClient.invalidateQueries({ queryKey });
    },
    [getCreatedOrders, ordersKey, queryClient, chainId, account]
  );

  const addCancelledOrderId = useCallback(
    (orderId: number) => {
      if (typeof window === "undefined") return;

      const cancelledOrderIds = getCancelledOrderIds();
      if (!cancelledOrderIds.includes(orderId)) {
        cancelledOrderIds.push(orderId);
        localStorage.setItem(
          cancelledOrderIdsKey,
          JSON.stringify(cancelledOrderIds)
        );
        queryClient.setQueryData(
          ["twap-orders", chainId, account],
          (orders?: TwapOrder[]) => {
            if (!orders) return [];
            return orders.map((order) => {
              if (order.id === orderId) {
                return { ...order, status: OrderStatus.Canceled };
              }
              return order;
            });
          }
        );
      }
    },
    [getCancelledOrderIds, cancelledOrderIdsKey, queryClient, chainId, account]
  );

  const deleteCreatedOrder = useCallback(
    (id: number) => {
      if (typeof window === "undefined") return;
      const orders = getCreatedOrders().filter((order) => order.id !== id);
      localStorage.setItem(ordersKey, JSON.stringify(orders));
    },
    [getCreatedOrders, ordersKey]
  );

  const deleteCancelledOrderId = useCallback(
    (orderId: number) => {
      if (typeof window === "undefined") return;
      const cancelledOrderIds = getCancelledOrderIds().filter(
        (id) => id !== orderId
      );
      localStorage.setItem(
        cancelledOrderIdsKey,
        JSON.stringify(cancelledOrderIds)
      );
    },
    [getCancelledOrderIds, cancelledOrderIdsKey]
  );

  return {
    getCreatedOrders,
    getCancelledOrderIds,
    addCreatedOrder,
    addCancelledOrderId,
    deleteCreatedOrder,
    deleteCancelledOrderId,
  };
};

interface TwapOrdersQueryParams {
  chainId: TwapSupportedChainId;
  account: Address | undefined;
  enabled?: boolean;
}

const useTwapOrdersQuery = ({
  chainId,
  account,
  enabled = true,
}: TwapOrdersQueryParams) => {
  const config = useConfig();

  const {
    getCreatedOrders,
    getCancelledOrderIds,
    deleteCreatedOrder,
    deleteCancelledOrderId,
  } = usePersistedOrdersStore({ chainId, account });

  return useQuery({
    queryKey: ["twap-orders", chainId, account],
    queryFn: async () => {
      if (!account || !config) throw new Error("Account or config missing");

      const sdkOrders = await TwapSDK.onNetwork(chainId).getOrders(account);

      // Sync localStorage with blockchain data
      getCreatedOrders().forEach((localStorageOrder) => {
        if (sdkOrders.some((order) => order.id === localStorageOrder.id)) {
          // Order is now on blockchain, remove from localStorage
          deleteCreatedOrder(localStorageOrder.id);
        } else {
          // Order still pending, add to result
          sdkOrders.unshift(localStorageOrder);
        }
      });

      const canceledOrders = new Set(getCancelledOrderIds());

      const orders = sdkOrders.map((order) => {
        let status = order.status;
        if (canceledOrders.has(order.id)) {
          if (status !== OrderStatus.Canceled) {
            status = OrderStatus.Canceled;
          } else {
            // Order is now canceled on blockchain, clean up localStorage
            deleteCancelledOrderId(order.id);
          }
        }

        return {
          ...order,
          status,
          progress: status === OrderStatus.Completed ? 100 : order.progress,
          fillDelayMs: getOrderFillDelayMillis(
            order,
            TwapSDK.onNetwork(chainId).config
          ),
        } satisfies TwapOrder;
      });

      return orders;
    },
    refetchInterval: 20_000, // Poll every 20 seconds
    enabled: Boolean(enabled && account && config),
  });
};

export const useTwapOrders = ({
  chainId,
  account,
  enabled = true,
}: TwapOrdersQueryParams) => {
  const ordersQuery = useTwapOrdersQuery({ chainId, account, enabled });

  return useMemo(() => {
    const { data: orders, ...rest } = ordersQuery;
    return {
      ...rest,
      data: orders
        ? {
            ALL: orders as TwapOrder[],
            [OrderStatus.Open]: filterAndSortOrders(orders, OrderStatus.Open),
            [OrderStatus.Completed]: filterAndSortOrders(
              orders,
              OrderStatus.Completed
            ),
            [OrderStatus.Expired]: filterAndSortOrders(
              orders,
              OrderStatus.Expired
            ),
            [OrderStatus.Canceled]: filterAndSortOrders(
              orders,
              OrderStatus.Canceled
            ),
          }
        : undefined,
    };
  }, [ordersQuery]);
};

const filterAndSortOrders = (orders: TwapOrder[], status: OrderStatus) => {
  return orders
    .filter((order) => order.status === status)
    .sort((a, b) => b.createdAt - a.createdAt);
};
