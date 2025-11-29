// derivedstate-twap-provider.tsx (Complete Fixed Version)
"use client";

import {
  type TimeDuration,
  TimeUnit,
  zeroAddress,
} from "@orbs-network/twap-sdk";
import {
  type Dispatch,
  type FC,
  type SetStateAction,
  createContext,
  useContext,
  useMemo,
  useState,
  useEffect,
} from "react";
import {
  type TwapSupportedChainId,
  isTwapSupportedChainId,
  getFeeString,
} from "@/utils/config";
import { TwapExpiryTimeDurations, TwapSDK } from "@/lib/swap/twap/index";
import { twapAbi_ask } from "@/lib/swap/twap/abi/twapAbi_ask";
import {
  SimpleAmount,
  SimplePrice,
  tryParseAmount,
} from "./utils/simpleCurrency";
import type { Token } from "./utils/token.types";
import type { Fraction } from "@sushiswap/math";
import { sz } from "sushi";
import { type Hex, encodeFunctionData } from "viem";
import type { Address } from "viem/accounts";
import { parseUnits } from "viem/utils";
import { z } from "zod";
import { usePrices } from "@/hooks/sushiswap/usePrices";
import {
  DerivedstateSimpleSwapProvider,
  useDerivedStateSimpleSwap,
} from "./derivedstate-simple-swap-provider";
import { prepareLimitOrder } from "@/services/twap/twapService";

type DerivedStateSimpleSwapState = ReturnType<typeof useDerivedStateSimpleSwap>;

type State = DerivedStateSimpleSwapState & {
  state: Omit<DerivedStateSimpleSwapState["state"], "chainId"> & {
    chainId: TwapSupportedChainId;
    isLimitOrder: boolean;
    isLimitPriceInverted: boolean;
    limitPriceString: string;
    limitPrice: SimplePrice | undefined;
    marketPrice: SimplePrice | undefined;
    token0PriceUSD: Fraction | undefined;
    token1PriceUSD: Fraction | undefined;
    expiry: TimeDuration;
    chunks: number;
    fillDelay: TimeDuration;
    deadline: number;
    amountOut: SimpleAmount | undefined;
    minAmountOut: SimpleAmount | undefined;
    amountInPerChunk: SimpleAmount | undefined;
  };
  mutate: DerivedStateSimpleSwapState["mutate"] & {
    setIsLimitPriceInverted: Dispatch<SetStateAction<boolean>>;
    setLimitPrice: Dispatch<SetStateAction<string>>;
    setExpiry: Dispatch<SetStateAction<TimeDuration>>;
    setChunks: Dispatch<SetStateAction<number>>;
    setFillDelay: Dispatch<SetStateAction<TimeDuration>>;
  };
};

const DerivedStateTwapContext = createContext<State>({} as State);

interface DerivedStateTwapProviderProps {
  children: React.ReactNode;
  isLimitOrder?: boolean;
}

const DerivedStateTwapProvider: FC<DerivedStateTwapProviderProps> = ({
  children,
  isLimitOrder,
}) => {
  return (
    <DerivedstateSimpleSwapProvider>
      <_DerivedStateTwapProvider isLimitOrder={isLimitOrder}>
        {children}
      </_DerivedStateTwapProvider>
    </DerivedstateSimpleSwapProvider>
  );
};

