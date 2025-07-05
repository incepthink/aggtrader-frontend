"use client";

import axios from "axios";
import { useAccount } from "wagmi";
import { useEffect, useState } from "react";
import { CircularProgress } from "@mui/material";
const { Alchemy, Network } = require("alchemy-sdk");

const rows = [
  {
    symbol: "WETH",
    balance: "0.002",
    price: "$2428",
    value: "$18.452",
    icon: "/images/logos/weth.png", // replace with real paths
  },
  {
    symbol: "WBTC",
    balance: "0.000002",
    price: "$107222",
    value: "$14.650",
    icon: "/images/logos/wbtc.png",
  },
  {
    symbol: "MATIC",
    balance: "356.58",
    price: "$0.0058",
    value: "$3.54",
    icon: "/images/logos/matic.png",
  },
  {
    symbol: "rETH",
    balance: "548.0",
    price: "$0.0215",
    value: "$0.452",
    icon: "/images/logos/reth.png",
  },
];

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
  const { address } = useAccount();

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

      // Convert to our format
      const prices: { [key: string]: number } = {};
      data.data.forEach((item: any) => {
        if (item.prices && item.prices.length > 0) {
          // Get USD price (prices array contains different currency pairs)
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

      // Extract all contract addresses for batch price fetching
      const contractAddresses = nonZeroBalances.map((token: any) => ({
        network: "eth-mainnet", // or your target network
        address: token.contractAddress,
      }));

      contractAddresses.push({
        network: "eth-mainnet",
        address: "0x0000000000000000000000000000000000000000", // ETH placeholder
      });

      // Use Alchemy's Price API for batch price fetching
      const prices = await getBatchPricesFromAlchemy(contractAddresses);

      let items = [];

      if (ethBalance && ethBalance.toString() !== "0") {
        const ethBalanceBigInt = BigInt(ethBalance.toString());
        const ethReadableBalance = Number(ethBalanceBigInt) / Math.pow(10, 18); // ETH has 18 decimals

        // Get ETH price
        const ethPrice =
          prices["0x0000000000000000000000000000000000000000"] || 0;
        const ethUsdValue = ethReadableBalance * ethPrice;

        items.push({
          name: "Ethereum",
          balance: ethReadableBalance.toFixed(6),
          symbol: "ETH",
          logo: "/logos/eth-logo.png", // You can add ETH logo URL here
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

        // Convert balance to human readable format
        const decimals = metadata.decimals || 18;
        const readableBalance = balanceDecimal / Math.pow(10, decimals);
        const formattedBalance = readableBalance;

        // Get price for this token from Alchemy's response
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

  const { isConnected } = useAccount();

  return (
    <>
      {/* ----------  LOCAL CSS  ---------- */}
      <style>{`
        /* --- wrapper & neon border --------------------------------------------------- */
        .tb-wrapper {
          position: relative;     /* tweak as needed */
          margin: 0 auto;
          border-radius: 12px;         /* same 12 px corner radius */
        }

        /* --- card body --------------------------------------------------------------- */
        .tb-card {
          position: relative;
          padding: 32px;
          border-radius: 16px;
          color: #fff;
          font-family: system-ui, sans-serif;
        }

        /* --- header: title + buttons ------------------------------------------------- */
        .tb-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }
        .tb-title {
          font-size: 1.125rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .tb-btn, .tb-btn-icon {
          background: transparent;
          border: none;
          color: #fff;
          cursor: pointer;
        }
        .tb-btn-icon:hover,
        .tb-btn:hover {
          background: rgba(255,255,255,.1);
        }
        .tb-btn {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: .75rem;
          padding: 2px 6px;
          border-radius: 4px;
        }
        .tb-btn-icon {
          width: 24px;
          height: 24px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* --- toggle ------------------------------------------------------------------ */
        .tb-toggle {
          position: relative;
          width: 40px;
          height: 20px;
          border-radius: 20px;
          background: rgba(110,110,110,.5);
          cursor: pointer;
          transition: background .25s;
        }
        .tb-toggle[data-on="true"] { background: rgba(0,255,233,.6); }
        .tb-toggle::after {
          content: '';
          position: absolute;
          top: 2px;
          left: 2px;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #fff;
          transition: transform .25s;
        }
        .tb-toggle[data-on="true"]::after { transform: translateX(20px); }

        /* --- table ------------------------------------------------------------------- */
        .tb-table {
          width: 100%;
          border-collapse: collapse;
          font-size: .875rem;
        }
        .tb-table th {
          text-align: left;
          font-weight: 500;
          padding-bottom: 12px;
          color: rgba(0,255,233,.8);
        }
        .tb-table td {
          padding: 12px 0;
          border-bottom: 1px solid rgba(255,255,255,.08);
        }
        .tb-table tr:last-child td { border-bottom: none; }
        .tb-token {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .tb-token img { width: 16px; height: 16px; }
        .tb-row:hover { background: rgba(255,255,255,.05); }
      `}</style>

      {/* ----------  COMPONENT MARKUP  ---------- */}
      <div className="tb-wrapper">
        <div className="tb-card">
          {/* header */}
          <div className="tb-header">
            <div className="tb-title">Token Balances</div>

            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              {/* simple toggle */}
              {/* <div
                className="tb-toggle"
                data-on={suspicious}
                onClick={() => setSuspicious(!suspicious)}
              />
              <span style={{ fontSize: "0.75rem", color: "#00ffe9" }}>
                Suspicious Filters
              </span>
              <button className="tb-btn-icon">star</button> */}
            </div>
          </div>

          {/* table */}
          <div>
            {isConnected ? (
              loading ? (
                <div className="w-full flex justify-center pb-2">
                  <CircularProgress sx={{ color: "primary.main" }} />
                </div>
              ) : (
                <table className="tb-table">
                  <thead>
                    <tr>
                      <th>Token</th>
                      <th>Balance</th>
                      <th>Price</th>
                      <th>Value</th>
                    </tr>
                  </thead>

                  {items.length !== 0 ? (
                    <tbody>
                      {items.map((item, i) => {
                        return (
                          <tr key={i} className="tb-row">
                            <td>
                              <div className="tb-token">
                                <img src={item.logo} alt={item.symbol} />
                                {item.symbol}
                              </div>
                            </td>
                            <td>{item.balance}</td>
                            <td>{item.price}</td>
                            <td>{item.usdValue}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  ) : (
                    <div></div>
                  )}
                </table>
              )
            ) : (
              <div className="w-full text-center">
                <h2>Connect Your Wallet</h2>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
