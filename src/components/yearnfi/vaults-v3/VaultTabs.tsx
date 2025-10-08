"use client";

import {
  Box,
  Tab,
  Tabs as MuiTabs,
  Select,
  MenuItem,
  FormControl,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { TYDaemonVault } from "@/lib/yearnfi/lib/utils/schemas/yDaemonVaultsSchemas";
import { VAULT_TABS, type TabOption } from "@/lib/yearnfi/lib/types/tabs";
import GlowBox from "@/components/common/ui/GlowBox";
import { AboutTab } from "./tabs/AboutTab";
import { StrategiesTab } from "./tabs/StrategiesTab";
import { InfoTab } from "./tabs/InfoTab";
import { RiskTab } from "./tabs/RiskTab";

type VaultTabsProps = {
  vault: TYDaemonVault;
};

export function VaultTabs({ vault }: VaultTabsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [currentTab, setCurrentTab] = useState(0);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  // Read tab from URL on mount and when URL changes
  useEffect(() => {
    const actionParam = searchParams.get("action");
    const tab = VAULT_TABS.find((t) => t.slug === actionParam);
    if (tab) {
      setCurrentTab(tab.value);
    } else {
      setCurrentTab(0);
    }
  }, [searchParams]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    const tab = VAULT_TABS.find((t) => t.value === newValue);
    if (tab) {
      setCurrentTab(newValue);
      const params = new URLSearchParams(searchParams.toString());
      params.set("action", tab.slug);
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    }
  };

  const handleDropdownChange = (event: any) => {
    const newValue = event.target.value as number;
    const tab = VAULT_TABS.find((t) => t.value === newValue);
    if (tab) {
      setCurrentTab(newValue);
      const params = new URLSearchParams(searchParams.toString());
      params.set("action", tab.slug);
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    }
  };

  return (
    <GlowBox sx={{ mt: 4 }}>
      {/* Tab Headers - Desktop */}
      {!isMobile && (
        <Box
          sx={{
            borderBottom: 1,
            borderColor: "divider",
          }}
        >
          <MuiTabs
            value={currentTab}
            onChange={handleTabChange}
            variant="fullWidth"
            sx={{
              "& .MuiTab-root": {
                fontSize: "1rem",
                fontWeight: "bold",
                textTransform: "none",
                minHeight: 64,
              },
            }}
          >
            {VAULT_TABS.map((tab) => (
              <Tab key={tab.value} label={tab.label} />
            ))}
          </MuiTabs>
        </Box>
      )}

      {/* Dropdown - Mobile */}
      {isMobile && (
        <Box
          sx={{
            borderBottom: 1,
            borderColor: "divider",
            p: 2,
          }}
        >
          <FormControl fullWidth>
            <Select
              value={currentTab}
              onChange={handleDropdownChange}
              sx={{
                fontWeight: "bold",
              }}
            >
              {VAULT_TABS.map((tab) => (
                <MenuItem key={tab.value} value={tab.value}>
                  {tab.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      )}

      {/* Tab Content */}
      <Box sx={{ p: { xs: 2, md: 4 } }}>
        {currentTab === 0 && <AboutTab vault={vault} />}
        {currentTab === 1 && <StrategiesTab vault={vault} />}
        {currentTab === 2 && <InfoTab vault={vault} />}
        {currentTab === 3 && <RiskTab vault={vault} />}
      </Box>
    </GlowBox>
  );
}
