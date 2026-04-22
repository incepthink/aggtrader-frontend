"use client";

import {
  Box,
  Typography,
  Stack,
  Chip,
  Slide,
  ClickAwayListener,
  CircularProgress,
} from "@mui/material";
import { KatanaPerpsTicker } from "@katanaperps/katana-perps-sdk";
import React, { useEffect, useState, useRef } from "react";
import Image from "next/image";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";

interface Market {
  id: string;
  name: string;
  symbol: string;
  icon: string;
  leverage: string;
}

const MARKETS: Market[] = [
  {
    id: "BTC-USD",
    name: "BTC",
    symbol: "BTC-USD",
    icon: "/logos/perp/btc.png",
    leverage: "50x",
  },
  {
    id: "ETH-USD",
    name: "ETH",
    symbol: "ETH-USD",
    icon: "/logos/perp/eth.png",
    leverage: "50x",
  },
  {
    id: "SOL-USD",
    name: "SOL",
    symbol: "SOL-USD",
    icon: "/logos/perp/sol.svg",
    leverage: "50x",
  },
];

interface MarketHeaderProps {
  tickerData: KatanaPerpsTicker | null;
  isConnected: boolean;
  isLoading?: boolean;
  error?: string | null;
  retryCount?: number;
  selectedMarket?: string;
  onMarketChange?: (market: string) => void;
}

const MAX_RETRIES = 3;


