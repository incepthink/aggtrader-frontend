"use client";

import { Box, Typography, Alert, CircularProgress } from "@mui/material";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { useState, useEffect, useRef } from "react";

const BOKUTO_CHAIN_ID = 737373;

/**
 * BokutoSwitcher - Automatically switches to Bokuto testnet on perp page
 * Shows status banner while switching or if an error occurs
 */
const BokutoSwitcher = () => {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending } = useSwitchChain();
  const [error, setError] = useState<string | null>(null);
  const hasAttemptedSwitch = useRef(false);

  const isOnBokuto = chainId === BOKUTO_CHAIN_ID;
  const needsChainSwitch = isConnected && !isOnBokuto;

  // Automatically switch chain when needed
  useEffect(() => {
    if (needsChainSwitch && !isPending && !hasAttemptedSwitch.current) {
      hasAttemptedSwitch.current = true;
      setError(null);

      try {
        switchChain(
          { chainId: BOKUTO_CHAIN_ID },
          {
            onError: (err) => {
              console.error("Failed to switch chain:", err);
              setError(err.message || "Failed to switch network");
            },
          }
        );
      } catch (err: any) {
        console.error("Failed to switch chain:", err);
        setError(err.message || "Failed to switch network");
      }
    }
  }, [needsChainSwitch, isPending, switchChain]);

  // Reset the attempt flag when chain changes or disconnects
  useEffect(() => {
    if (isOnBokuto || !isConnected) {
      hasAttemptedSwitch.current = false;
      setError(null);
    }
  }, [isOnBokuto, isConnected]);

  // Don't show if wallet is not connected or already on correct chain
  if (!needsChainSwitch) {
    return null;
  }

  return (
    <Box
      sx={{
        width: "100%",
        padding: 2,
        background: error
          ? "linear-gradient(135deg, rgba(255, 69, 0, 0.1), rgba(255, 0, 0, 0.1))"
          : "linear-gradient(135deg, rgba(255, 165, 0, 0.1), rgba(255, 69, 0, 0.1))",
        borderBottom: `1px solid ${error ? "rgba(255, 69, 0, 0.3)" : "rgba(255, 165, 0, 0.3)"}`,
      }}
    >
      <Alert
        severity={error ? "error" : "info"}
        icon={
          isPending ? (
            <CircularProgress size={20} sx={{ color: "#FFA500" }} />
          ) : undefined
        }
        sx={{
          background: "rgba(0, 0, 0, 0.3)",
          color: error ? "#FF6B6B" : "#FFA500",
          border: `1px solid ${error ? "rgba(255, 69, 0, 0.5)" : "rgba(255, 165, 0, 0.5)"}`,
          "& .MuiAlert-icon": {
            color: error ? "#FF6B6B" : "#FFA500",
          },
        }}
      >
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          {isPending
            ? "Switching to Bokuto testnet..."
            : error
              ? "Failed to switch network. Please switch to Bokuto testnet manually in your wallet."
              : "Switching to Bokuto testnet..."}
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
