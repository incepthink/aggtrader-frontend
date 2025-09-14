// derivedstate-simple-swap-provider.tsx
"use client";

import {
  type FC,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  SimpleAmount,
  tryParseAmount,
  convertTokenDataToToken,
} from "./utils/simpleCurrency";
import type { Token } from "./utils/token.types";
import {
  createNativeToken,
  createWrappedNativeToken,
  isNativeToken,
  WRAPPED_TOKEN_ADDRESSES,
  NATIVE_TOKEN_ADDRESSES,
} from "./utils/token.types";
import { isAddress } from "viem";
import { useAccount } from "wagmi";
import { useTokensBackend, type TokenData } from "@/hooks/useTokensBackend";
import { useSpotStore } from "../spotStore";

// Define your supported chain
const DEFAULT_CHAIN_ID = 1; // Katana chain ID

interface State {
  mutate: {
    setToken0(token0: Token | string): void;
    setToken1(token1: Token | string): void;
    setTokens(token0: Token | string, token1: Token | string): void;
    setSwapAmount(swapAmount: string): void;
    switchTokens(): void;
  };
  state: {
    token0: Token | undefined;
    token1: Token | undefined;
    chainId: number;
    swapAmountString: string;
    swapAmount: SimpleAmount | undefined;
    recipient: string | undefined;
  };
  isLoading: boolean;
  isToken0Loading: boolean;
  isToken1Loading: boolean;
}

const DerivedStateSimpleSwapContext = createContext<State>({} as State);

interface DerivedStateSimpleSwapProviderProps {
  children: React.ReactNode;
}

// Helper function to convert token to string representation
const getTokenAsString = (token: Token | string): string => {
  if (typeof token === "string") return token;

  // Check if it's native token (using placeholder address)
  const nativeAddress =
    NATIVE_TOKEN_ADDRESSES[
      token.chainId as keyof typeof NATIVE_TOKEN_ADDRESSES
    ];
  if (token.address === nativeAddress || isNativeToken(token)) {
    return "NATIVE";
  }

  return token.address;
};

// Helper to find token by address
const findTokenByAddress = (
  tokens: TokenData[],
  address: string
): TokenData | undefined => {
  return tokens.find(
    (token) => token.address.toLowerCase() === address.toLowerCase()
  );
};

// Helper to create token from string/address
const createTokenFromString = (
  tokenString: string,
  chainId: number,
  tokens: TokenData[]
): Token | null => {
  if (tokenString === "NATIVE") {
    return createNativeToken(chainId);
  }

  if (isAddress(tokenString)) {
    // Check if it's the wrapped token address
    const wrappedAddress =
      WRAPPED_TOKEN_ADDRESSES[chainId as keyof typeof WRAPPED_TOKEN_ADDRESSES];
    if (
      wrappedAddress &&
      tokenString.toLowerCase() === wrappedAddress.toLowerCase()
    ) {
      return createWrappedNativeToken(chainId);
    }

    // Try to find in backend tokens
    const tokenData = findTokenByAddress(tokens, tokenString);
    if (tokenData) {
      return convertTokenDataToToken(tokenData);
    }
  }

  return null;
};

const DerivedstateSimpleSwapProvider: FC<
  DerivedStateSimpleSwapProviderProps