const _DerivedStateTwapProvider: FC<DerivedStateTwapProviderProps> = ({
  children,
  isLimitOrder = false,
}) => {
  const derivedStateSimpleSwap = useDerivedStateSimpleSwap();

  const { data: prices, isLoading: _isPricesLoading } = usePrices({
    chainId: derivedStateSimpleSwap.state.chainId,
    token0: derivedStateSimpleSwap.state.token0,
    token1: derivedStateSimpleSwap.state.token1,
  });

  const [isLimitPriceInverted, setIsLimitPriceInverted] =
    useState<boolean>(false);
  const [limitPriceString, setLimitPrice] = useState<string>("");
  const [expiry, setExpiry] = useState<TimeDuration>(
    TwapExpiryTimeDurations.Day
  );
  const [chunks, setChunks] = useState<number>(1);
  const [fillDelay, setFillDelay] = useState<TimeDuration>({
    unit: TimeUnit.Minutes,
    value: 5,
  });

  // Reset TWAP-specific state when chain changes
  useEffect(() => {
    setIsLimitPriceInverted(false);
    setLimitPrice("");
    setExpiry(TwapExpiryTimeDurations.Day);
    setChunks(1);
    setFillDelay({
      unit: TimeUnit.Minutes,
      value: 5,
    });
  }, [derivedStateSimpleSwap.state.chainId]);

  const [marketPrice, token0PriceUSD, token1PriceUSD] = useMemo(() => {
    const [token0, token1] = [
      derivedStateSimpleSwap.state.token0,
      derivedStateSimpleSwap.state.token1,
    ];

    if (!token0 || !token1) return [undefined, undefined, undefined];

    const token0PriceFraction = prices?.getFraction(token0.address);
    const token1PriceFraction = prices?.getFraction(token1.address);

    if (token0PriceFraction && token1PriceFraction) {
      const token0OverToken1 = token0PriceFraction.divide(token1PriceFraction);

      const quoteRaw = token0OverToken1.multiply(
        parseUnits("1", token1.decimals).toString()
      ).quotient;

      const baseAmount = SimpleAmount.fromRawAmount(
        token0,
        parseUnits("1", token0.decimals).toString()
      );
      const quoteAmount = SimpleAmount.fromRawAmount(
        token1,
        quoteRaw.toString()
      );

      const marketPrice = new SimplePrice({
        baseAmount,
        quoteAmount,
      });

      return [marketPrice, token0PriceFraction, token1PriceFraction];
    }

    return [undefined, undefined, undefined];
  }, [
    prices,
    derivedStateSimpleSwap.state.token0,
    derivedStateSimpleSwap.state.token1,
  ]);

  // MAIN FIX: Manual calculation to bypass broken SimplePrice.quote()
  const calculateTradeAmounts = useMemo(() => {
    const { state } = derivedStateSimpleSwap;

    if (!state.swapAmount || !state.token0 || !state.token1) {
      return {
        amountOut: undefined,
        orderPriceOfOneToken0: undefined,
      };
    }

    // Extract price as number - same logic as LimitPriceInput
    let finalPriceNumber: number;

    if (isLimitOrder && limitPriceString && parseFloat(limitPriceString) > 0) {
      // For limit orders, use the user-entered price
      const userPrice = parseFloat(limitPriceString);

      if (isLimitPriceInverted) {
        // User entered price for token1->token0, but we need token0->token1
        finalPriceNumber = 1 / userPrice;
      } else {
        // User entered price for token0->token1, use directly
        finalPriceNumber = userPrice;
      }
    } else {
      // For market orders or when no limit price, use market price
      if (!marketPrice) {
        return {
          amountOut: undefined,
          orderPriceOfOneToken0: undefined,
        };
      }

      const marketPriceStr = marketPrice.toSignificant(18);
      finalPriceNumber = parseFloat(marketPriceStr);
    }

    console.log("MANUAL CALCULATION DEBUG:", {
      isLimitOrder,
      limitPriceString,
      isLimitPriceInverted,
      finalPriceNumber,
      swapAmount: state.swapAmount.toSignificant(6),
    });

    // Validate price
    if (!finalPriceNumber || isNaN(finalPriceNumber) || finalPriceNumber <= 0) {
      console.warn("Invalid price for calculation:", finalPriceNumber);
      return {
        amountOut: undefined,
        orderPriceOfOneToken0: undefined,
      };
    }

    // Manual calculation of output amount
    // finalPriceNumber represents how much token1 you get for 1 token0
    const swapAmountNumber = parseFloat(state.swapAmount.toExact());
    const outputAmountNumber = swapAmountNumber * finalPriceNumber;

    // Convert back to BigInt with proper decimals
    const outputAmountRaw = BigInt(
      Math.floor(outputAmountNumber * Math.pow(10, state.token1.decimals))
    );

    console.log("MANUAL CALCULATION RESULT:", {
      swapAmountNumber,
      outputAmountNumber,
      token1Decimals: state.token1.decimals,
      outputAmountRaw: outputAmountRaw.toString(),
    });

    const amountOut = SimpleAmount.fromRawAmount(
      state.token1,
      outputAmountRaw.toString()
    );

    // Create orderPriceOfOneToken0 manually for SDK compatibility
    // This represents how much token1 you get for 1 token0
    const pricePerToken = BigInt(
      Math.floor(finalPriceNumber * Math.pow(10, state.token1.decimals))
    );

    const orderPriceOfOneToken0 = SimpleAmount.fromRawAmount(
      state.token1,
      pricePerToken.toString()
    );

    console.log("MANUAL orderPriceOfOneToken0:", {
      token: orderPriceOfOneToken0.token.ticker,
      quotient: orderPriceOfOneToken0.quotient.toString(),
      toSignificant: orderPriceOfOneToken0.toSignificant(6),
    });

    return {
      amountOut,
      orderPriceOfOneToken0,
    };
  }, [
    derivedStateSimpleSwap.state.swapAmount,
    derivedStateSimpleSwap.state.token0,
    derivedStateSimpleSwap.state.token1,
    isLimitOrder,
    limitPriceString,
    isLimitPriceInverted,
    marketPrice,
  ]);

  return (
    <DerivedStateTwapContext.Provider
      value={useMemo(() => {
        const { state, mutate, isLoading, isToken0Loading, isToken1Loading } =
          derivedStateSimpleSwap;

        const chainId = isTwapSupportedChainId(state.chainId)
          ? state.chainId
          : 1;

        const sdk = TwapSDK.onNetwork(chainId);

        const duration = sdk.getOrderDuration(
          chunks,
          fillDelay,
          isLimitOrder ? expiry : undefined
        );

        const deadline = sdk.getOrderDeadline(Date.now(), duration);

        const amountInPerChunk =
          state.swapAmount && chunks
            ? SimpleAmount.fromRawAmount(
                state.swapAmount.token,
                sdk.getSrcTokenChunkAmount(
                  state.swapAmount.quotient.toString(),
                  chunks
                )
              )
            : undefined;

        // Create limit price for display purposes only
        const [baseCurrency, quoteCurrency] =
          state.token0 && state.token1
            ? isLimitPriceInverted
              ? [state.token1, state.token0]
              : [state.token0, state.token1]
            : [undefined, undefined];

        const baseAmount = baseCurrency
          ? SimpleAmount.fromRawAmount(
              baseCurrency,
              parseUnits("1", baseCurrency.decimals).toString()
            )
          : undefined;

        const quoteAmount = tryParseAmount(limitPriceString, quoteCurrency);

        const _limitPrice =
          baseAmount && quoteAmount
            ? new SimplePrice({ baseAmount, quoteAmount })
            : undefined;

        const limitPrice = isLimitPriceInverted
          ? _limitPrice?.invert()
          : _limitPrice;

        // Use manual calculation results
        const { amountOut, orderPriceOfOneToken0 } = calculateTradeAmounts;

        // Calculate minAmountOut using SDK with our manual price
        const destMinAmount =
          state.token0 && amountInPerChunk && orderPriceOfOneToken0
            ? sdk.getDestTokenMinAmount(
                amountInPerChunk.quotient.toString(),
                orderPriceOfOneToken0.quotient.toString(),
                !isLimitOrder,
                state.token0.decimals
              )
            : undefined;

        const minAmountOut =
          state.token1 && destMinAmount
            ? SimpleAmount.fromRawAmount(state.token1, destMinAmount)
            : undefined;

        console.log("FINAL TRADE AMOUNTS:", {
          amountOut: amountOut
            ? {
                token: amountOut.token.ticker,
                quotient: amountOut.quotient.toString(),
                toSignificant: amountOut.toSignificant(6),
              }
            : "undefined",
          minAmountOut: minAmountOut
            ? {
                token: minAmountOut.token.ticker,
                quotient: minAmountOut.quotient.toString(),
                toSignificant: minAmountOut.toSignificant(6),
              }
            : "undefined",
          orderPriceOfOneToken0: orderPriceOfOneToken0
            ? {
                token: orderPriceOfOneToken0.token.ticker,
                quotient: orderPriceOfOneToken0.quotient.toString(),
                toSignificant: orderPriceOfOneToken0.toSignificant(6),
              }
            : "undefined",
        });

        return {
          mutate: {
            ...mutate,
            setIsLimitPriceInverted,
            setLimitPrice,
            setExpiry,
            setChunks,
            setFillDelay,
          },
          state: {
            ...state,
            chainId,
            isLimitOrder,
            marketPrice,
            isLimitPriceInverted,
            limitPriceString,
            limitPrice,
            token0PriceUSD,
            token1PriceUSD,
            expiry,
            chunks,
            fillDelay,
            deadline,
            amountOut,
            minAmountOut,
            amountInPerChunk,
          },
          isLoading,
          isToken0Loading,
          isToken1Loading,
        };
      }, [
        derivedStateSimpleSwap,
        isLimitPriceInverted,
        isLimitOrder,
        marketPrice,
        limitPriceString,
        token0PriceUSD,
        token1PriceUSD,
        expiry,
        chunks,
        fillDelay,
        calculateTradeAmounts,
      ])}
    >
      {children}
    </DerivedStateTwapContext.Provider>
  );
};

