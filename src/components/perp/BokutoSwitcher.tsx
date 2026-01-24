"use client";

import { Box, Button, Typography, Alert } from "@mui/material";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { useState } from "react";

const BOKUTO_CHAIN_ID = 737373;

/**
 * BokutoSwitcher - Shows warning banner on perp page when wallet is on wrong chain
 * Only displayed when wallet is connected but not on Bokuto testnet
 */
const BokutoSwitcher = () => {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending } = useSwitchChain();
  const [error, setError] = useState<string | null>(null);

  const isOnBokuto = chainId === BOKUTO_CHAIN_ID;
  const needsChainSwitch = isConnected && !isOnBokuto;

  // Don't show if wallet is not connected or already on correct chain
  if (!needsChainSwitch) {
    return null;
  }

  const handleSwitchChain = async () => {
    try {
      setError(null);
      switchChain({ chainId: BOKUTO_CHAIN_ID });
    } catch (err: any) {
      console.error("Failed to switch chain:", err);
      setError(err.message || "Failed to switch network");
    }
  };

  return (
    <Box
      sx={{
        width: "100%",
        padding: 2,
        background:
          "linear-gradient(135deg, rgba(255, 165, 0, 0.1), rgba(255, 69, 0, 0.1))",
        borderBottom: "1px solid rgba(255, 165, 0, 0.3)",
      }}
    >
      <Alert
        severity="warning"
        sx={{
          background: "rgba(0, 0, 0, 0.3)",
          color: "#FFA500",
          border: "1px solid rgba(255, 165, 0, 0.5)",
          "& .MuiAlert-icon": {
            color: "#FFA500",
          },
        }}
        action={
          <Button
            color="inherit"
            size="small"
            onClick={handleSwitchChain}
            disabled={isPending}
            sx={{
              color: "#FFA500",
              borderColor: "#FFA500",
              "&:hover": {
                borderColor: "#FFD700",
                background: "rgba(255, 165, 0, 0.1)",
              },
            }}
            variant="outlined"
          >
            {isPending ? "Switching..." : "Switch to Bokuto Testnet"}
          </Button>
        }
      >
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          Please switch to Bokuto testnet to trade perpetuals
        </Typography>
        {error && (
          <Typography
            variant="caption"
            sx={{ display: "block", mt: 1, color: "#FF6B6B" }}
          >
            Error: {error}
          </Typography>
        )}
      </Alert>
    </Box>
  );
};

export default BokutoSwitcher;
