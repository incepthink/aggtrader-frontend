// hooks/useTokensBackend.ts

import { useEffect, useState } from "react";
import axios from "axios";
import { BACKEND_URL } from "@/utils/constants";
import { 
  createNativeToken, 
  createWrappedNativeToken, 
  WRAPPED_TOKEN_ADDRESSES 
} from "@/store/limit-order/utils/token.types";

const KATANA_CHAIN_ID = 747474;
const NATIVE_PLACEHOLDER_LC  = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";

interface TokenResponse {
  [address: string]: {
    chainId: number;
    symbol: string;
    name: string;
    address: string;
    decimals: number;
    logoURI: string;
    providers: string[];
    eip2612: boolean;
    isFoT: boolean;
    tags: string[];
  };
}

interface KatanaTokenResponse {
  status: string;
  data: {
    tokens: {
      id: number;
      address: string;
      symbol: string;
      name: string;
      decimals: number;
      total_supply: string | null;
      pool_count: number;
      tradable: boolean;
      chain_id: number;
      logo_uri: string | null;
      created_at: string;
      updated_at: string;
    }[];
    metadata: {
      count: number;
      chain: string;
      filters: {
        tradable: boolean;
        search: string | null;
        minPools: number | null;
      };
    };
  };
  source: string;
  chain: string;
}

export interface TokenData {
  chainId: number;
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  logoURI: string;
  providers?: string[];
  eip2612?: boolean;
  isFoT?: boolean;
  tags?: string[];
}

export function useTokensBackend(chainId: number) {
  const [tokens, setTokens] = useState<TokenData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTokens = async () => {
      if (!chainId) return;

      setIsLoading(true);
      setError(null);

      try {
        let tokensData: TokenData[] = [];

        if (chainId === KATANA_CHAIN_ID) {
          // Fetch from backend database API
          const response = await axios.get<KatanaTokenResponse>(
            `${BACKEND_URL}/api/katana/tokens/db`,
            {
              params: { tradable: true },
            }
          );

          const rawTokens = response.data.data.tokens;
          const wrappedAddress = WRAPPED_TOKEN_ADDRESSES[chainId as keyof typeof WRAPPED_TOKEN_ADDRESSES];

          tokensData = rawTokens.map((token) => {
            // If this is the WETH contract (backend returns it as "ETH"), rename it properly
            if (token.address.toLowerCase() === wrappedAddress?.toLowerCase() && token.symbol === 'ETH') {
              return {
                chainId: token.chain_id,
                symbol: 'WETH', // Rename backend "ETH" to "WETH"
                name: 'Wrapped Ethereum',
                address: token.address,
                decimals: token.decimals,
                logoURI: token.logo_uri || "https://assets.katana.network/icons/eth.svg",
                providers: [],
                eip2612: false,
                isFoT: false,
                tags: ['wrapped'],
              };
            }

            return {
              chainId: token.chain_id,
              symbol: token.symbol,
              name: token.name,
              address: token.address,
              decimals: token.decimals,
              logoURI: token.logo_uri || "",
              providers: [],
              eip2612: false,
              isFoT: false,
              tags: [],
            };
          });

          console.log("KATANA processed tokens:", tokensData);
        } else {
          // Fetch from 1inch API via backend
          const response = await axios.get<TokenResponse>(
            `${BACKEND_URL}/api/proxy/1inch/tokens`,
            {
              params: { chainId },
            }
          );

          for (const token of Object.values(response.data)) {
  const addr = (token?.address || "").toLowerCase();
  if (addr === NATIVE_PLACEHOLDER_LC) continue;

  tokensData.push({
    chainId: token.chainId,
    symbol: token.symbol,
    name: token.name,
    address: token.address,
    decimals: token.decimals,
    logoURI: token.logoURI,
    providers: token.providers,
    eip2612: token.eip2612,
    isFoT: token.isFoT,
    tags: token.tags,
  });
}

          
        }

        // Always add native token at the beginning
        const nativeToken = createNativeToken(chainId);
        const nativeTokenData: TokenData = {
          chainId: nativeToken.chainId,
          symbol: nativeToken.ticker,
          name: nativeToken.name,
          address: nativeToken.address,
          decimals: nativeToken.decimals,
          logoURI: nativeToken.img,
          providers: [],
          eip2612: false,
          isFoT: false,
          tags: ['native'],
        };

        // Final token list with native first
        const finalTokens = [nativeTokenData, ...tokensData];

        console.log("ETHEREUM processed tokens:", tokensData);

        setTokens(finalTokens);
      } catch (err) {
        console.error("Error fetching tokens:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch tokens");
        setTokens([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTokens();
  }, [chainId]);

  return {
    tokens,
    isLoading,
    error,
    isError: !!error,
  };
}