const useDerivedStateTwap = () => {
  const context = useContext(DerivedStateTwapContext);
  if (!context) {
    throw new Error("Hook can only be used inside Twap Derived State Context");
  }

  return context;
};

const bigIntValidator = z.preprocess(
  (v) => (typeof v === "string" ? BigInt(v) : v),
  z.bigint()
);

const prepareOrderArgsValidator = z.tuple([
  sz.evm.address(), // 0: exchange
  sz.evm.address(), // 1: srcToken
  sz.evm.address(), // 2: dstToken
  bigIntValidator, // 3: srcAmount
  bigIntValidator, // 4: srcBidAmount
  bigIntValidator, // 5: dstMinAmount
  z.coerce.number().int().gte(0), // 6: deadline
  z.coerce.number().int().gte(0), // 7: bidDelay
  z.coerce.number().int().gte(0), // 8: fillDelay
  z.preprocess((val) => (val === "" ? "0x" : val), sz.hex()), // 9: data
]);

export interface UseTwapTradeReturn {
  isLimitOrder: boolean | undefined;
  limitPrice: SimplePrice | undefined;
  marketPrice: SimplePrice | undefined;
  amountIn: SimpleAmount | undefined;
  chunks: number | undefined;
  fillDelay: TimeDuration | undefined;
  amountInPerChunk: SimpleAmount | undefined;
  amountOut: SimpleAmount | undefined;
  minAmountOut: SimpleAmount | undefined;
  tx:
    | {
        chainId: TwapSupportedChainId;
        to: Address;
        data: Hex;
      }
    | undefined;
  params: z.infer<typeof prepareOrderArgsValidator>;
  fee: string | undefined;
}

