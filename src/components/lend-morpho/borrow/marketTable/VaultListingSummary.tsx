import { Chip } from "@mui/material";

interface supplyingVaults {
  name: string;
  liquidity: {
    usd: number;
  };
}

interface VaultListingSummaryProps {
  supplyingVaults: supplyingVaults[];
}

export const VaultListingSummary = ({
  supplyingVaults,
}: VaultListingSummaryProps) => {
  return (
    <Chip
      label={`${supplyingVaults.length}`}
      size="small"
      sx={{
        backgroundColor: "primary.main",
        color: "primary.dark",
        fontSize: "12px",
        fontWeight: "600",
        height: "24px",
        cursor: "pointer",
        "& .MuiChip-label": {
          padding: "0 8px",
        },
      }}
    />
  );
};
