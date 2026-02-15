"use client";

import { Container, Box } from "@mui/material";
import { useMemo, Fragment } from "react";
import { ChainSync } from "@/components/common/ChainSync";
import { PortfolioCard } from "@/components/yearnfi/PortfolioCard";
import { Filters } from "@/components/yearnfi/vaults-v3/Filters";
import { VaultsV3ListHead } from "@/components/yearnfi/vaults-v3/list/VaultsV3ListHead";
import { VaultsV3ListRow } from "@/components/yearnfi/vaults-v3/list/VaultsV3ListRow";
import { VaultsListEmpty } from "@/components/yearnfi/vaults-v2/list/VaultsListEmpty";
import { useQueryArguments } from "@/hooks/vaults-v2/useVaultsQueryArgs";
import { useVaultFilter } from "@/lib/yearnfi/lib/hooks/useFilteredVaults";
import { useSortVaults } from "@/hooks/vaults-v2/useSortVaults";
import { useYearn } from "@/lib/yearnfi/lib/contexts/useYearn";
import { useWallet } from "@/lib/yearnfi/lib/contexts/useWallet";
import { useWeb3 } from "@/lib/yearnfi/lib/contexts/useWeb3";
import type { TSortDirection } from "@/lib/yearnfi/lib/types";
import type { TPossibleSortBy } from "@/hooks/vaults-v2/useVaultsQueryArgs";
import type { TYDaemonVault } from "@/lib/yearnfi/lib/utils/schemas/yDaemonVaultsSchemas";
import { isZero } from "@/lib/yearnfi/lib/utils";
import GlowBox from "@/components/common/ui/GlowBox";
import {
  ALL_VAULTSV3_KINDS_KEYS,
  ALL_VAULTSV3_CATEGORIES_KEYS,
} from "@/lib/yearnfi/vaults-v3/constants";
import { VaultsV3AssetRow } from "@/components/yearnfi/vaults-v3/list/VaultsV3AssetRow";

