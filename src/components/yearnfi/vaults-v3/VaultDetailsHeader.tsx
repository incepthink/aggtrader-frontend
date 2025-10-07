"use client";

import { Box, Typography, IconButton, Tooltip, Chip } from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import type { TYDaemonVault } from "@/lib/yearnfi/lib/utils/schemas/yDaemonVaultsSchemas";
import { ImageWithFallback } from "@/components/common/ImageWithFallback";
import { NetworkBadge } from "@/components/common/NetworkBadge";
import { getVaultName, copyToClipboard } from "@/lib/yearnfi/lib/utils/helpers";
import GlowBox from "@/components/common/ui/GlowBox";

type VaultDetailsHeaderProps = {
  vault: TYDaemonVault;
};

export function VaultDetailsHeader({ vault }: VaultDetailsHeaderProps) {
  const vaultName = getVaultName(vault);
  const logoUrl = `https://assets.smold.app/api/token/${vault.chainID}/${vault.token.address}/logo-128.png`;

  return (
    <GlowBox
      sx={{
        p: { xs: 3, md: 6 },
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: { xs: 280, md: 320 },
      }}
    >
      {/* Vault Logo */}
      <Box
        sx={{
          position: "absolute",
          top: { xs: -32, md: -40 },
          width: { xs: 64, md: 80 },
          height: { xs: 64, md: 80 },
          borderRadius: 2,
          bgcolor: "rgba(0, 255, 233, 0.2)",
          backdropFilter: "blur(8px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: 2,
        }}
      >
        <ImageWithFallback
          src={logoUrl}
          alt={vault.token.symbol}
          width={48}
          height={48}
        />
      </Box>

      {/* Vault Name */}
      <Typography
        variant="h3"
        sx={{
          mt: { xs: 4, md: 5 },
          mb: 2,
          fontWeight: 900,
          fontSize: { xs: "2rem", md: "4rem" },
          textAlign: "center",
          lineHeight: 1.2,
        }}
      >
        {vaultName}
      </Typography>

      {/* Vault Address */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          mb: 3,
        }}
      >
        <Typography
          variant="body2"
          sx={{
            color: "text.secondary",
            fontSize: { xs: "0.75rem", md: "0.875rem" },
            fontFamily: "monospace",
          }}
        >
          {vault.address}
        </Typography>
        <Tooltip title="Copy address">
          <IconButton
            size="small"
            onClick={() => copyToClipboard(vault.address)}
            sx={{
              color: "text.secondary",
            }}
          >
            <ContentCopyIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Badges */}
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 2,
          justifyContent: "center",
        }}
      >
        <Chip
          label={vault.token.name}
          sx={{
            fontWeight: "bold",
          }}
        />
        <NetworkBadge chainID={vault.chainID} />
        {vault.kind === "Multi Strategy" && (
          <Chip
            label="⚡ Multi Strategy"
            sx={{
              fontWeight: "bold",
            }}
          />
        )}
      </Box>
    </GlowBox>
  );
}
