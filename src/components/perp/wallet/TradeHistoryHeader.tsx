"use client";

import React from "react";
import {
  Box,
  Typography,
  Button,
  Select,
  MenuItem,
  FormControl,
  SelectChangeEvent,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { KatanaPerpsFill, formatFillForDisplay } from "@/hooks/perp/useKatanaPerpsFills";

interface TradeHistoryHeaderProps {
  selectedMarket: string;
  onMarketChange: (market: string) => void;
  fills: KatanaPerpsFill[];
}

const markets = [
  { value: "", label: "Filter by Market" },
  { value: "BTC-USD", label: "BTC-USD" },
  { value: "ETH-USD", label: "ETH-USD" },
  { value: "SOL-USD", label: "SOL-USD" },
  { value: "DOGE-USD", label: "DOGE-USD" },
  { value: "PEPE-USD", label: "PEPE-USD" },
];

export const TradeHistoryHeader: React.FC<TradeHistoryHeaderProps> = ({
  selectedMarket,
  onMarketChange,
  fills,
}) => {
  const handleMarketChange = (event: SelectChangeEvent<string>) => {
    onMarketChange(event.target.value);
  };

  const handleDownloadCSV = () => {
    if (!fills || fills.length === 0) return;

    // CSV headers
    const headers = [
      "Date",
      "Market",
      "Side",
      "Price",
      "Quantity",
      "Value",
      "Trade Fee",
      "Type",
      "Liquidity",
      "Realized P&L",
      "Status",
    ];

    // Convert fills to CSV rows
    const rows = fills.map((fill) => {
      const formatted = formatFillForDisplay(fill);
      return [
        formatted.date,
        fill.market,
        fill.side,
        formatted.price,
        formatted.quantity,
        formatted.value,
        formatted.fee,
        formatted.type,
        formatted.liquidity,
        formatted.realizedPnLFormatted,
        formatted.statusFormatted,
      ];
    });

    // Create CSV content
    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");

    // Download file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `trade_history_${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        py: 1.5,
        px: 2,
        borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
      }}
    >
      {/* Left: Title */}
      <Typography sx={{ color: "#fff", fontSize: "1.125rem", fontWeight: 500 }}>
        Trade History
      </Typography>

      {/* Right: Controls */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        {/* Download CSV Button */}
        <Button
          onClick={handleDownloadCSV}
          disabled={!fills || fills.length === 0}
          sx={{
            px: 2,
            py: 0.75,
            minWidth: "auto",
            background: "transparent",
            color: "#fff",
            fontSize: "0.875rem",
            fontWeight: 400,
            textTransform: "none",
            "&:hover": {
              background: "rgba(255, 255, 255, 0.05)",
            },
            "&.Mui-disabled": {
              color: "rgba(255, 255, 255, 0.3)",
            },
          }}
          startIcon={<DownloadIcon sx={{ fontSize: "1rem !important" }} />}
        >
          Download CSV
        </Button>

        {/* Market Filter */}
        <FormControl size="small">
          <Select
            value={selectedMarket}
            onChange={handleMarketChange}
            displayEmpty
            IconComponent={KeyboardArrowDownIcon}
            sx={{
              minWidth: 160,
              backgroundColor: "transparent",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              borderRadius: "4px",
              color: "#fff",
              fontSize: "0.875rem",
              "& .MuiSelect-select": {
                py: 0.75,
                px: 1.5,
              },
              "& .MuiOutlinedInput-notchedOutline": {
                border: "none",
              },
              "& .MuiSvgIcon-root": {
                color: "rgba(255, 255, 255, 0.5)",
              },
              "&:hover": {
                backgroundColor: "rgba(255, 255, 255, 0.05)",
              },
            }}
            MenuProps={{
              PaperProps: {
                sx: {
                  backgroundColor: "#1a1f2e",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  "& .MuiMenuItem-root": {
                    color: "#fff",
                    fontSize: "0.875rem",
                    "&:hover": {
                      backgroundColor: "rgba(0, 245, 224, 0.1)",
                    },
                    "&.Mui-selected": {
                      backgroundColor: "rgba(0, 245, 224, 0.15)",
                      "&:hover": {
                        backgroundColor: "rgba(0, 245, 224, 0.2)",
                      },
                    },
                  },
                },
              },
            }}
          >
            {markets.map((market) => (
              <MenuItem key={market.value} value={market.value}>
                {market.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Withdraw Button */}
        <Button
          disabled
          sx={{
            px: 3,
            py: 0.75,
            background: "transparent",
            border: "1px solid rgba(255, 255, 255, 0.3)",
            color: "#fff",
            fontSize: "0.875rem",
            fontWeight: 500,
            textTransform: "none",
            borderRadius: "4px",
            minWidth: "100px",
            "&.Mui-disabled": {
              color: "rgba(255, 255, 255, 0.5)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
            },
          }}
        >
          Withdraw
        </Button>

        {/* Deposit Button */}
        <Button
          disabled
          sx={{
            px: 3,
            py: 0.75,
            background: "transparent",
            border: "1px solid #00F5E0",
            color: "#00F5E0",
            fontSize: "0.875rem",
            fontWeight: 500,
            textTransform: "none",
            borderRadius: "4px",
            minWidth: "100px",
            "&.Mui-disabled": {
              color: "rgba(0, 245, 224, 0.5)",
              border: "1px solid rgba(0, 245, 224, 0.3)",
            },
          }}
        >
          Deposit
        </Button>
      </Box>
    </Box>
  );
};

export default TradeHistoryHeader;
