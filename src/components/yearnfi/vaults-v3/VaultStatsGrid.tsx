"use client";

import { Box, Typography } from "@mui/material";
import type { TYDaemonVault } from "@/lib/yearnfi/lib/utils/schemas/yDaemonVaultsSchemas";
import { Counter } from "@/components/common/Counter";
import { RenderAmount } from "@/components/common/RenderAmount";
import { formatAmount, toNormalizedBN } from "@/lib/yearnfi/lib/utils";
import GlowBox from "@/components/common/ui/GlowBox";
import { useWeb3 } from "@/lib/yearnfi/lib/contexts/useWeb3";
import { useVaultBalance } from "@/lib/yearnfi/lib/hooks/useVaultBalance";
import { useYearn } from "@/lib/yearnfi/lib/contexts/useYearn";

type VaultStatsGridProps = {
  vault: TYDaemonVault;
};

type StatItemProps = {
  label: string;
  value: React.ReactNode;
  subValue?: string;
};

function StatItem({ label, value, subValue }: StatItemProps) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 1,
        p: 2,
      }}
    >
      <Typography
        variant="caption"
        sx={{
          color: "text.secondary",
          textAlign: "center",
          fontSize: "0.75rem",
        }}
      >
        {label}
      </Typography>
      <Typography
        variant="h4"
        sx={{
          fontWeight: "bold",
          fontSize: { xs: "1.5rem", md: "2rem" },
          fontFamily: "monospace",
        }}
        suppressHydrationWarning
      >
        {value}
      </Typography>
      {subValue && (
        <Typography
          variant="caption"
          sx={{
            color: "text.secondary",
            fontSize: "0.75rem",
            fontFamily: "monospace",
          }}
          suppressHydrationWarning
        >
          {subValue}
        </Typography>
      )}
    </Box>
  );
}

export function VaultStatsGrid({ vault }: VaultStatsGridProps) {
  const { address, isActive } = useWeb3();
  const { getPrice } = useYearn();

  // Get user's vault balance
  const { vaultBalanceInTokens, isLoading: isLoadingBalance } = useVaultBalance(
    {
      vault,
      userAddress: isActive ? address : undefined,
    }
  );

  // Extract data from vault
  const totalAssets = vault.tvl?.totalAssets
    ? Number(vault.tvl.totalAssets) / Math.pow(10, vault.decimals)
    : 0;
  const tvlUSD = vault.tvl?.tvl || 0;
  const tokenSymbol = vault.token.symbol || "tokens";

  // APY data
  const historicalAPY = vault.apy?.net_apy || 0;
  const estimatedAPY = vault.apy?.gross_apr || 0;

  // User balance in tokens
  const userBalanceNormalized = toNormalizedBN(
    vaultBalanceInTokens,
    vault.decimals
  );
  const userBalance = userBalanceNormalized.normalized;

  // Get token price and calculate USD value
  const tokenPrice = getPrice({
    address: vault.token.address,
    chainID: vault.chainID,
  });
  const userBalanceUSD = userBalance * tokenPrice.normalized;

  return (
    <GlowBox>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "repeat(2, 1fr)",
            md: "repeat(4, 1fr)",
          },
          gap: { xs: 2, md: 4 },
          py: { xs: 2, md: 3 },
        }}
      >
        {/* Total Deposited */}
        <StatItem
          label={`Total deposited, ${tokenSymbol}`}
          value={
            <Counter
              value={totalAssets}
              decimals={vault.decimals}
              decimalsToDisplay={[2, 6, 8]}
            />
          }
          subValue={`$${formatAmount(tvlUSD, 2, 2)}`}
        />

        {/* Historical APY */}
        <StatItem
          label="Historical APY"
          value={
            vault.apy?.type === "new" ? (
              "New"
            ) : (
              <RenderAmount
                value={historicalAPY}
                symbol="percent"
                decimals={2}
              />
            )
          }
          subValue={
            estimatedAPY > 0
              ? `Est. APY: ${formatAmount(estimatedAPY * 100, 2, 2)}%`
              : undefined
          }
        />

        {/* User Holdings */}
        <StatItem
          label={`Value in ${tokenSymbol}`}
          value={
            !isActive ? (
              "−"
            ) : isLoadingBalance ? (
              "..."
            ) : (
              <Counter
                value={userBalance}
                decimals={vault.decimals}
                decimalsToDisplay={[2, 6, 8]}
              />
            )
          }
          subValue={
            isActive
              ? `$${formatAmount(userBalanceUSD, 2, 2)}`
              : "Connect wallet"
          }
        />

        {/* Extra Rewards (if staking available) */}
        {vault.staking.available ? (
          <StatItem
            label="Extra earned"
            value={
              !isActive ? (
                "−"
              ) : (
                <Counter
                  value={0}
                  decimals={18}
                  decimalsToDisplay={[2, 8, 12]}
                />
              )
            }
            subValue={isActive ? "$0.00" : "Connect wallet"}
          />
        ) : (
          <StatItem
            label="Available to deposit"
            value="∞"
            subValue="No deposit limit"
          />
        )}
      </Box>
    </GlowBox>
  );
}
