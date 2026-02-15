"use client";

import { useState } from "react";
import { Box, Typography, Button, Alert, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import AccountBalanceDisplay from "@/components/perp/wallet/AccountBalanceDisplay";
import { PositionsWalletTable } from "@/components/perp/wallet/PositionsWalletTable";
import {
  useKatanaPerpsPositions,
  KatanaPerpsPosition,
  isLongPosition,
} from "@/hooks/perp/useKatanaPerpsPositions";
import { useMarketOrder } from "@/hooks/perp/createOrder/useMarketOrder";

export default function PositionsPage() {
  const [closingMarket, setClosingMarket] = useState<string | null>(null);
  const [closeError, setCloseError] = useState<string | null>(null);

  const {
    data: positions = [],
    isLoading,
    error,
    refetch: refetchPositions,
  } = useKatanaPerpsPositions();

  const { createMarketOrder } = useMarketOrder();

  const handleClosePosition = async (position: KatanaPerpsPosition) => {
    if (closingMarket) return; // Prevent multiple simultaneous closes

    setClosingMarket(position.market);
    setCloseError(null);

    try {
      const isLong = isLongPosition(position);
      const quantity = Math.abs(parseFloat(position.quantity)).toFixed(8);
      const closeSide = isLong ? "sell" : "buy";

      console.log("Closing position:", {
        market: position.market,
        side: closeSide,
        quantity,
        reduceOnly: true,
      });

      const result = await createMarketOrder({
        market: position.market,
        side: closeSide,
        quantity,
        leverage: parseInt(position.leverage) || 1,
        reduceOnly: true,
      });

      console.log("Position closed successfully:", result);

      // Refresh positions after successful close
      refetchPositions();
    } catch (err: unknown) {
      console.error("Failed to close position:", err);

      let errorMessage = "Failed to close position";
      if (err instanceof Error) {
        if (
          err.message.includes("User rejected") ||
          err.message.includes("User denied")
        ) {
          errorMessage = "Signature rejected";
        } else {
          errorMessage = err.message;
        }
      }

      setCloseError(errorMessage);

      // Clear error after 5 seconds
      setTimeout(() => setCloseError(null), 5000);
    } finally {
      setClosingMarket(null);
    }
  };

  return (
    <Box>
      {/* First Row: Title + Buttons */}
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
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Typography
            sx={{ color: "#fff", fontSize: "1.125rem", fontWeight: 500 }}
          >
            Positions
          </Typography>
          <Box
            sx={{
              px: 1,
              py: 0.25,
              borderRadius: 1,
              bgcolor: "rgba(0, 245, 224, 0.1)",
              color: "#00F5E0",
              fontSize: "0.75rem",
              fontWeight: 500,
            }}
          >
            {positions.length}
          </Box>
        </Box>
        <Box sx={{ display: "flex", gap: 1.5 }}>
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

      {/* Second Row: Balance Stats */}
      <AccountBalanceDisplay />

      {/* Error Alert */}
      {closeError && (
        <Box>
          <Alert
            severity="error"
            sx={{
              bgcolor: "rgba(255, 68, 68, 0.1)",
              border: "1px solid rgba(255, 68, 68, 0.3)",
              color: "#FF4444",
              "& .MuiAlert-icon": {
                color: "#FF4444",
              },
            }}
            action={
              <IconButton
                size="small"
                onClick={() => setCloseError(null)}
                sx={{ color: "#FF4444" }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            }
          >
            {closeError}
          </Alert>
        </Box>
      )}

      {/* Positions Table */}
      <Box>
        <PositionsWalletTable
          positions={positions}
          isLoading={isLoading}
          error={error}
          onClosePosition={handleClosePosition}
          closingMarket={closingMarket}
        />
      </Box>
    </Box>
  );
}
