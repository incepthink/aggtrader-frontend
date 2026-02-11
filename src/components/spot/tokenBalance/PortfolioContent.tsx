// components/spot/tokenBalance/PortfolioContent.tsx
"use client";

import { TokenRowDesktop } from "./TokenRowDesktop";
import { TokenCardMobile } from "./TokenCardMobile";
import type { CombinedToken } from "@/types/portfolio";
import { ReferralResponse } from "@/hooks/useUserReferralData";

interface PortfolioContentProps {
  normalizedData: CombinedToken[];
  getEntryPrice: (tokenKey: string, fallback: number) => number;
  isCustomPrice: (tokenKey: string) => boolean;
  updateEntryPrice: (tokenKey: string, price: number) => void;
  chainName: string;
  referralData?: ReferralResponse;
}

export const PortfolioContent: React.FC<PortfolioContentProps> = ({
  normalizedData,
  getEntryPrice,
  isCustomPrice,
  updateEntryPrice,
  chainName,
  referralData,
}) => {
  const getTokenChange24h = (token: CombinedToken): number | null => {
    return null;
  };

  if (normalizedData.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-400 text-sm">
          No {chainName} tokens found in your wallet
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Desktop Table View - Styled like GenericTable */}
      <div className="hidden md:block w-full overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-teal-900/30">
              <th className="px-4 py-3 text-sm font-medium text-gray-400 text-left">
                Token
              </th>
              <th className="px-4 py-3 text-sm font-medium text-gray-400 text-right">
                Balance
              </th>
              <th className="px-4 py-3 text-sm font-medium text-gray-400 text-center">
                Entry Price
              </th>
              <th className="px-4 py-3 text-sm font-medium text-gray-400 text-center">
                Current Price
              </th>
              <th className="px-4 py-3 text-sm font-medium text-gray-400 text-center">
                Value
              </th>
              <th className="px-4 py-3 text-sm font-medium text-gray-400 text-center">
                P&L
              </th>
              <th className="px-4 py-3 text-sm font-medium text-gray-400 text-center">
                ROI
              </th>
              <th className="px-4 py-3 text-sm font-medium text-gray-400 text-center">
                Share
              </th>
            </tr>
          </thead>
          <tbody>
            {normalizedData.map((token: CombinedToken) => {
              const tokenKey = `${token.chain_id}-${
                token.contract_address || token.address
              }`;
              const entryPrice = getEntryPrice(tokenKey, token.price_to_usd);
              const isCustom = isCustomPrice(tokenKey);
              const currentPrice = token.price_to_usd;
              const change24h = getTokenChange24h(token);

              return (
                <TokenRowDesktop
                  referralData={referralData}
                  key={tokenKey}
                  token={token as any}
                  entryPrice={entryPrice}
                  currentPrice={currentPrice}
                  change24h={change24h}
                  isCustomPrice={isCustom}
                  onPriceChange={updateEntryPrice}
                />
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="block md:hidden space-y-3">
        {normalizedData.map((token: CombinedToken) => {
          const tokenKey = `${token.chain_id}-${
            token.contract_address || token.address
          }`;
          const entryPrice = getEntryPrice(tokenKey, token.price_to_usd);
          const isCustom = isCustomPrice(tokenKey);
          const currentPrice = token.price_to_usd;
          const change24h = getTokenChange24h(token);

          return (
            <TokenCardMobile
              referralData={referralData}
              key={tokenKey}
              token={token as any}
              entryPrice={entryPrice}
              currentPrice={currentPrice}
              change24h={change24h}
              isCustomPrice={isCustom}
              onPriceChange={updateEntryPrice}
            />
          );
        })}
      </div>
    </>
  );
};
