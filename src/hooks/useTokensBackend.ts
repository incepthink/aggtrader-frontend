import { useEffect, useState } from "react";
import axios from "axios";
import { BACKEND_URL } from "@/utils/constants";

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
        // Fetch from 1inch API via backend
        const response = await axios.get<TokenResponse>(
          `${BACKEND_URL}/api/proxy/1inch/tokens`,
          {
            params: { chainId },
          }
        );

        const tokensData: TokenData[] = Object.values(response.data).map(
          (token) => ({
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
          })
        );

        setTokens(tokensData);
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
