"use client";

import axios from "axios";
import { useAccount } from "wagmi";
import { useEffect, useState } from "react";
import { CircularProgress } from "@mui/material";
const { Alchemy, Network } = require("alchemy-sdk");

interface item {
  name: string;
  balance: string;
  symbol: string;
  logo: string;
  contractAddress: string;
  price: string;
  usdValue: string;
}

export default function TokenBalancesCard() {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<item[]>([]);
  const { address, isConnected } = useAccount();

  const config = {
    apiKey: process.env.NEXT_PUBLIC_ALCHEMY_API,
    network: Network.ETH_MAINNET,
  };

  const alchemy = new Alchemy(config);

  async function getBatchPricesFromAlchemy(
    tokenAddresses: Array<{ network: string; address: string }>
  ) {
    try {
      const response = await fetch(
        `https://api.g.alchemy.com/prices/v1/${process.env.NEXT_PUBLIC_ALCHEMY_API}/tokens/by-address`,
        {
          method: "POST",
          headers: {
            accept: "application/json",
            "content-type": "application/json",
          },
          body: JSON.stringify({
            addresses: tokenAddresses,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Alchemy Price API error: ${response.status}`);
      }

      const data = await response.json();
      console.log("data::", data);

      const prices: { [key: string]: number } = {};
      data.data.forEach((item: any) => {
        if (item.prices && item.prices.length > 0) {
          const usdPrice = item.prices.find((p: any) => p.currency === "usd");
          if (usdPrice) {
            prices[item.address.toLowerCase()] = Number(usdPrice.value);
          }
        }
      });

      return prices;
    } catch (error) {
      console.error("Error fetching prices from Alchemy:", error);
      return {};
    }
  }

  async function getSpotBalance(address: string) {
    try {
      setLoading(true);
      const ethBalance = await alchemy.core.getBalance(address);
      console.log("ETHBALANCE::", ethBalance);

      const balances = await alchemy.core.getTokenBalances(address);
      console.log(balances);

      const nonZeroBalances = balances.tokenBalances.filter((token: any) => {
        return parseInt(token.tokenBalance, 16) !== 0;
      });

      const contractAddresses = nonZeroBalances.map((token: any) => ({
        network: "eth-mainnet",
        address: token.contractAddress,
      }));

      contractAddresses.push({
        network: "eth-mainnet",
        address: "0x0000000000000000000000000000000000000000",
      });

      const prices = await getBatchPricesFromAlchemy(contractAddresses);

      let items = [];

      if (ethBalance && ethBalance.toString() !== "0") {
        const ethBalanceBigInt = BigInt(ethBalance.toString());
        const ethReadableBalance = Number(ethBalanceBigInt) / Math.pow(10, 18);

        const ethPrice =
          prices["0x0000000000000000000000000000000000000000"] || 0;
        const ethUsdValue = ethReadableBalance * ethPrice;

        items.push({
          name: "Ethereum",
          balance: ethReadableBalance.toFixed(6),
          symbol: "ETH",
          logo: "/logos/eth-logo.png",
          contractAddress: "0x0000000000000000000000000000000000000000",
          price: ethPrice.toFixed(2),
          usdValue: ethUsdValue.toFixed(6),
        });
      }

      for (let token of nonZeroBalances) {
        const balanceDecimal = parseInt(token.tokenBalance, 16);

        const metadata = await alchemy.core.getTokenMetadata(
          token.contractAddress
        );

        const decimals = metadata.decimals || 18;
        const readableBalance = balanceDecimal / Math.pow(10, decimals);
        const formattedBalance = readableBalance;

        const tokenPrice = prices[token.contractAddress.toLowerCase()] || 0;
        const usdValue = readableBalance * tokenPrice;

        console.log(
          `${metadata.name}: ${formattedBalance} ${metadata.symbol} ($${usdValue})`
        );

        items.push({
          name: metadata.name,
          balance: formattedBalance.toFixed(6),
          symbol: metadata.symbol,
          logo: metadata.logo,
          contractAddress: token.contractAddress,
          price: tokenPrice.toFixed(2),
          usdValue: usdValue.toFixed(6),
        });
      }

      console.log("balances:", balances);
      console.log("items with prices:", items);
      setItems(items);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching balances:", err);
      setItems([]);
      setLoading(false);
    }
  }

  useEffect(() => {
    if (address) {
      getSpotBalance(address);
    }
  }, [address]);

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
          {isConnected ? (
            loading ? (
              <div className="w-full flex justify-center pb-4">
                <CircularProgress sx={{ color: "primary.main" }} />
              </div>
            ) : (
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
                    {items.length !== 0 ? (
                      <tbody>
                        {items.map((item, i) => (
                          <tr
                            key={i}
                            className="hover:bg-white/5 transition-colors duration-200"
                          >
                            <td className="py-3 border-b border-white/8 last:border-b-0">
                              <div className="flex items-center gap-2">
                                <img
                                  src={item.logo}
                                  alt={item.symbol}
                                  className="w-4 h-4 rounded-full"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src =
                                      "/logos/default-token.png";
                                  }}
                                />
                                <span className="font-medium">
                                  {item.symbol}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 border-b border-white/8 last:border-b-0">
                              {parseFloat(item.balance).toFixed(6)}
                            </td>
                            <td className="py-3 border-b border-white/8 last:border-b-0">
                              ${item.price}
                            </td>
                            <td className="py-3 border-b border-white/8 last:border-b-0">
                              ${item.usdValue}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    ) : null}
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="block md:hidden space-y-3">
                  {items.length !== 0
                    ? items.map((item, i) => (
                        <div
                          key={i}
                          className="bg-white/5 rounded-lg p-4 border border-white/10"
                        >
                          {/* Token Header - Icon and Name in one line */}
                          <div className="flex items-center gap-2 mb-6">
                            <img
                              src={item.logo}
                              alt={item.symbol}
                              className="w-6 h-6 rounded-full"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                  "/logos/default-token.png";
                              }}
                            />
                            <span className="font-semibold text-base">
                              {item.symbol}
                            </span>
                          </div>

                          {/* Token Details - Balance, Price, Value in a row */}
                          <div className="grid grid-cols-3 gap-3 text-sm">
                            <div>
                              <div className="text-cyan-300 text-xs mb-1">
                                Balance
                              </div>
                              <div className="font-medium text-white">
                                {parseFloat(item.balance).toFixed(6)}
                              </div>
                            </div>
                            <div>
                              <div className="text-cyan-300 text-xs mb-1">
                                Price
                              </div>
                              <div className="font-medium text-white">
                                ${item.price}
                              </div>
                            </div>
                            <div>
                              <div className="text-cyan-300 text-xs mb-1">
                                Value
                              </div>
                              <div className="font-medium text-white">
                                ${item.usdValue}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    : null}
                </div>

                {/* No Tokens Message */}
                {items.length === 0 && !loading && (
                  <div className="text-center py-8">
                    <div className="text-gray-400 text-sm">
                      No tokens found in your wallet
                    </div>
                  </div>
                )}
              </>
            )
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
