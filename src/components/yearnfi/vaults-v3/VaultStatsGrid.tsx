"use client";

import { Box, Typography, Tooltip } from "@mui/material";
import InfoIcon from "@mui/icons-material/Info";
import type { TYDaemonVault } from "@/lib/yearnfi/lib/utils/schemas/yDaemonVaultsSchemas";
import { Counter } from "@/components/common/Counter";
import { RenderAmount } from "@/components/common/RenderAmount";
import { formatAmount, toNormalizedBN } from "@/lib/yearnfi/lib/utils";
import GlowBox from "@/components/common/ui/GlowBox";
import { useWeb3 } from "@/lib/yearnfi/lib/contexts/useWeb3";
import { useVaultBalance } from "@/lib/yearnfi/lib/hooks/useVaultBalance";
import { useStakingRewards } from "@/lib/yearnfi/lib/hooks/useStakingRewards";
import { useYearn } from "@/lib/yearnfi/lib/contexts/useYearn";

type VaultStatsGridProps = {
  vault: TYDaemonVault;
};

type StatItemProps = {
  label: string;
  value: React.ReactNode;
  subValue?: string;
  tooltip?: string;
};

function StatItem({ label, value, subValue, tooltip }: StatItemProps) {
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
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
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
        {tooltip && (
          <Tooltip title={tooltip}>
            <InfoIcon sx={{ fontSize: "0.875rem", color: "text.secondary" }} />
          </Tooltip>
        )}
      </Box>
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

  // Get staking rewards data
  const {
    earnedRewards,
    rewardTokenSymbol,
    rewardTokenDecimals,
    hasActiveRewards,
  } = useStakingRewards({
    vault,
    userAddress: isActive ? address : undefined,
  });

  // Extract data from vault
  const totalAssets = vault.tvl?.totalAssets
    ? Number(vault.tvl.totalAssets) / Math.pow(10, vault.decimals)
    : 0;
  const tvlUSD = vault.tvl?.tvl || 0;
  const tokenSymbol = vault.token.symbol || "tokens";

  // APY data with staking boost
  const baseAPY = vault.apy?.net_apy || 0;
  const stakingAPR = vault.apr?.extra?.stakingRewardsAPR || 0;
  const gammaAPR = vault.apr?.extra?.gammaRewardAPR || 0;
  const totalAPY = baseAPY + stakingAPR + gammaAPR;

  // User balance in tokens
  const userBalanceNormalized = toNormalizedBN(
    vaultBalanceInTokens,
    vault.decimals
  );
  const userBalance = userBalanceNormalized.normalized;

  // Get token price and calculate USD value
  const tokenPrice = getPrice({
    address: vault.token.address as any,
    chainID: vault.chainID,
  });
  const userBalanceUSD = userBalance * tokenPrice.normalized;

  // Calculate earned rewards value
  const earnedRewardsNormalized = toNormalizedBN(
    earnedRewards,
    rewardTokenDecimals
  );
  const earnedRewardsValue = earnedRewardsNormalized.normalized;

  // Get reward token price (for now, approximate as 0 if not available)
  // In production, you'd fetch the actual price for the reward token
  const earnedRewardsUSD = 0; // TODO: Implement reward token price lookup

  // APY tooltip content
  const apyTooltip =
    stakingAPR > 0 || gammaAPR > 0
      ? `Base APY: ${formatAmount(
          baseAPY * 100,
          2,
          2
        )}%\nStaking Rewards: ${formatAmount(stakingAPR * 100, 2, 2)}%${
          gammaAPR > 0
            ? `\nGamma Rewards: ${formatAmount(gammaAPR * 100, 2, 2)}%`
            : ""
        }`
      : undefined;

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

        {/* Historical APY with boost */}
        <StatItem
          label="Historical APY"
          value={
            vault.apy?.type === "new" ? (
              "New"
            ) : (
              <RenderAmount value={totalAPY} symbol="percent" decimals={2} />
            )
          }
          subValue={
            stakingAPR > 0 || gammaAPR > 0
              ? `Base: ${formatAmount(baseAPY * 100, 2, 2)}% + Boost`
              : undefined
          }
          tooltip={apyTooltip}
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
          tooltip={isActive ? "Your yield accrues every block" : undefined}
        />

        {/* Extra Rewards (if staking available) */}
        {vault.staking.available && hasActiveRewards ? (
          <StatItem
            label={`Extra earned, ${rewardTokenSymbol || "rewards"}`}
            value={
              !isActive ? (
                "−"
              ) : (
                <Counter
                  value={earnedRewardsValue}
                  decimals={rewardTokenDecimals}
                  decimalsToDisplay={[2, 8, 12]}
                />
              )
            }
            subValue={
              isActive
                ? `$${formatAmount(earnedRewardsUSD, 2, 2)}`
                : "Connect wallet"
            }
            tooltip="Rewards from staking your vault tokens"
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
