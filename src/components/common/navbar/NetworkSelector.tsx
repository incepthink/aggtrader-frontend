// components/NetworkSelector.tsx
"use client";

import React, { useState } from "react";
import {
  Select,
  MenuItem,
  FormControl,
  Box,
  Typography,
  SelectChangeEvent,
} from "@mui/material";
import { useSwitchChain, useChainId, useAccount } from "wagmi";
import { useSpotStore } from "@/store/spotStore";

// Define supported networks
const NETWORKS = [
  {
    id: 1,
    name: "Ethereum",
    icon: "🔷", // You can replace with actual icons
    color: "#627EEA",
  },
  {
    id: 747474,
    name: "Katana",
    icon: "⚔️", // You can replace with actual icons
    color: "#FF6B6B",
  },
];

interface NetworkSelectorProps {
  variant?: "navbar" | "standalone";
  size?: "small" | "medium";
}

export const NetworkSelector: React.FC<NetworkSelectorProps> = ({
  variant = "navbar",
  size = "small",
}) => {
  const { isConnected } = useAccount();
  const currentChainId = useChainId();
  const { switchChain, isPending } = useSwitchChain();
  const { chainId: storeChainId, setChainId } = useSpotStore();

  // Use store chainId as fallback if not connected
  const activeChainId = isConnected ? currentChainId : storeChainId;

  const handleNetworkChange = async (event: SelectChangeEvent<number>) => {
    const newChainId = event.target.value as number;

    // Update store immediately
    setChainId(newChainId as 1 | 747474);

    // Switch chain if connected
    if (isConnected && switchChain) {
      try {
        await switchChain({ chainId: newChainId });
      } catch (error) {
        console.error("Failed to switch chain:", error);
        // Revert store if chain switch fails
        setChainId(activeChainId as 1 | 747474);
      }
    }
  };

  const currentNetwork =
    NETWORKS.find((network) => network.id === activeChainId) || NETWORKS[0];

  const selectStyles = {
    minWidth: variant === "navbar" ? 120 : 150,
    height: size === "small" ? 36 : 40,
    "& .MuiSelect-select": {
      padding: size === "small" ? "6px 12px" : "8px 14px",
      paddingRight: "32px !important",
      display: "flex",
      alignItems: "center",
      gap: 1,
      fontSize: size === "small" ? "0.875rem" : "1rem",
      fontWeight: 500,
      color: "white",
      backgroundColor: "rgba(55, 65, 81, 0.8)",
      border: "1px solid rgba(255, 255, 255, 0.2)",
      borderRadius: "8px",
      backdropFilter: "blur(8px)",
      transition: "all 0.2s ease-in-out",
      "&:hover": {
        backgroundColor: "rgba(75, 85, 99, 0.8)",
        borderColor: "#00F5E0",
      },
    },
    "& .MuiSelect-icon": {
      color: "#00F5E0",
      right: "8px",
    },
    "& .MuiOutlinedInput-notchedOutline": {
      border: "none",
    },
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
      border: "none",
    },
    "&:hover .MuiOutlinedInput-notchedOutline": {
      border: "none",
    },
  };

  return (
    <FormControl size={size}>
      <Select
        value={activeChainId}
        onChange={handleNetworkChange}
        disabled={isPending}
        displayEmpty
        sx={selectStyles}
        MenuProps={{
          PaperProps: {
            sx: {
              backgroundColor: "rgba(17, 24, 39, 0.95)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "12px",
              mt: 1,
              "& .MuiMenuItem-root": {
                color: "white",
                padding: "12px 16px",
                "&:hover": {
                  backgroundColor: "rgba(0, 245, 224, 0.1)",
                },
                "&.Mui-selected": {
                  backgroundColor: "rgba(0, 245, 224, 0.2)",
                  "&:hover": {
                    backgroundColor: "rgba(0, 245, 224, 0.3)",
                  },
                },
              },
            },
          },
        }}
      >
        {NETWORKS.map((network) => (
          <MenuItem key={network.id} value={network.id}>
            <Box display="flex" alignItems="center" gap={1.5}>
              {/* <span style={{ fontSize: "1.2em" }}>{network.icon}</span> */}
              <Typography variant="body2" fontWeight={500}>
                {network.name}
              </Typography>
              {isPending && activeChainId === network.id && (
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    border: "2px solid transparent",
                    borderTop: "2px solid #00F5E0",
                    animation: "spin 1s linear infinite",
                    ml: 1,
                  }}
                />
              )}
            </Box>
          </MenuItem>
        ))}
      </Select>

      <style jsx global>{`
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </FormControl>
  );
};
