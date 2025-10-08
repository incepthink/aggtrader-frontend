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
import type { TSortDirection } from "@/lib/yearnfi/lib/types";
import type { TPossibleSortBy } from "@/hooks/vaults-v2/useVaultsQueryArgs";
import type { TYDaemonVault } from "@/lib/yearnfi/lib/utils/schemas/yDaemonVaultsSchemas";
import { isZero } from "@/lib/yearnfi/lib/utils";
import GlowBox from "@/components/common/ui/GlowBox";
import {
  ALL_VAULTSV3_KINDS_KEYS,
  ALL_VAULTSV3_CATEGORIES_KEYS,
} from "@/lib/yearnfi/vaults-v3/constants";

export default function VaultPage() {
  const { isLoadingVaultList } = useYearn();

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
    defaultTypes: ALL_VAULTSV3_KINDS_KEYS,
    defaultCategories: ALL_VAULTSV3_CATEGORIES_KEYS,
  });

  const { activeVaults } = useVaultFilter(types, chains, true);

  // Apply search filter
  const searchedVaults = useMemo((): TYDaemonVault[] => {
    if (!search) {
      return activeVaults;
    }

    let searchRegex: RegExp;
    try {
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      searchRegex = new RegExp(escapedSearch, "i");
    } catch {
      const lowercaseSearch = search.toLowerCase();
      return activeVaults.filter((vault: TYDaemonVault): boolean => {
        const searchableText =
          `${vault.name} ${vault.symbol} ${vault.token.name} ${vault.token.symbol} ${vault.address} ${vault.token.address}`.toLowerCase();
        return searchableText.includes(lowercaseSearch);
      });
    }

    return activeVaults.filter((vault: TYDaemonVault): boolean => {
      const searchableText = `${vault.name} ${vault.symbol} ${vault.token.name} ${vault.token.symbol} ${vault.address} ${vault.token.address}`;
      return searchRegex.test(searchableText);
    });
  }, [activeVaults, search]);

  // Apply sorting
  const sortedVaults = useSortVaults(searchedVaults, sortBy, sortDirection);

  // Filter by categories and chains
  const filteredVaults = useMemo(() => {
    let filtered = sortedVaults;

    if (chains && chains.length > 0) {
      filtered = filtered.filter((v) => chains.includes(v.chainID));
    }

    if (categories && categories.length > 0) {
      filtered = filtered.filter((v) => categories.includes(v.category || ""));
    }

    return filtered;
  }, [sortedVaults, chains, categories]);

  const shouldShowEmptyState =
    isLoadingVaultList || isZero(filteredVaults.length);

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
              newSortDirection: TSortDirection
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
                label: "Vault",
                value: "name",
                sortable: true,
                className: "col-span-4",
              },
              {
                label: "Est. APY",
                value: "estAPY",
                sortable: true,
                className: "col-span-2",
              },
              {
                label: "Hist. APY",
                value: "APY",
                sortable: true,
                className: "col-span-2",
              },
              {
                label: "Risk Level",
                value: "score",
                sortable: false,
                className: "col-span-2",
              },
              {
                label: "Available",
                value: "available",
                sortable: false,
                className: "col-span-2",
              },
              {
                label: "Holdings",
                value: "deposited",
                sortable: false,
                className: "col-span-2",
              },
              {
                label: "Deposits",
                value: "tvl",
                sortable: true,
                className: "col-span-2",
              },
            ]}
          />

          {shouldShowEmptyState ? (
            <VaultsListEmpty
              isLoading={isLoadingVaultList}
              sortedVaultsToDisplay={filteredVaults}
              currentSearch={search || ""}
              currentCategories={types}
              currentChains={chains}
              onReset={onReset}
              defaultCategories={ALL_VAULTSV3_KINDS_KEYS}
            />
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {filteredVaults.map((vault) => (
                <VaultsV3ListRow
                  key={`${vault.chainID}_${vault.address}`}
                  currentVault={vault}
                />
              ))}
            </Box>
          )}
        </GlowBox>
      </Box>
    </Container>
  );
}
