// components/TokenBalancesCard.tsx - Updated to use the hook
"use client";

import { CircularProgress } from "@mui/material";
import { useSpotBalance } from "@/hooks/useSpotBalance";

export default function TokenBalancesCard() {
  const { data, isLoading, error } = useSpotBalance();

  if (error) {
    return (
      <div className="relative mx-auto rounded-xl">
        <div className="relative p-4 sm:p-6 md:p-8 rounded-2xl text-white font-sans">
          <div className="text-lg sm:text-xl font-semibold mb-4">
            Token Balances
          </div>
          <div className="text-center py-8">
            <div className="text-red-400 text-sm">
              Failed to load token balances
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative mx-auto rounded-xl">
      <div className="relative p-4 sm:p-6 md:p-8 rounded-2xl text-white font-sans">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-3 sm:gap-0">
          <div className="text-lg sm:text-xl font-semibold flex items-center gap-2">
            Token Balances
          </div>
        </div>

        {/* Content */}
        <div className="w-full">
          {isLoading ? (
            <div className="w-full flex justify-center pb-4">
              <CircularProgress sx={{ color: "primary.main" }} />
            </div>
          ) : data ? (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="text-base font-semibold">
                      <th className="text-left font-medium pb-3 text-cyan-300">
                        Token
                      </th>
                      <th className="text-left font-medium pb-3 text-cyan-300">
                        Balance
                      </th>
                      <th className="text-left font-medium pb-3 text-cyan-300">
                        Price
                      </th>
                      <th className="text-left font-medium pb-3 text-cyan-300">
                        Value
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* ETH Row */}
                    {data.ethBalance.balance > 0 && (
                      <tr className="hover:bg-white/5 transition-colors duration-200">
                        <td className="py-3 border-b border-white/8">
                          <div className="flex items-center gap-2">
                            <img
                              src="/logos/eth-logo.png"
                              alt="ETH"
                              className="w-4 h-4 rounded-full"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                  "/logos/default-token.png";
                              }}
                            />
                            <span className="font-medium">ETH</span>
                          </div>
                        </td>
                        <td className="py-3 border-b border-white/8">
                          {data.ethBalance.balance.toFixed(6)}
                        </td>
                        <td className="py-3 border-b border-white/8">
                          ${data.ethBalance.price.toFixed(2)}
                        </td>
                        <td className="py-3 border-b border-white/8">
                          ${data.ethBalance.usdValue.toFixed(2)}
                        </td>
                      </tr>
                    )}
                    {/* Token Rows */}
                    {data.tokens.map((token, i) => (
                      <tr
                        key={token.contractAddress}
                        className="hover:bg-white/5 transition-colors duration-200"
                      >
                        <td className="py-3 border-b border-white/8 last:border-b-0">
                          <div className="flex items-center gap-2">
                            <img
                              src={token.logo || "/logos/default-token.png"}
                              alt={token.symbol}
                              className="w-4 h-4 rounded-full"
                            />
                            <span className="font-medium">{token.symbol}</span>
                          </div>
                        </td>
                        <td className="py-3 border-b border-white/8 last:border-b-0">
                          {token.balance.toFixed(6)}
                        </td>
                        <td className="py-3 border-b border-white/8 last:border-b-0">
                          ${token.price.toFixed(2)}
                        </td>
                        <td className="py-3 border-b border-white/8 last:border-b-0">
                          ${token.usdValue.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="block md:hidden space-y-3">
                {/* ETH Card */}
                {data.ethBalance.balance > 0 && (
                  <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <div className="flex items-center gap-2 mb-6">
                      <img
                        src="/logos/eth-logo.png"
                        alt="ETH"
                        className="w-6 h-6 rounded-full"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "/logos/default-token.png";
                        }}
                      />
                      <span className="font-semibold text-base">ETH</span>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-sm">
                      <div>
                        <div className="text-cyan-300 text-xs mb-1">
                          Balance
                        </div>
                        <div className="font-medium text-white">
                          {data.ethBalance.balance.toFixed(6)}
                        </div>
                      </div>
                      <div>
                        <div className="text-cyan-300 text-xs mb-1">Price</div>
                        <div className="font-medium text-white">
                          ${data.ethBalance.price.toFixed(2)}
                        </div>
                      </div>
                      <div>
                        <div className="text-cyan-300 text-xs mb-1">Value</div>
                        <div className="font-medium text-white">
                          ${data.ethBalance.usdValue.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Token Cards */}
                {data.tokens.map((token) => (
                  <div
                    key={token.contractAddress}
                    className="bg-white/5 rounded-lg p-4 border border-white/10"
                  >
                    <div className="flex items-center gap-2 mb-6">
                      <img
                        src={token.logo || "/logos/default-token.png"}
                        alt={token.symbol}
                        className="w-6 h-6 rounded-full"
                      />
                      <span className="font-semibold text-base">
                        {token.symbol}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-sm">
                      <div>
                        <div className="text-cyan-300 text-xs mb-1">
                          Balance
                        </div>
                        <div className="font-medium text-white">
                          {token.balance.toFixed(6)}
                        </div>
                      </div>
                      <div>
                        <div className="text-cyan-300 text-xs mb-1">Price</div>
                        <div className="font-medium text-white">
                          ${token.price.toFixed(2)}
                        </div>
                      </div>
                      <div>
                        <div className="text-cyan-300 text-xs mb-1">Value</div>
                        <div className="font-medium text-white">
                          ${token.usdValue.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* No Tokens Message */}
              {data.tokens.length === 0 && data.ethBalance.balance === 0 && (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-sm">
                    No tokens found in your wallet
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="w-full text-center py-8">
              <h2 className="text-xl font-semibold">Connect Your Wallet</h2>
              <p className="text-gray-400 text-sm mt-2">
                Connect your wallet to view your token balances
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
