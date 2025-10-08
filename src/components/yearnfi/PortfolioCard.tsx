"use client";

import React from "react";
import { Box, Typography, Button, CircularProgress } from "@mui/material";
import GlowBox from "@/components/common/ui/GlowBox";
import { useWeb3 } from "@/lib/yearnfi/lib/contexts/useWeb3";
import { useWallet } from "@/lib/yearnfi/lib/contexts/useWallet";
import { formatAmount } from "@/lib/yearnfi/lib/utils";

export function PortfolioCard() {
  const { isActive, address, openLoginModal, onSwitchChain } = useWeb3();
  const { cumulatedValueInV3Vaults, isLoading } = useWallet();

  if (!isActive) {
    return (
      <GlowBox sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
        <Typography
          sx={{
            fontWeight: 900,
            fontSize: { xs: "1.5rem", sm: "1.75rem", md: "2rem" },
            color: "white",
            mb: { xs: 1.5, sm: 2 },
          }}
        >
          Portfolio
        </Typography>

        {/* <Typography
          sx={{
            fontSize: { xs: "0.875rem", sm: "1rem" },
            color: "rgba(255, 255, 255, 0.7)",
            mb: { xs: 3, sm: 4 },
            maxWidth: { xs: "100%", sm: "80%" },
          }}
        >
          Looks like you need to connect your wallet. And call your mum. Always
          important.
        </Typography> */}

        <button
          onClick={() => {
            if (!isActive && address) {
              onSwitchChain(1);
            } else {
              openLoginModal();
            }
          }}
          className="connect-wallet-btn"
        >
          Connect Wallet
        </button>

        <style jsx>{`
          .connect-wallet-btn {
            background: #050512;
            color: white;
            font-weight: 600;
            padding: 8px 24px;
            font-size: 0.875rem;
            border-radius: 8px;
            border: none;
            cursor: pointer;
            width: 100%;
          }

          @media (min-width: 600px) {
            .connect-wallet-btn {
              padding: 12px 40px;
              font-size: 1rem;
              width: auto;
            }
          }
        `}</style>
      </GlowBox>
    );
  }

  return (
    <GlowBox sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
      <Typography
        sx={{
          fontWeight: 900,
          fontSize: { xs: "1.5rem", sm: "1.75rem", md: "2rem" },
          color: "white",
          mb: { xs: 2, sm: 3 },
        }}
      >
        Portfolio
      </Typography>

      <Box
        sx={{
          display: "flex",
          gap: { xs: 2, sm: 4 },
          flexWrap: "wrap",
        }}
      >
        <Box>
          <Typography
            sx={{
              fontSize: { xs: "0.75rem", sm: "0.875rem" },
              color: "rgba(255, 255, 255, 0.6)",
              mb: { xs: 0.5, sm: 1 },
            }}
          >
            Deposited
          </Typography>

          {isLoading ? (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                height: { xs: 32, sm: 40 },
              }}
            >
              <CircularProgress size={24} sx={{ color: "#00F5E0" }} />
            </Box>
          ) : (
            <Typography
              sx={{
                fontWeight: 700,
                fontSize: { xs: "1.5rem", sm: "1.75rem", md: "2rem" },
                color: "white",
                fontFamily: "monospace",
              }}
            >
              ${formatAmount(cumulatedValueInV3Vaults.toFixed(2), 2, 2)}
            </Typography>
          )}
        </Box>
      </Box>
    </GlowBox>
  );
}
