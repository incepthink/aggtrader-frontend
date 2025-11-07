"use client";

import { useParams } from "next/navigation";
import { Box, CircularProgress, Typography, Button } from "@mui/material";
import { useSingleVault } from "@/lib/yearnfi/lib/hooks/useSingleVault";
import { VaultDetailsHeader } from "@/components/yearnfi/vaults-v3/VaultDetailsHeader";
import { VaultStatsGrid } from "@/components/yearnfi/vaults-v3/VaultStatsGrid";
import { VaultTabs } from "@/components/yearnfi/vaults-v3/VaultTabs";
import { VaultActionsProvider } from "@/lib/yearnfi/lib/contexts/useVaultActions";
import { VaultActionPanel } from "@/components/yearnfi/vaults-v3/actions/VaultActionPanel";
import Link from "next/link";

export default function VaultDetailPage() {
  const params = useParams();
  const chainID = Number(params.chainID);
  const address = params.address as string;
  const { vault, isLoading, error } = useSingleVault({ chainID, address });

  if (isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "60vh",
          gap: 2,
        }}
      >
        <CircularProgress size={48} />
        <Typography variant="body2" color="text.secondary">
          Loading vault details...
        </Typography>
      </Box>
    );
  }

  if (error || !vault) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "60vh",
          gap: 3,
          px: 2,
        }}
      >
        <Typography variant="h5" color="error.main">
          Vault Not Found
        </Typography>
        <Typography variant="body1" color="text.secondary" textAlign="center">
          We couldn't find this vault on the connected network.
        </Typography>
        <Button component={Link} href="/vault" variant="contained" size="large">
          ← Back to Vaults
        </Button>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        maxWidth: "1400px",
        mx: "auto",
        px: { xs: 2, sm: 3, md: 4 },
        py: { xs: 3, sm: 4 },
      }}
    >
      <Button
        component={Link}
        href="/earn/vault"
        sx={{ mb: 4 }}
        startIcon={<span>←</span>}
      >
        Back to Vaults
      </Button>
      <VaultDetailsHeader vault={vault} />
      <Box sx={{ mt: 4 }}>
        <VaultStatsGrid vault={vault} />
      </Box>
      <VaultActionsProvider vault={vault}>
        <VaultActionPanel vault={vault} />
      </VaultActionsProvider>
      <VaultTabs vault={vault} />
    </Box>
  );
}
