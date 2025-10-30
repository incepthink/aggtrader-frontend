// src/components/RecentTransactionCard.tsx
import React, { useState } from "react";
import { useAccount } from "wagmi";
import { useKatanaTransactions } from "@/hooks/useKatanaTransactions";

type FilterType = "all" | "eth" | "token";

const KATANA_EXPLORER = "https://katanascan.com";

export default function RecentTransactionCard() {
  const { address, isConnected } = useAccount();
  const {
    data: transactions,
    isLoading,
    error,
    refetch,
  } = useKatanaTransactions(address);
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");

  const handleReload = () => {
    refetch();
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(parseInt(timestamp) * 1000);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  };

  const formatAmount = (value: string, decimals: string, symbol: string) => {
    const dec = parseInt(decimals);
    const amount = parseFloat(value) / Math.pow(10, dec);

    if (amount === 0) return `0 ${symbol}`;
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(2)}M ${symbol}`;
    if (amount >= 1000) return `${(amount / 1000).toFixed(2)}K ${symbol}`;
    if (amount < 0.0001) return `${amount.toExponential(4)} ${symbol}`;
    if (amount < 1) return `${amount.toFixed(6)} ${symbol}`;
    if (amount < 10) return `${amount.toFixed(4)} ${symbol}`;
    return `${amount.toFixed(2)} ${symbol}`;
  };

  const openTransaction = (hash: string) => {
    window.open(`${KATANA_EXPLORER}/tx/${hash}`, "_blank");
  };

  const isETHTransaction = (symbol: string) => {
    if (symbol.startsWith("yv")) return false;
    return symbol === "ETH";
  };

  const filteredTransactions = React.useMemo(() => {
    if (!transactions) return [];

    if (activeFilter === "all") {
      return transactions;
    } else if (activeFilter === "eth") {
      return transactions.filter((tx) => isETHTransaction(tx.tokenSymbol));
    } else {
      return transactions.filter((tx) => !isETHTransaction(tx.tokenSymbol));
    }
  }, [transactions, activeFilter]);

  return (
    <div className="neon-panel">
      <header className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-white">
            Recent Transactions
          </h3>
          {isLoading && (
            <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
          )}
        </div>
        <button
          onClick={handleReload}
          disabled={isLoading || !isConnected}
          className="text-cyan-400 hover:text-cyan-300 disabled:text-white/20 disabled:cursor-not-allowed transition-colors p-1 cursor-pointer"
          title="Reload transactions"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-5 w-5 ${isLoading ? "animate-spin" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>
      </header>

      <div className="flex gap-2 mb-4">
        {[
          { label: "All", value: "all" },
          { label: "ETH", value: "eth" },
          { label: "Token", value: "token" },
        ].map((filter) => (
          <button
            key={filter.value}
            onClick={() => setActiveFilter(filter.value as FilterType)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              activeFilter === filter.value
                ? "bg-cyan-400 text-black"
                : "bg-white/10 text-white/60 hover:bg-white/20"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="text-yellow-400 text-sm mb-4 p-3 bg-yellow-400/10 border border-yellow-400/20 rounded">
          Failed to load transactions
        </div>
      )}

      {filteredTransactions.length > 0 ? (
        <div
          className="space-y-3 max-h-[280px] overflow-y-auto"
          key={activeFilter}
        >
          {filteredTransactions.slice(0, 10).map((tx, index) => (
            <div
              key={`${tx.hash}-${index}`}
              onClick={() => openTransaction(tx.hash)}
              className="p-3 rounded-lg bg-black/20 hover:bg-black/25 transition-all border border-white/5 hover:border-cyan-400/20 cursor-pointer"
            >
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/40">
                    {formatDate(tx.timeStamp)}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded bg-white/10 text-white/60">
                    {isETHTransaction(tx.tokenSymbol) ? "ETH" : "TOKEN"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/40">From:</span>
                  <span className="text-sm text-white/80">
                    {formatAddress(tx.from)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/40">To:</span>
                  <span className="text-sm text-white/80">
                    {formatAddress(tx.to)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/40">Amount:</span>
                  <span className="text-sm font-medium text-cyan-400">
                    {formatAmount(tx.value, tx.tokenDecimal, tx.tokenSymbol)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex h-[180px] flex-col items-center justify-center gap-4 text-center">
          <div className="w-16 h-16 bg-white/5 rounded-lg flex items-center justify-center">
            <span className="text-2xl text-white/20">📄</span>
          </div>
          <div>
            <p className="text-white/60 text-sm mb-1">
              {isLoading ? "Loading activity..." : "No activity found"}
            </p>
            {!isConnected && (
              <p className="text-white/40 text-xs">
                Connect your wallet to view transactions
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
