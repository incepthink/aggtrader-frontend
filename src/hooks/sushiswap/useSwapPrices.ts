// hooks/useSwapPrices.ts
import { useMemo } from "react";
import type { Address } from "viem";
import { usePriceComparison } from "./usePriceBackend";
import { useSpotStore } from "@/store/spotStore";

// Local types
export interface PriceData {
  ratio: number;
  tokenOne: number;
  tokenTwo: number;
}

export interface Token {
  address: Address;
  name: string;
  ticker: string;
  img: string;
  decimals: number;
}

export const useSwapPrices = (tokenOne: Token, tokenTwo: Token) => {
  // Get chainId from store
  const chainId = useSpotStore((s) => s.chainId);

  const mapTokenAddressForPricing = (
    address: string,
    chainId: number
  ): string => {
    // For Katana network, map native ETH to vbETH for pricing
    if (
      chainId === 747474 &&
      address.toLowerCase() === "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"
    ) {
      return "0xEE7D8BCFb72bC1880D0Cf19822eB0A2e6577aB62"; // vbETH address
    }
    return address;
  };

  // Map the token addresses before passing to usePriceComparison
  const mappedTokenOneAddress = tokenOne?.address
    ? mapTokenAddressForPricing(tokenOne.address, chainId)
    : undefined;

  const mappedTokenTwoAddress = tokenTwo?.address
    ? mapTokenAddressForPricing(tokenTwo.address, chainId)
    : undefined;

  const {
    data: priceData,
    tokenOnePrice,
    tokenTwoPrice,
    ratio,
    isLoading: isLoadingPrices,
    isError,
    error,
    refetch,
  } = usePriceComparison(
    mappedTokenOneAddress as `0x${string}` | undefined,
    mappedTokenTwoAddress as `0x${string}` | undefined,
    chainId,
    {
      enabled: Boolean(mappedTokenOneAddress && mappedTokenTwoAddress),
      refetchInterval: 30000, // 30 seconds
      staleTime: 15000, // 15 seconds
    }
  );

  // Create prices object compatible with existing interface
  const prices = useMemo((): PriceData | null => {
    if (!priceData || !tokenOnePrice || !tokenTwoPrice) return null;

    return {
      ratio: ratio || 0,
      tokenOne: tokenOnePrice,
      tokenTwo: tokenTwoPrice,
    };
  }, [priceData, tokenOnePrice, tokenTwoPrice, ratio]);

  // Fallback fetch function for backward compatibility
  const fetchPrices = async (one: Address, two: Address) => {
    try {
      await refetch();
    } catch (err) {
      console.error("Failed to fetch prices:", err);
    }
  };

  return {
    prices,
    isLoadingPrices,
    tokenOnePrice: tokenOnePrice || 0,
    tokenTwoPrice: tokenTwoPrice || 0,
    binancePriceError: isError ? error : null, // Renamed for backward compatibility
    fetchPrices,
    // Additional useful data
    ratio,
    isError,
    error,
    refetch,
  };
};