> = ({ children }) => {
  const { address } = useAccount();
  const { chainId } = useSpotStore();

  // Fetch tokens from your backend
  const { tokens, isLoading: tokensLoading } = useTokensBackend(chainId);
  console.log("DerivedstateSimpleSwapProvider", chainId, tokens);

  // Local state for tokens and swap amount
  const [token0, setToken0State] = useState<Token | undefined>();
  const [token1, setToken1State] = useState<Token | undefined>();
  const [swapAmountString, setSwapAmountString] = useState<string>("");

  // Loading states
  const [isToken0Loading, setIsToken0Loading] = useState(false);
  const [isToken1Loading, setIsToken1Loading] = useState(false);

  // Reset tokens and amount when chain changes
  useEffect(() => {
    setToken0State(undefined);
    setToken1State(undefined);
    setSwapAmountString("");
  }, [chainId]);

  // Set default tokens once backend tokens are loaded
  useEffect(() => {
    if (tokens.length > 0 && !token0 && !token1 && !tokensLoading) {
      // Set default token0 as native token
      setToken0State(createNativeToken(chainId));

      // Set default token1 as USDC/AUSD or first available token
      const usdcToken = tokens.find(
        (t) =>
          t.symbol.toUpperCase() === "USDC" || t.symbol.toUpperCase() === "AUSD"
      );

      if (usdcToken) {
        setToken1State(convertTokenDataToToken(usdcToken));
      } else {
        // Find first non-native token
        const nonNativeToken = tokens.find((token) => {
          const nativeAddress =
            NATIVE_TOKEN_ADDRESSES[
              chainId as keyof typeof NATIVE_TOKEN_ADDRESSES
            ];
          return token.address.toLowerCase() !== nativeAddress?.toLowerCase();
        });

        if (nonNativeToken) {
          setToken1State(convertTokenDataToToken(nonNativeToken));
        }
      }
    }
  }, [tokens, token0, token1, chainId]);

  // Token setters with backend integration
  const setToken0 = useCallback(
    (newToken0: Token | string) => {
      setIsToken0Loading(true);

      let token: Token | null;
      if (typeof newToken0 === "string") {
        token = createTokenFromString(newToken0, chainId, tokens);
        if (!token) {
          console.warn("Token not found:", newToken0);
          setIsToken0Loading(false);
          return;
        }
      } else {
        token = newToken0;
      }

      // Switch tokens if the new token0 is the same as current token1
      if (token1 && getTokenAsString(token) === getTokenAsString(token1)) {
        setToken0State(token1);
        setToken1State(token);
      } else {
        setToken0State(token);
      }

      setIsToken0Loading(false);
    },
    [chainId, token1, tokens]
  );

  const setToken1 = useCallback(
    (newToken1: Token | string) => {
      setIsToken1Loading(true);

      let token: Token | null;
      if (typeof newToken1 === "string") {
        token = createTokenFromString(newToken1, chainId, tokens);
        if (!token) {
          console.warn("Token not found:", newToken1);
          setIsToken1Loading(false);
          return;
        }
      } else {
        token = newToken1;
      }

      // Switch tokens if the new token1 is the same as current token0
      if (token0 && getTokenAsString(token) === getTokenAsString(token0)) {
        setToken1State(token0);
        setToken0State(token);
      } else {
        setToken1State(token);
      }

      setIsToken1Loading(false);
    },
    [chainId, token0, tokens]
  );

  const setTokens = useCallback(
    (newToken0: Token | string, newToken1: Token | string) => {
      setToken0(newToken0);
      setToken1(newToken1);
    },
    [setToken0, setToken1]
  );

  const switchTokens = useCallback(() => {
    const temp = token0;
    setToken0State(token1);
    setToken1State(temp);
    setSwapAmountString(""); // Clear amount when switching
  }, [token0, token1]);

  const setSwapAmount = useCallback((amount: string) => {
    setSwapAmountString(amount);
  }, []);

  return (
    <DerivedStateSimpleSwapContext.Provider
      value={useMemo(() => {
        const swapAmount = token0
          ? tryParseAmount(swapAmountString, token0)
          : undefined;

        return {
          mutate: {
            setToken0,
            setToken1,
            setTokens,
            switchTokens,
            setSwapAmount,
          },
          state: {
            recipient: address,
            chainId,
            swapAmountString,
            swapAmount,
            token0,
            token1,
          },
          isLoading: tokensLoading || isToken0Loading || isToken1Loading,
          isToken0Loading,
          isToken1Loading,
        };
      }, [
        address,
        chainId,
        swapAmountString,
        token0,
        token1,
        tokensLoading,
        isToken0Loading,
        isToken1Loading,
        setSwapAmount,
        setToken0,
        setToken1,
        setTokens,
        switchTokens,
      ])}
    >
      {children}
    </DerivedStateSimpleSwapContext.Provider>
  );
};

const useDerivedStateSimpleSwap = () => {
  const context = useContext(DerivedStateSimpleSwapContext);
  if (!context) {
    throw new Error(
      "Hook can only be used inside Simple Swap Derived State Context"
    );
  }

  return context;
};

export { DerivedstateSimpleSwapProvider, useDerivedStateSimpleSwap };