const useTwapTrade = () => {
  const {
    state: {
      chainId,
      swapAmount,
      token0,
      token1,
      deadline,
      amountOut,
      minAmountOut,
      amountInPerChunk,
      fillDelay,
      limitPrice,
      marketPrice,
      token1PriceUSD,
      chunks,
      isLimitOrder,
    },
  } = useDerivedStateTwap();

  const [tradeData, setTradeData] = useState<{
    data: UseTwapTradeReturn | undefined;
    error: any;
  }>({ data: undefined, error: undefined });

  useEffect(() => {
    const prepareTransaction = async () => {
      console.log("TRADE PREPARATION DEBUG - Starting:", {
        swapAmount: swapAmount
          ? {
              token: swapAmount.token.ticker,
              quotient: swapAmount.quotient.toString(),
              toSignificant: swapAmount.toSignificant(6),
            }
          : "undefined",
        token0: token0?.ticker,
        token1: token1?.ticker,
        minAmountOut: minAmountOut
          ? {
              token: minAmountOut.token.ticker,
              quotient: minAmountOut.quotient.toString(),
              toSignificant: minAmountOut.toSignificant(6),
            }
          : "undefined",
        chunks,
        isLimitOrder,
      });

      if (
        !swapAmount ||
        !token0 ||
        !token1 ||
        !minAmountOut ||
        !amountInPerChunk ||
        !fillDelay ||
        !chunks
      ) {
        console.log("TRADE PREPARATION DEBUG - Missing required data");
        setTradeData({ data: undefined, error: undefined });
        return;
      }

      const srcTokenAddress =
        token0.address === "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"
          ? token0.address
          : token0.address;

      const destTokenAddress =
        token1.address === "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"
          ? token1.address
          : token1.address;

      console.log("TRADE PREPARATION DEBUG - Token addresses:", {
        srcTokenAddress,
        destTokenAddress,
        token0Original: token0.address,
        token1Original: token1.address,
      });

      try {
        // Convert fillDelay TimeUnit to API format
        let fillDelayUnit: "Seconds" | "Minutes" | "Hours" | "Days";
        switch (fillDelay.unit) {
          case TimeUnit.Minutes:
            fillDelayUnit = "Minutes";
            break;
          case TimeUnit.Hours:
            fillDelayUnit = "Hours";
            break;
          case TimeUnit.Days:
            fillDelayUnit = "Days";
            break;
          default:
            fillDelayUnit = "Minutes";
        }

        // Call the backend API
        const apiResponse = await prepareLimitOrder({
          srcToken: srcTokenAddress,
          dstToken: destTokenAddress,
          srcAmount: swapAmount.quotient.toString(),
          dstMinAmount: minAmountOut.quotient.toString(),
          srcChunkAmount: amountInPerChunk.quotient.toString(),
          deadline: deadline,
          fillDelay: {
            unit: fillDelayUnit,
            value: fillDelay.value,
          },
        });

        console.log("TRADE PREPARATION DEBUG - API response:", apiResponse);

        // Create transaction object from API response
        const tx = {
          chainId,
          to: apiResponse.data.to as Address,
          data: apiResponse.data.data as Hex,
          value: BigInt(apiResponse.data.value || "0"),
        };

        console.log("USETRADE - Final tx:", tx);

        // Create params array for compatibility (empty since we're using API now)
        const params = [] as any;

        setTradeData({
          data: {
            isLimitOrder,
            limitPrice,
            marketPrice,
            amountIn: swapAmount,
            chunks,
            fillDelay,
            amountInPerChunk,
            amountOut,
            minAmountOut,
            tx,
            params,
            fee: isLimitOrder
              ? getFeeString({
                  fromToken: token0,
                  toToken: token1,
                  tokenOutPrice: token1PriceUSD,
                  minAmountOut,
                })
              : undefined,
          } satisfies UseTwapTradeReturn,
          error: undefined,
        });
      } catch (error) {
        console.error("TRADE PREPARATION DEBUG - API call failed:", error);
        setTradeData({
          data: undefined,
          error,
        });
      }
    };

    prepareTransaction();
  }, [
    token0,
    token1,
    chainId,
    fillDelay,
    deadline,
    swapAmount,
    chunks,
    amountInPerChunk,
    amountOut,
    minAmountOut,
    limitPrice,
    marketPrice,
    token1PriceUSD,
    isLimitOrder,
  ]);

  return tradeData;
};

const useTwapTradeErrors = () => {
  const {
    state: {
      chainId,
      amountInPerChunk,
      fillDelay,
      token0PriceUSD,
      chunks,
      isLimitOrder,
    },
  } = useDerivedStateTwap();

  return useMemo(() => {
    const sdk = TwapSDK.onNetwork(chainId);

    const minFillDelayError = isLimitOrder
      ? false
      : sdk.getMinFillDelayError(fillDelay).isError;
    const maxFillDelayError = isLimitOrder
      ? false
      : sdk.getMaxFillDelayError(fillDelay, chunks).isError;

    const minTradeSizeError =
      amountInPerChunk && token0PriceUSD
        ? sdk.getMinTradeSizeError(
            amountInPerChunk.toExact(),
            token0PriceUSD.toFixed(6),
            sdk.config.minChunkSizeUsd
          ).isError
        : false;

    return {
      minFillDelayError,
      maxFillDelayError,
      minTradeSizeError,
    };
  }, [
    chainId,
    isLimitOrder,
    fillDelay,
    chunks,
    amountInPerChunk,
    token0PriceUSD,
  ]);
};

export {
  DerivedStateTwapProvider,
  useDerivedStateTwap,
  useTwapTrade,
  useTwapTradeErrors,
};
