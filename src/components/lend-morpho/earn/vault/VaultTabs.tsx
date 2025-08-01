"use client";

import React, { useState } from "react";
import {
  Box,
  Tabs,
  Tab,
  Paper,
  Typography,
  Button,
  Select,
  MenuItem,
  FormControl,
} from "@mui/material";
import {
  VaultDetail,
  useVaultHistorical,
} from "@/hooks/lend-morpho/ValutDescriptionHooks";
import OverviewTab from "./OverviewTab";
import PerformanceTab from "./PerformanceTab";
import RiskTab from "./RiskTab";
import ActivityTab from "./ActivityTab";
import YourPositionTab from "./YourPositionTab";
import GlowBox from "@/components/common/ui/GlowBox";

interface VaultTabsProps {
  vault: VaultDetail;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`vault-tabpanel-${index}`}
      aria-labelledby={`vault-tab-${index}`}
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

const VaultTabs: React.FC<VaultTabsProps> = ({ vault }) => {
  const [tabValue, setTabValue] = useState(1); // Start with Overview tab
  const [timeRange, setTimeRange] = useState("3 months");
  const [chartType, setChartType] = useState("USDC");

  // Calculate time range for historical data
  const getTimeRangeOptions = () => {
    const now = Date.now();
    const ranges = {
      "3 months": {
        startTimestamp: Math.floor((now - 90 * 24 * 60 * 60 * 1000) / 1000),
        endTimestamp: Math.floor(now / 1000),
        interval: "DAY" as const,
      },
      "6 months": {
        startTimestamp: Math.floor((now - 180 * 24 * 60 * 60 * 1000) / 1000),
        endTimestamp: Math.floor(now / 1000),
        interval: "DAY" as const,
      },
      "1 year": {
        startTimestamp: Math.floor((now - 365 * 24 * 60 * 60 * 1000) / 1000),
        endTimestamp: Math.floor(now / 1000),
        interval: "WEEK" as const,
      },
    };
    return ranges[timeRange as keyof typeof ranges];
  };

  const { data: historicalData, isLoading: isHistoricalLoading } =
    useVaultHistorical(vault.address, getTimeRangeOptions());

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <GlowBox>
      <Paper
        sx={{
          backgroundColor: "transparent",
          borderRadius: 2,
          overflow: "hidden",
        }}
      >
        {/* Tab Header */}
        <Box sx={{ borderBottom: 1, borderColor: "#2d3748" }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            sx={{
              "& .MuiTab-root": {
                color: "#8b949e",
                textTransform: "none",
                fontSize: "16px",
                fontWeight: 500,
              },
              "& .Mui-selected": {
                color: "white",
              },
              "& .MuiTabs-indicator": {
                backgroundColor: "#00F5E0",
              },
            }}
          >
            <Tab label="Your Position" />
            <Tab label="Overview" />
            <Tab label="Performance" />
            <Tab label="Activity" />
          </Tabs>
        </Box>

        {/* Tab Content */}
        <Box sx={{ p: 3 }}>
          <TabPanel value={tabValue} index={0}>
            <YourPositionTab vault={vault} />
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <OverviewTab
              vault={vault}
              historicalData={historicalData}
              isHistoricalLoading={isHistoricalLoading}
              timeRange={timeRange}
              setTimeRange={setTimeRange}
              chartType={chartType}
              setChartType={setChartType}
            />
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <PerformanceTab
              vault={vault}
              historicalData={historicalData}
              isHistoricalLoading={isHistoricalLoading}
            />
          </TabPanel>

          <TabPanel value={tabValue} index={3}>
            <ActivityTab vault={vault} />
          </TabPanel>
        </Box>
      </Paper>
    </GlowBox>
  );
};

export default VaultTabs;