export default function MarketHeader({
  tickerData,
  isConnected,
  isLoading = false,
  error = null,
  retryCount = 0,
  selectedMarket = "BTC-USD",
  onMarketChange,
}: MarketHeaderProps) {
  const [countdown, setCountdown] = useState<string>("--:--:--");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentMarket =
    MARKETS.find((m) => m.id === selectedMarket) || MARKETS[0];

  const handleMarketSelect = (marketId: string) => {
    onMarketChange?.(marketId);
    setDropdownOpen(false);
  };

  // Calculate countdown to next funding time
  useEffect(() => {
    if (!tickerData?.nextFundingTime) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const timeLeft = tickerData.nextFundingTime - now;

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
  }, [tickerData?.nextFundingTime]);

  const formatPrice = (price: string | null | undefined): string => {
    if (!price) return "--";
    const num = parseFloat(price);
    return num.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatVolume = (volume: string | undefined): string => {
    if (!volume) return "--";
    const num = parseFloat(volume);
    if (num >= 1_000_000) {
      return `$${(num / 1_000_000).toFixed(2)}M`;
    }
    if (num >= 1_000) {
      return `$${(num / 1_000).toFixed(2)}K`;
    }
    return `$${num.toFixed(2)}`;
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

  const noData = !tickerData;

  const statValue = (content: React.ReactNode) => {
    if (noData && error) {
      return (
        <Typography
          variant="body2"
          sx={{ color: "#FF4444", fontSize: { xs: "10px", lg: "11px" }, whiteSpace: "nowrap" }}
        >
          Reconnecting… ({retryCount}/{MAX_RETRIES})
        </Typography>
      );
    }
    return content;
  };

  return (
    <ClickAwayListener onClickAway={() => setDropdownOpen(false)}>
      <Box
        ref={containerRef}
        sx={{
          padding: "0px",
          paddingRight: { xs: "8px", lg: "12px" },
          display: "flex",
          alignItems: "center",
          gap: { xs: 1.5, sm: 2, md: 2.5, lg: 2 },
          justifyContent: "space-between",
          position: "relative",
          overflow: "hidden",
          width: "100%",
          flexWrap: "nowrap",
        }}
      >
        {/* Market Selector */}
        <Box
          onClick={() => setDropdownOpen(!dropdownOpen)}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: { xs: 0.5, lg: 1 },
            cursor: "pointer",
            // padding: { xs: "4px 8px", lg: "8px 12px" },
            borderRadius: "8px",
            backgroundColor: dropdownOpen
              ? "rgba(255,255,255,0.05)"
              : "transparent",
            "&:hover": {
              backgroundColor: "rgba(255,255,255,0.05)",
            },
            transition: "background-color 0.2s ease",
            flexShrink: 0,
          }}
        >
          <Image
            src={currentMarket.icon}
            alt={currentMarket.name}
            width={18}
            height={24}
            style={{ borderRadius: "50%" }}
          />
          <Typography
            variant="h6"
            sx={{
              color: "#fff",
              fontWeight: 600,
              fontSize: { xs: "13px", lg: "16px" },
            }}
          >
            {currentMarket.symbol}
          </Typography>
          <KeyboardArrowDownIcon
            sx={{
              color: "#999",
              fontSize: { xs: "16px", lg: "16px" },
              transform: dropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.2s ease",
            }}
          />
        </Box>

        {/* Dropdown Menu */}
        <Slide direction="right" in={dropdownOpen} mountOnEnter unmountOnExit>
          <Box
            sx={{
              position: "absolute",
              top: "100%",
              left: 0,
              minWidth: "min(600px, calc(100vw - 32px))",
              maxWidth: "calc(100vw - 32px)",
              backgroundColor: "#0a1628",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "12px",
              zIndex: 1000,
              overflow: "hidden",
              boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
            }}
          >
            {/* Dropdown Header */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "180px 100px 100px 100px 120px 100px",
                padding: "12px 16px",
                borderBottom: "1px solid rgba(255,255,255,0.1)",
                backgroundColor: "rgba(255,255,255,0.02)",
              }}
            >
              <Typography
                sx={{
                  color: "#666",
                  fontSize: "11px",
                  textTransform: "uppercase",
                }}
              >
                Market
              </Typography>
              <Typography
                sx={{
                  color: "#666",
                  fontSize: "11px",
                  textTransform: "uppercase",
                }}
              >
                Price
              </Typography>
              <Typography
                sx={{
                  color: "#666",
                  fontSize: "11px",
                  textTransform: "uppercase",
                }}
              >
                24h Change
              </Typography>
              <Typography
                sx={{
                  color: "#666",
                  fontSize: "11px",
                  textTransform: "uppercase",
                }}
              >
                8h Funding
              </Typography>
              <Typography
                sx={{
                  color: "#666",
                  fontSize: "11px",
                  textTransform: "uppercase",
                }}
              >
                24h Volume
              </Typography>
              <Typography
                sx={{
                  color: "#666",
                  fontSize: "11px",
                  textTransform: "uppercase",
                }}
              >
                Open Interest
              </Typography>
            </Box>

            {/* Market Options */}
            {MARKETS.map((market) => (
              <Box
                key={market.id}
                onClick={() => handleMarketSelect(market.id)}
                sx={{
                  display: "grid",
                  gridTemplateColumns: "180px 100px 100px 100px 120px 100px",
                  padding: "12px 16px",
                  cursor: "pointer",
                  backgroundColor:
                    selectedMarket === market.id
                      ? "rgba(0,245,224,0.05)"
                      : "transparent",
                  "&:hover": {
                    backgroundColor: "rgba(255,255,255,0.05)",
                  },
                  transition: "background-color 0.15s ease",
                }}
              >
                {/* Market with Icon and Leverage */}
                <Stack direction="row" alignItems="center" spacing={1.5}>
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
                  <Chip
                    label={market.leverage}
                    size="small"
                    sx={{
                      height: "20px",
                      fontSize: "11px",
                      fontWeight: 600,
                      backgroundColor: "rgba(255,255,255,0.1)",
                      color: "#fff",
                      "& .MuiChip-label": {
                        padding: "0 6px",
                      },
                    }}
                  />
                </Stack>

                {/* Price */}
                <Typography sx={{ color: "#fff", fontSize: "14px" }}>
                  {market.id === selectedMarket
                    ? formatPrice(tickerData?.close)
                    : "--"}
                </Typography>

                {/* 24h Change */}
                <Typography
                  sx={{
                    color:
                      market.id === selectedMarket
                        ? getChangeColor(tickerData?.percentChange)
                        : "#00F5E0",
                    fontSize: "14px",
                  }}
                >
                  {market.id === selectedMarket
                    ? formatPercentage(tickerData?.percentChange)
                    : "+0.00%"}
                </Typography>

                {/* 8h Funding */}
                <Typography
                  sx={{
                    color:
                      market.id === selectedMarket
                        ? getChangeColor(tickerData?.currentFundingRate)
                        : "#fff",
                    fontSize: "14px",
                  }}
                >
                  {market.id === selectedMarket &&
                  tickerData?.currentFundingRate
                    ? `${(parseFloat(tickerData.currentFundingRate) * 100).toFixed(4)}%`
                    : "0.0000%"}
                </Typography>

                {/* 24h Volume */}
                <Typography sx={{ color: "#fff", fontSize: "14px" }}>
                  {market.id === selectedMarket
                    ? formatVolume(tickerData?.quoteVolume)
                    : "$0.00"}
                </Typography>

                {/* Open Interest */}
                <Typography sx={{ color: "#fff", fontSize: "14px" }}>
                  {market.id === selectedMarket
                    ? formatVolume(tickerData?.openInterest)
                    : "$0.00"}
                </Typography>
              </Box>
            ))}
          </Box>
        </Slide>

        {/* Stats section with single loading overlay */}
        <Box sx={{ position: "relative", display: "flex", flex: 1, alignItems: "center", justifyContent: "space-between", minWidth: 0 }}>

          {/* Price */}
          <Stack spacing={{ xs: 0, lg: 0.5 }} sx={{ minWidth: 0, flexShrink: 1 }}>
            <Typography
              variant="caption"
              sx={{
                color: "#666",
                fontSize: { xs: "10px", lg: "10px" },
                textTransform: "uppercase",
                whiteSpace: "nowrap",
                lineHeight: 1.2,
              }}
            >
              Price
            </Typography>
            <Box sx={{ lineHeight: 1.3, display: "flex", alignItems: "center", minHeight: "19px" }}>
              {statValue(
                <Typography
                  variant="body1"
                  sx={{ color: "#fff", fontWeight: 500, fontSize: { xs: "12px", lg: "13px" }, whiteSpace: "nowrap", lineHeight: 1.3 }}
                >
                  {formatPrice(tickerData?.close)}
                </Typography>
              )}
            </Box>
          </Stack>

          {/* Index Price */}
          <Stack spacing={{ xs: 0, lg: 0.5 }} sx={{ minWidth: 0, flexShrink: 1 }}>
            <Typography
              variant="caption"
              sx={{
                color: "#666",
                fontSize: { xs: "10px", lg: "10px" },
                textTransform: "uppercase",
                whiteSpace: "nowrap",
                lineHeight: 1.2,
              }}
            >
              Index
            </Typography>
            <Box sx={{ lineHeight: 1.3, display: "flex", alignItems: "center", minHeight: "19px" }}>
              {statValue(
                <Typography
                  variant="body1"
                  sx={{ color: "#fff", fontWeight: 500, fontSize: { xs: "12px", lg: "13px" }, whiteSpace: "nowrap", lineHeight: 1.3 }}
                >
                  {formatPrice(tickerData?.indexPrice)}
                </Typography>
              )}
            </Box>
          </Stack>

          {/* 24h Change */}
          <Stack spacing={{ xs: 0, lg: 0.5 }} sx={{ minWidth: 0, flexShrink: 1 }}>
            <Typography
              variant="caption"
              sx={{
                color: "#666",
                fontSize: { xs: "10px", lg: "10px" },
                textTransform: "uppercase",
                whiteSpace: "nowrap",
                lineHeight: 1.2,
              }}
            >
              24h Change
            </Typography>
            <Box sx={{ lineHeight: 1.3, display: "flex", alignItems: "center", minHeight: "19px" }}>
              {statValue(
                <Typography
                  variant="body1"
                  sx={{ color: getChangeColor(tickerData?.percentChange), fontWeight: 500, fontSize: { xs: "12px", lg: "13px" }, whiteSpace: "nowrap", lineHeight: 1.3 }}
                >
                  {formatPercentage(tickerData?.percentChange)}
                </Typography>
              )}
            </Box>
          </Stack>

          {/* Funding / Countdown */}
          <Stack spacing={{ xs: 0, lg: 0.5 }} sx={{ minWidth: 0, flexShrink: 1 }}>
            <Typography
              variant="caption"
              sx={{
                color: "#666",
                fontSize: { xs: "10px", lg: "10px" },
                textTransform: "uppercase",
                whiteSpace: "nowrap",
                lineHeight: 1.2,
              }}
            >
              <Box
                component="span"
                sx={{ display: { xs: "none", sm: "inline" } }}
              >
                Funding
              </Box>
              <Box
                component="span"
                sx={{ display: { xs: "inline", sm: "none" } }}
              >
                Fund.
              </Box>
              {" / "}Countdown
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", minHeight: "21px" }}>
              {statValue(
                <Stack direction="row" spacing={{ xs: 0.5, lg: 1 }} alignItems="center" sx={{ flexWrap: "nowrap" }}>
                  <Typography
                    variant="body1"
                    sx={{ color: getChangeColor(tickerData?.currentFundingRate), fontWeight: 500, fontSize: { xs: "12px", lg: "14px" }, whiteSpace: "nowrap", lineHeight: 1.3 }}
                  >
                    {tickerData?.currentFundingRate
                      ? `${(parseFloat(tickerData.currentFundingRate) * 100).toFixed(4)}%`
                      : "--"}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ color: "#00F5E0", fontSize: { xs: "12px", lg: "14px" }, whiteSpace: "nowrap", lineHeight: 1.3 }}
                  >
                    / {countdown}
                  </Typography>
                </Stack>
              )}
            </Box>
          </Stack>

          {/* Open Interest */}
          <Stack spacing={{ xs: 0, lg: 0.5 }} sx={{ minWidth: 0, flexShrink: 1 }}>
            <Typography
              variant="caption"
              sx={{
                color: "#666",
                fontSize: { xs: "10px", lg: "10px" },
                textTransform: "uppercase",
                whiteSpace: "nowrap",
                lineHeight: 1.2,
              }}
            >
              Open Interest
            </Typography>
            <Box sx={{ lineHeight: 1.3, display: "flex", alignItems: "center", minHeight: "19px" }}>
              {statValue(
                <Typography
                  variant="body1"
                  sx={{ color: "#fff", fontWeight: 500, fontSize: { xs: "12px", lg: "13px" }, whiteSpace: "nowrap", lineHeight: 1.3 }}
                >
                  {formatVolume(tickerData?.openInterest)}
                </Typography>
              )}
            </Box>
          </Stack>

          {/* 24h Volume */}
          <Stack spacing={{ xs: 0, lg: 0.5 }} sx={{ minWidth: 0, flexShrink: 1 }}>
            <Typography
              variant="caption"
              sx={{
                color: "#666",
                fontSize: { xs: "10px", lg: "10px" },
                textTransform: "uppercase",
                whiteSpace: "nowrap",
                lineHeight: 1.2,
              }}
            >
              24h Volume
            </Typography>
            <Box sx={{ lineHeight: 1.3, display: "flex", alignItems: "center", minHeight: "19px" }}>
              {statValue(
                <Typography
                  variant="body1"
                  sx={{ color: "#fff", fontWeight: 500, fontSize: { xs: "12px", lg: "13px" }, whiteSpace: "nowrap", lineHeight: 1.3 }}
                >
                  {formatVolume(tickerData?.quoteVolume)}
                </Typography>
              )}
            </Box>
          </Stack>

          {/* Single centered loading spinner */}
          {noData && isLoading && (
            <Box sx={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <CircularProgress size={20} thickness={4} sx={{ color: "#00F5E0" }} />
            </Box>
          )}
        </Box>
      </Box>
    </ClickAwayListener>
  );
}
