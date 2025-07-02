"use client";

import axios from "axios";
import { useAccount } from "wagmi";
import { useEffect, useState } from "react";

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

export default function TokenBalancesCard() {
  const [suspicious, setSuspicious] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const { address } = useAccount();

  async function getSpotBalance(address: string) {
    try {
      const apiKey = process.env.NEXT_PUBLIC_COVALENT_KEY;

      if (!apiKey) {
        console.error("Covalent API key missing");
      }

      const url = `https://api.covalenthq.com/v1/1/address/${address}/balances_v3/?no-nft-fetch=true&key=${apiKey}`;

      const { data } = await axios.get(url);
      const items = data?.data?.items || [];
      console.log("ITEMS::", items);
      setItems(items);
    } catch (err) {
      console.error("Error fetching Covalent balances:", err);
      setItems([]);
    }
  }

  useEffect(() => {
    if (address) {
      getSpotBalance(address);
    }
  }, [address]);

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
            <div className="tb-title">
              Token Balances
              <button className="tb-btn-icon">+</button>
              <button className="tb-btn">Filter</button>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              {/* simple toggle */}
              <div
                className="tb-toggle"
                data-on={suspicious}
                onClick={() => setSuspicious(!suspicious)}
              />
              <span style={{ fontSize: "0.75rem", color: "#00ffe9" }}>
                Suspicious Filters
              </span>
              <button className="tb-btn-icon">star</button>
            </div>
          </div>

          {/* table */}
          <div style={{ overflowX: "auto" }}>
            <table className="tb-table">
              <thead>
                <tr>
                  <th>Token</th>
                  <th>Balance</th>
                  <th>Price</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                {items.length !== 0 ? (
                  items.map((item, i) => {
                    return (
                      <tr key={i} className="tb-row">
                        <td>
                          <div className="tb-token">
                            <img
                              src={item.logo_url}
                              alt={item.contract_ticker_symbol}
                            />
                            {item.contract_ticker_symbol}
                          </div>
                        </td>
                        <td>
                          {(
                            Number(item.balance) *
                            10 ** -item.contract_decimals
                          ).toFixed(5)}
                        </td>
                        <td>{item.quote_rate}</td>
                        <td>{item.pretty_quote}</td>
                      </tr>
                    );
                  })
                ) : (
                  <div></div>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
