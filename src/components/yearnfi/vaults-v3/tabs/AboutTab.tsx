"use client";

import {
  Box,
  Typography,
  IconButton,
  Tooltip,
  Chip,
  Link as MuiLink,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import type { TYDaemonVault } from "@/lib/yearnfi/lib/utils/schemas/yDaemonVaultsSchemas";
import { copyToClipboard } from "@/lib/yearnfi/lib/utils/helpers";

type AboutTabProps = {
  vault: TYDaemonVault;
};

const EXPLORER_URLS: Record<number, string> = {
  1: "https://etherscan.io",
  747474: "https://katanascan.io",
};

function getExplorerUrl(
  chainID: number,
  address: string,
  type: "address" | "token" = "address"
): string {
  const baseUrl = EXPLORER_URLS[chainID] || "https://etherscan.io";
  return `${baseUrl}/${type}/${address}`;
}

function AddressRow({
  label,
  address,
  chainID,
  type = "address",
}: {
  label: string;
  address: string;
  chainID: number;
  type?: "address" | "token";
}) {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        py: 1.5,
        borderBottom: "1px solid",
        borderColor: "divider",
        flexWrap: "wrap",
        gap: 1,
      }}
    >
      <Typography variant="body2" sx={{ fontWeight: 600 }}>
        {label}
      </Typography>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Typography
          variant="body2"
          sx={{
            fontFamily: "monospace",
            fontSize: "0.875rem",
            color: "text.secondary",
          }}
        >
          {address.slice(0, 6)}...{address.slice(-4)}
        </Typography>
        <Tooltip title="Copy address">
          <IconButton size="small" onClick={() => copyToClipboard(address)}>
            <ContentCopyIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="View on explorer">
          <IconButton
            size="small"
            component="a"
            href={getExplorerUrl(chainID, address, type)}
            target="_blank"
            rel="noopener noreferrer"
          >
            <OpenInNewIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
}

export function AboutTab({ vault }: AboutTabProps) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {/* Vault Description */}
      <Box>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
          About this Vault
        </Typography>
        <Typography
          variant="body1"
          sx={{ color: "text.secondary", lineHeight: 1.7 }}
        >
          This is a {vault.kind || "Yearn"} vault that accepts{" "}
          {vault.token.name} ({vault.token.symbol}) deposits. The vault
          automatically compounds your yield by reinvesting earned rewards back
          into the strategy.
        </Typography>
      </Box>

      {/* Vault Details */}
      <Box>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
          Vault Details
        </Typography>
        <Box
          sx={{
            bgcolor: "rgba(0, 255, 233, 0.05)",
            borderRadius: 2,
            p: 2,
            border: "1px solid",
            borderColor: "rgba(0, 255, 233, 0.2)",
          }}
        >
          <AddressRow
            label="Vault Contract"
            address={vault.address}
            chainID={vault.chainID}
          />
          <AddressRow
            label="Deposit Token"
            address={vault.token.address}
            chainID={vault.chainID}
            type="token"
          />

          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              py: 1.5,
              borderBottom: "1px solid",
              borderColor: "divider",
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              Token Decimals
            </Typography>
            <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
              {vault.decimals}
            </Typography>
          </Box>

          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              py: 1.5,
              borderBottom: "1px solid",
              borderColor: "divider",
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              Vault Version
            </Typography>
            <Chip
              label={vault.version || "3.0.0"}
              size="small"
              sx={{ fontFamily: "monospace" }}
            />
          </Box>

          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              py: 1.5,
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              Category
            </Typography>
            <Chip label={vault.category || "Uncategorized"} size="small" />
          </Box>
        </Box>
      </Box>

      {/* Resources */}
      <Box>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
          Resources
        </Typography>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <MuiLink
            href="https://docs.yearn.fi"
            target="_blank"
            rel="noopener noreferrer"
            sx={{ display: "flex", alignItems: "center", gap: 1 }}
          >
            Documentation
            <OpenInNewIcon fontSize="small" />
          </MuiLink>
          <MuiLink
            href={`https://yearn.watch/vault/${vault.address}`}
            target="_blank"
            rel="noopener noreferrer"
            sx={{ display: "flex", alignItems: "center", gap: 1 }}
          >
            Yearn Watch (Analytics)
            <OpenInNewIcon fontSize="small" />
          </MuiLink>
          <MuiLink
            href={getExplorerUrl(vault.chainID, vault.address)}
            target="_blank"
            rel="noopener noreferrer"
            sx={{ display: "flex", alignItems: "center", gap: 1 }}
          >
            View on Block Explorer
            <OpenInNewIcon fontSize="small" />
          </MuiLink>
        </Box>
      </Box>
    </Box>
  );
}