export default function VaultPage() {
  const {
    search,
    types,
    chains,
    categories,
    sortDirection,
    sortBy,
    onSearch,
    onChangeTypes,
    onChangeCategories,
    onChangeChains,
    onChangeSortDirection,
    onChangeSortBy,
    onReset,
  } = useQueryArguments({
    defaultTypes: ["all"],
    defaultCategories: ["stablecoin", "volatile"],
  });

  const { vaults, isLoadingVaultList, getPrice } = useYearn();
  const { getBalance } = useWallet();
  const { isActive } = useWeb3();
  console.log("All vaults from context:", vaults);

  const fiveAssets = useMemo(() => {
    const allowed = new Set(["vbUSDC", "vbETH", "vbUSDT", "vbWBTC", "AUSD"]);
    return (vaults || [])
      .filter((v) => v.chainID === 747474)
      .filter((v) => v.version?.startsWith("3"))
      .filter((v) => allowed.has(v.token?.symbol || "")) // ✅ asset key
      .filter((v) => v.kind === "Multi Strategy"); // ✅ single asset vaults
  }, [vaults]);

  // Apply search filter
  const searchedVaults = useMemo(() => {
    if (!search) return fiveAssets;

    const s = search.toLowerCase();
    return fiveAssets.filter((v) => {
      const asset = (v.token?.symbol || "").toLowerCase();
      const name = (v.name || "").toLowerCase();
      const symbol = (v.symbol || "").toLowerCase();
      return asset.includes(s) || name.includes(s) || symbol.includes(s);
    });
  }, [fiveAssets, search]);
  console.log("Searched vaults:", searchedVaults);
  // Apply sorting
  const sortedVaults = useSortVaults(searchedVaults, sortBy, sortDirection);

  // Prioritize vaults with user deposits
  const finalSortedVaults = useMemo(() => {
    if (!isActive) return sortedVaults;

    // Calculate user balance for each vault
    const vaultsWithBalance = sortedVaults.map((vault) => {
      const balance = getBalance({
        address: vault.address,
        chainID: vault.chainID,
      });
      const price = getPrice({
        address: vault.address as any,
        chainID: vault.chainID,
      });
      const userBalanceUSD = balance.normalized * price.normalized;

      return { vault, userBalanceUSD };
    });

    // Separate vaults with and without user balance
    const withBalance = vaultsWithBalance.filter((v) => v.userBalanceUSD > 0);
    const withoutBalance = vaultsWithBalance.filter((v) => v.userBalanceUSD === 0);

    // Sort vaults with balance by TVL (descending)
    withBalance.sort((a, b) => {
      const tvlA = a.vault.tvl?.tvl || 0;
      const tvlB = b.vault.tvl?.tvl || 0;
      return tvlB - tvlA;
    });

    // Sort vaults without balance by TVL (descending)
    withoutBalance.sort((a, b) => {
      const tvlA = a.vault.tvl?.tvl || 0;
      const tvlB = b.vault.tvl?.tvl || 0;
      return tvlB - tvlA;
    });

    // Combine: user vaults first, then others
    return [...withBalance.map((v) => v.vault), ...withoutBalance.map((v) => v.vault)];
  }, [sortedVaults, isActive, getBalance, getPrice]);

  console.log("Final sorted vaults:", finalSortedVaults);
  // Filter by categories and chains
  const filteredVaults = useMemo(() => {
    let filtered = finalSortedVaults;

    if (chains && chains.length > 0) {
      filtered = filtered.filter((v) => chains.includes(v.chainID));
    }

    if (categories && categories.length > 0) {
      filtered = filtered.filter((v) => categories.includes(v.category || ""));
    }

    return filtered;
  }, [finalSortedVaults, chains, categories]);

  const shouldShowEmptyState =
    isLoadingVaultList || isZero(finalSortedVaults.length);

  return (
    <Container
      maxWidth="xl"
      sx={{
        px: { xs: 2, sm: 3, md: "12px" },
        py: { xs: 1, sm: 2 },
        maxWidth: { xs: "100%", lg: "1400px", xl: "1600px" },
      }}
    >
      <ChainSync />

      <Box
        sx={{
          mt: { xs: 2, sm: 3, md: 4 },
          display: "flex",
          flexDirection: "column",
          gap: 3,
        }}
      >
        <PortfolioCard />

        <Filters
          types={types}
          categories={categories}
          searchValue={search || ""}
          chains={chains}
          onChangeChains={onChangeChains}
          onChangeTypes={onChangeTypes}
          onChangeCategories={onChangeCategories}
          onSearch={onSearch}
          shouldDebounce={true}
        />

        <GlowBox>
          <VaultsV3ListHead
            sortBy={sortBy}
            sortDirection={sortDirection}
            onSort={(
              newSortBy: string,
              newSortDirection: TSortDirection,
            ): void => {
              if (newSortDirection === "") {
                onChangeSortBy("featuringScore");
                onChangeSortDirection("");
                return;
              }
              onChangeSortBy(newSortBy as TPossibleSortBy);
              onChangeSortDirection(newSortDirection as TSortDirection);
            }}
            items={[
              {
                label: "",
                value: "dropdown",
                sortable: false,
                className: "col-span-1",
              },
              {
                label: "Vault",
                value: "name",
                sortable: false,
                className: "col-span-4",
              },
              {
                label: "Est. APY",
                value: "estAPY",
                sortable: false,
                className: "col-span-3",
              },
              {
                label: "Risk Level",
                value: "score",
                sortable: false,
                className: "col-span-2",
              },
              {
                label: "Holdings",
                value: "deposited",
                sortable: false,
                className: "col-span-3",
              },
              {
                label: "Deposits",
                value: "tvl",
                sortable: true,
                className: "col-span-3",
              },
            ]}
          />

          {shouldShowEmptyState ? (
            <VaultsListEmpty
              isLoading={isLoadingVaultList}
              sortedVaultsToDisplay={searchedVaults}
              currentSearch={search || ""}
              currentCategories={types}
              currentChains={chains}
              onReset={onReset}
              defaultCategories={ALL_VAULTSV3_KINDS_KEYS}
            />
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {finalSortedVaults.map((v) => (
                <VaultsV3AssetRow key={`${v.chainID}_${v.address}`} vault={v} />
              ))}
            </Box>
          )}
        </GlowBox>
      </Box>
    </Container>
  );
}
