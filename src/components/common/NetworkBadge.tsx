import { Chip } from "@mui/material";

type NetworkBadgeProps = {
  chainID: number;
};

const NETWORK_NAMES: Record<number, string> = {
  1: "Ethereum",
  747474: "Katana",
};

export function NetworkBadge({ chainID }: NetworkBadgeProps) {
  const name = NETWORK_NAMES[chainID] || `Chain ${chainID}`;

  return (
    <Chip
      label={name}
      sx={{
        bgcolor: "rgba(255, 255, 255, 0.2)",
        color: "white",
        fontWeight: "bold",
        fontSize: { xs: "0.875rem", md: "1rem" },
        height: { xs: 32, md: 40 },
        backdropFilter: "blur(10px)",
      }}
    />
  );
}
