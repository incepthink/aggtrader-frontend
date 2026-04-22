"use client";

import { Box, Typography, Stack } from "@mui/material";
import React, { useState, useEffect } from "react";
import { usePerpTickerStore } from "@/store/perpTickerStore";
import Image from "next/image";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";

interface Market {
  id: string;
  name: string;
  symbol: string;
  icon: string;
}

const MARKETS: Market[] = [
  {
    id: "BTC-USD",
    name: "BTC",
    symbol: "BTC-USD",
    icon: "/logos/perp/btc.png",
  },
  {
    id: "ETH-USD",
    name: "ETH",
    symbol: "ETH-USD",
    icon: "/logos/perp/eth.png",
  },
  {
    id: "SOL-USD",
    name: "SOL",
    symbol: "SOL-USD",
    icon: "/logos/perp/sol.svg",
  },
];

interface MobileMarketHeaderProps {
  isConnected: boolean;
  selectedMarket?: string;
  onMarketChange?: (market: string) => void;
}

const MobileMarketHeader = ({
  selectedMarket = "BTC-USD",
  onMarketChange,
}: MobileMarketHeaderProps) => {
  const ticker = usePerpTickerStore((s) => s.tickers[selectedMarket ?? "BTC-USD"]);
  const [countdown, setCountdown] = useState<string>("--:--:--");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const currentMarket =
    MARKETS.find((m) => m.id === selectedMarket) || MARKETS[0];

  const handleMarketSelect = (marketId: string) => {
    onMarketChange?.(marketId);
    setDropdownOpen(false);
  };

  // Calculate countdown to next funding time
  useEffect(() => {
    const nextFundingTime = ticker?.nextFundingTime;
    if (!nextFundingTime) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const timeLeft = nextFundingTime - now;

      if (timeLeft <= 0) {
        setCountdown("00:00:00");
        return;
      }

      const hours = Math.floor(timeLeft / (1000 * 60 * 60));
      const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

      setCountdown(
        `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`,
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [ticker?.nextFundingTime]);

  const formatPrice = (price: string | null | undefined): string => {
    if (!price) return "--";
    const num = parseFloat(price);
    return num.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatPercentage = (percent: string | null | undefined): string => {
    if (!percent) return "--";
    const num = parseFloat(percent);
    return `${num >= 0 ? "+" : ""}${num.toFixed(2)}%`;
  };

  const getChangeColor = (percent: string | null | undefined): string => {
    if (!percent) return "#999";
    const num = parseFloat(percent);
    return num >= 0 ? "#00F5E0" : "#FF4444";
  };

  return (
    <Box sx={{ width: "100%", position: "relative" }}>
      {/* Market Selector Row */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 2,
          py: 1,
        }}
      >
        {/* Market Selector */}
        <Box
          onClick={() => setDropdownOpen(!dropdownOpen)}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            cursor: "pointer",
            padding: "6px 10px",
            borderRadius: "8px",
            backgroundColor: dropdownOpen
              ? "rgba(255,255,255,0.05)"
              : "transparent",
            "&:hover": { backgroundColor: "rgba(255,255,255,0.05)" },
          }}
        >
          <Image
            src={currentMarket.icon}
            alt={currentMarket.name}
            width={20}
            height={20}
            style={{ borderRadius: "50%" }}
          />
          <Typography
            sx={{
              color: "#fff",
              fontWeight: 600,
              fontSize: "16px",
            }}
          >
            {currentMarket.symbol}
          </Typography>
          <KeyboardArrowDownIcon
            sx={{
              color: "#999",
              fontSize: "18px",
              transform: dropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.2s ease",
            }}
          />
        </Box>
      </Box>

      {/* Dropdown Menu */}
      {dropdownOpen && (
        <Box
          sx={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            backgroundColor: "#0a1628",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "8px",
            zIndex: 1000,
            overflow: "hidden",
            mx: 2,
          }}
        >
          {MARKETS.map((market) => (
            <Box
              key={market.id}
              onClick={() => handleMarketSelect(market.id)}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                padding: "12px 16px",
                cursor: "pointer",
                backgroundColor:
                  selectedMarket === market.id
                    ? "rgba(0,245,224,0.05)"
                    : "transparent",
                "&:hover": { backgroundColor: "rgba(255,255,255,0.05)" },
              }}
            >
              <Image
                src={market.icon}
                alt={market.name}
                width={24}
                height={24}
                style={{ borderRadius: "50%" }}
              />
              <Typography
                sx={{ color: "#fff", fontSize: "14px", fontWeight: 500 }}
              >
                {market.symbol}
              </Typography>
            </Box>
          ))}
        </Box>
      )}

      {/* Stats Row */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 2,
          py: 1.5,
          borderBottom: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        {/* Price */}
        <Stack spacing={0.25}>
          <Typography
            sx={{
              color: "#999",
              fontSize: "10px",
              textTransform: "uppercase",
            }}
          >
            Price
          </Typography>
          <Typography
            sx={{
              color: "#fff",
              fontWeight: 600,
              fontSize: "14px",
            }}
          >
            {formatPrice(ticker?.close)}
          </Typography>
        </Stack>

        {/* Funding / Countdown */}
        <Stack spacing={0.25} alignItems="center">
          <Typography
            sx={{
              color: "#999",
              fontSize: "10px",
              textTransform: "uppercase",
            }}
          >
            Funding / Countdown
          </Typography>
          <Stack direction="row" spacing={0.5} alignItems="center">
            <Typography
              sx={{
                color: getChangeColor(ticker?.currentFundingRate),
                fontWeight: 600,
                fontSize: "12px",
              }}
            >
              {ticker?.currentFundingRate
                ? `${(parseFloat(ticker.currentFundingRate) * 100).toFixed(4)}%`
                : "--"}
            </Typography>
            <Typography
              sx={{
                color: "#00F5E0",
                fontSize: "12px",
              }}
            >
              / {countdown}
            </Typography>
          </Stack>
        </Stack>

        {/* 24h Change */}
        <Stack spacing={0.25} alignItems="flex-end">
          <Typography
            sx={{
              color: "#999",
              fontSize: "10px",
              textTransform: "uppercase",
            }}
          >
            24h Change
          </Typography>
          <Typography
            sx={{
              color: getChangeColor(ticker?.percentChange),
              fontWeight: 600,
              fontSize: "14px",
            }}
          >
            {formatPercentage(ticker?.percentChange)}
          </Typography>
        </Stack>
      </Box>
    </Box>
  );
}

export default MobileMarketHeader;
