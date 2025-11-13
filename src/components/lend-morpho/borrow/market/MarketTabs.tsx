// /components/lend-morpho/borrow/market/MarketTabs.tsx
"use client";

import React, { useState } from "react";
import {
  Box,
  Tabs,
  Tab,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Link,
} from "@mui/material";
import { OpenInNew } from "@mui/icons-material";
import { MarketData } from "@/hooks/lend-morpho/MarketDetailHooks";
import PositionTab from "./PositionTab";
import GlowBox from "@/components/common/ui/GlowBox";

interface MarketTabsProps {
  market: MarketData;
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
      id={`market-tabpanel-${index}`}
      aria-labelledby={`market-tab-${index}`}
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

export default function MarketTabs({ market }: MarketTabsProps) {
  const [value, setValue] = useState(1); // Start with Overview tab like VaultTabs

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(2)}%`;
  };

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(2)}M`;
    }
    return `$${value.toLocaleString()}`;
  };

  // Helper function to format token amounts from wei
  const formatTokenAmount = (
    value: string | number,
    decimals: number = 18
  ): number => {
    try {
      if (!value) return 0;
      const numValue = typeof value === "string" ? parseFloat(value) : value;
      if (isNaN(numValue)) return 0;
      return numValue / Math.pow(10, decimals);
    } catch (error) {
      return 0;
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
    return num.toFixed(2);
  };

  // Mock activity data - replace with real data
  const mockActivity = [
    {
      id: 1,
      type: "Borrow",
      amount: `1.5 ${market.loanAsset.symbol}`,
      usdValue: "$142,500",
      user: "0x1234...5678",
      timestamp: "2024-07-24 10:30:00",
      txHash: "0xabcd...efgh",
    },
    {
      id: 2,
      type: "Repay",
      amount: `0.8 ${market.loanAsset.symbol}`,
      usdValue: "$76,000",
      user: "0x9876...5432",
      timestamp: "2024-07-24 09:45:00",
      txHash: "0x1234...abcd",
    },
    {
      id: 3,
      type: "Liquidation",
      amount: `2.1 ${market.collateralAsset.symbol}`,
      usdValue: "$199,500",
      user: "0x5555...7777",
      timestamp: "2024-07-24 08:15:00",
      txHash: "0x9999...1111",
    },
  ];

  return (
    <GlowBox>
      <Paper
        sx={{
          backgroundColor: "transparent",
          borderRadius: 2,
          overflow: "hidden",
        }}
      >
        {/* Tab Header - Matching VaultTabs styling */}
        <Box sx={{ borderBottom: 1, borderColor: "#2d3748" }}>
          <Tabs
            value={value}
            onChange={handleChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              "& .MuiTab-root": {
                color: "#8b949e",
                textTransform: "none",
                fontSize: { xs: "14px", sm: "16px" },
                fontWeight: 500,
                minWidth: { xs: "auto", sm: 120 },
                px: { xs: 2, sm: 3 },
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
            {/* <Tab label="Overview" />
            <Tab label="Advanced" /> */}
            <Tab label="Activity" />
          </Tabs>
        </Box>

        {/* Tab Content */}
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
          {/* Your Position Tab */}
          <TabPanel value={value} index={0}>
            <PositionTab market={market} />
          </TabPanel>

          {/* Overview Tab */}
          {/* <TabPanel value={value} index={1}>
            <Typography
              variant="h6"
              gutterBottom
              sx={{ color: "white", mb: 3, fontWeight: "600" }}
            >
              Market Overview
            </Typography>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, 1fr)",
                  lg: "repeat(3, 1fr)",
                },
                gap: 3,
                mt: 2,
              }}
            >
              <Box
                sx={{
                  p: 3,
                  backgroundColor: "rgba(0, 245, 224, 0.1)",
                  borderRadius: 2,
                  border: "1px solid rgba(75, 85, 99, 0.3)",
                }}
              >
                <Typography variant="body2" sx={{ color: "#8b949e", mb: 1 }}>
                  Supply APY
                </Typography>
                <Typography
                  variant="h5"
                  sx={{ color: "#4caf50", fontWeight: "600" }}
                >
                  {formatPercentage(market.supplyApy)}
                </Typography>
              </Box>

              <Box
                sx={{
                  p: 3,
                  backgroundColor: "rgba(0, 245, 224, 0.1)",
                  borderRadius: 2,
                  border: "1px solid rgba(75, 85, 99, 0.3)",
                }}
              >
                <Typography variant="body2" sx={{ color: "#8b949e", mb: 1 }}>
                  Borrow APY
                </Typography>
                <Typography
                  variant="h5"
                  sx={{ color: "#f44336", fontWeight: "600" }}
                >
                  {formatPercentage(market.borrowApy)}
                </Typography>
              </Box>

              <Box
                sx={{
                  p: 3,
                  backgroundColor: "rgba(0, 245, 224, 0.1)",
                  borderRadius: 2,
                  border: "1px solid rgba(75, 85, 99, 0.3)",
                }}
              >
                <Typography variant="body2" sx={{ color: "#8b949e", mb: 1 }}>
                  Total Supply
                </Typography>
                <Typography
                  variant="h5"
                  sx={{ color: "white", fontWeight: "600" }}
                >
                  {formatCurrency(market.totalSupplyUsd)}
                </Typography>
                <Typography variant="body2" sx={{ color: "#6b7280", mt: 1 }}>
                  {formatNumber(
                    formatTokenAmount(
                      market.totalSupplyAssets,
                      market.loanAsset.decimals
                    )
                  )}{" "}
                  {market.loanAsset.symbol}
                </Typography>
              </Box>

              <Box
                sx={{
                  p: 3,
                  backgroundColor: "rgba(0, 245, 224, 0.1)",
                  borderRadius: 2,
                  border: "1px solid rgba(75, 85, 99, 0.3)",
                }}
              >
                <Typography variant="body2" sx={{ color: "#8b949e", mb: 1 }}>
                  Total Borrow
                </Typography>
                <Typography
                  variant="h5"
                  sx={{ color: "white", fontWeight: "600" }}
                >
                  {formatCurrency(market.totalBorrowUsd)}
                </Typography>
                <Typography variant="body2" sx={{ color: "#6b7280", mt: 1 }}>
                  {formatNumber(
                    formatTokenAmount(
                      market.totalBorrowAssets,
                      market.loanAsset.decimals
                    )
                  )}{" "}
                  {market.loanAsset.symbol}
                </Typography>
              </Box>

              <Box
                sx={{
                  p: 3,
                  backgroundColor: "rgba(0, 245, 224, 0.1)",
                  borderRadius: 2,
                  border: "1px solid rgba(75, 85, 99, 0.3)",
                }}
              >
                <Typography variant="body2" sx={{ color: "#8b949e", mb: 1 }}>
                  Utilization Rate
                </Typography>
                <Typography
                  variant="h5"
                  sx={{ color: "white", fontWeight: "600" }}
                >
                  {formatPercentage(market.utilization)}
                </Typography> */}

          {/* Utilization Bar */}
          {/* <Box
                  sx={{
                    width: "100%",
                    height: 6,
                    backgroundColor: "#2d3748",
                    borderRadius: 1,
                    overflow: "hidden",
                    mt: 2,
                  }}
                >
                  <Box
                    sx={{
                      width: `${Math.min(market.utilization * 100, 100)}%`,
                      height: "100%",
                      backgroundColor:
                        market.utilization > 0.9
                          ? "#f44336"
                          : market.utilization > 0.7
                          ? "#ff9800"
                          : "#4caf50",
                      borderRadius: 1,
                    }}
                  />
                </Box>
              </Box>

              <Box
                sx={{
                  p: 3,
                  backgroundColor: "rgba(0, 245, 224, 0.1)",
                  borderRadius: 2,
                  border: "1px solid rgba(75, 85, 99, 0.3)",
                }}
              >
                <Typography variant="body2" sx={{ color: "#8b949e", mb: 1 }}>
                  Available Liquidity
                </Typography>
                <Typography
                  variant="h5"
                  sx={{ color: "white", fontWeight: "600" }}
                >
                  {formatCurrency(market.state?.liquidityAssetsUsd || 0)}
                </Typography>
                <Typography variant="body2" sx={{ color: "#6b7280", mt: 1 }}>
                  {formatNumber(
                    formatTokenAmount(
                      market.state.liquidityAssets,
                      market.loanAsset.decimals
                    )
                  )}{" "}
                  {market.loanAsset.symbol}
                </Typography>
              </Box>
            </Box>
          </TabPanel> */}

          {/* Advanced Tab */}
          {/* <TabPanel value={value} index={2}>
            <Typography
              variant="h6"
              gutterBottom
              sx={{ color: "white", mb: 3, fontWeight: "600" }}
            >
              Advanced Information
            </Typography>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", lg: "repeat(2, 1fr)" },
                gap: 3,
                mt: 2,
              }}
            >
              <Box
                sx={{
                  p: 3,
                  backgroundColor: "rgba(0, 245, 224, 0.1)",
                  borderRadius: 2,
                  border: "1px solid rgba(75, 85, 99, 0.3)",
                }}
              >
                <Typography variant="body2" sx={{ color: "#8b949e", mb: 2 }}>
                  Oracle Address
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Typography
                    variant="body2"
                    sx={{ fontFamily: "monospace", color: "white" }}
                  >
                    {market.oracleAddress
                      ? `${market.oracleAddress.slice(
                          0,
                          10
                        )}...${market.oracleAddress.slice(-8)}`
                      : "Not available"}
                  </Typography>
                  {market.oracleAddress && (
                    <Link
                      href={`https://etherscan.io/address/${market.oracleAddress}`}
                      target="_blank"
                      rel="noopener"
                      sx={{ color: "#00F5E0" }}
                    >
                      <OpenInNew fontSize="small" />
                    </Link>
                  )}
                </Box>
              </Box>

              <Box
                sx={{
                  p: 3,
                  backgroundColor: "rgba(0, 245, 224, 0.1)",
                  borderRadius: 2,
                  border: "1px solid rgba(75, 85, 99, 0.3)",
                }}
              >
                <Typography variant="body2" sx={{ color: "#8b949e", mb: 2 }}>
                  IRM Address
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Typography
                    variant="body2"
                    sx={{ fontFamily: "monospace", color: "white" }}
                  >
                    {market.irmAddress
                      ? `${market.irmAddress.slice(
                          0,
                          10
                        )}...${market.irmAddress.slice(-8)}`
                      : "Not available"}
                  </Typography>
                  {market.irmAddress && (
                    <Link
                      href={`https://etherscan.io/address/${market.irmAddress}`}
                      target="_blank"
                      rel="noopener"
                      sx={{ color: "#00F5E0" }}
                    >
                      <OpenInNew fontSize="small" />
                    </Link>
                  )}
                </Box>
              </Box>

              <Box
                sx={{
                  p: 3,
                  backgroundColor: "rgba(0, 245, 224, 0.1)",
                  borderRadius: 2,
                  border: "1px solid rgba(75, 85, 99, 0.3)",
                }}
              >
                <Typography variant="body2" sx={{ color: "#8b949e", mb: 2 }}>
                  LLTV (Liquidation LTV)
                </Typography>
                <Typography
                  variant="h6"
                  sx={{ color: "white", fontWeight: "600" }}
                >
                  {formatPercentage(parseFloat(market.lltv) / 1e18)}
                </Typography>
              </Box>

              <Box
                sx={{
                  p: 3,
                  backgroundColor: "rgba(0, 245, 224, 0.1)",
                  borderRadius: 2,
                  border: "1px solid rgba(75, 85, 99, 0.3)",
                }}
              >
                <Typography variant="body2" sx={{ color: "#8b949e", mb: 2 }}>
                  Market Fee
                </Typography>
                <Typography
                  variant="h6"
                  sx={{ color: "white", fontWeight: "600" }}
                >
                  {formatPercentage(market.state.fee)}
                </Typography>
              </Box> */}

          {/* Collateral Asset Details */}
          {/* <Box
                sx={{
                  p: 3,
                  backgroundColor: "rgba(0, 245, 224, 0.1)",
                  borderRadius: 2,
                  border: "1px solid rgba(75, 85, 99, 0.3)",
                }}
              >
                <Typography variant="body2" sx={{ color: "#8b949e", mb: 2 }}>
                  Collateral Asset
                </Typography>
                <Typography
                  variant="body1"
                  sx={{ color: "white", fontWeight: "500", mb: 1 }}
                >
                  {market.collateralAsset.name || market.collateralAsset.symbol}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ fontFamily: "monospace", color: "#6b7280" }}
                >
                  {market.collateralAsset.address
                    ? `${market.collateralAsset.address.slice(
                        0,
                        10
                      )}...${market.collateralAsset.address.slice(-8)}`
                    : "Not available"}
                </Typography>
              </Box> */}

          {/* Loan Asset Details */}
          {/* <Box
                sx={{
                  p: 3,
                  backgroundColor: "rgba(0, 245, 224, 0.1)",
                  borderRadius: 2,
                  border: "1px solid rgba(75, 85, 99, 0.3)",
                }}
              >
                <Typography variant="body2" sx={{ color: "#8b949e", mb: 2 }}>
                  Loan Asset
                </Typography>
                <Typography
                  variant="body1"
                  sx={{ color: "white", fontWeight: "500", mb: 1 }}
                >
                  {market.loanAsset.name || market.loanAsset.symbol}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ fontFamily: "monospace", color: "#6b7280" }}
                >
                  {market.loanAsset.address
                    ? `${market.loanAsset.address.slice(
                        0,
                        10
                      )}...${market.loanAsset.address.slice(-8)}`
                    : "Not available"}
                </Typography>
              </Box>
            </Box> */}

          {/* Warnings Section */}
          {/* {market.warnings && market.warnings.length > 0 && (
              <Box sx={{ mt: 4 }}>
                <Typography
                  variant="h6"
                  sx={{ color: "white", mb: 2, fontWeight: "600" }}
                >
                  Market Warnings
                </Typography>
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                  {market.warnings.map((warning, index) => (
                    <Chip
                      key={index}
                      label={
                        warning.type?.replace(/_/g, " ").toUpperCase() ||
                        "WARNING"
                      }
                      size="small"
                      sx={{
                        backgroundColor:
                          warning.level === "RED"
                            ? "rgba(244, 67, 54, 0.2)"
                            : "rgba(255, 152, 0, 0.2)",
                        color: warning.level === "RED" ? "#f87171" : "#ffb74d",
                        border: `1px solid ${
                          warning.level === "RED"
                            ? "rgba(244, 67, 54, 0.3)"
                            : "rgba(255, 152, 0, 0.3)"
                        }`,
                        fontSize: "0.75rem",
                        fontWeight: "500",
                      }}
                    />
                  ))}
                </Box>
              </Box>
            )}
          </TabPanel> */}

          {/* Activity Tab */}
          <TabPanel value={value} index={1}>
            <Typography
              variant="h6"
              gutterBottom
              sx={{ color: "white", mb: 3, fontWeight: "600", fontSize: { xs: "1.125rem", sm: "1.25rem" } }}
            >
              Recent Activity
            </Typography>
            <TableContainer
              component={Paper}
              sx={{
                mt: 2,
                backgroundColor: "transparent",
                overflowX: "auto",
                "& .MuiTableCell-root": {
                  borderColor: "rgba(75, 85, 99, 0.3)",
                  color: "white",
                  fontSize: { xs: "0.75rem", sm: "0.875rem" },
                  px: { xs: 1, sm: 2 },
                  py: { xs: 1.5, sm: 2 },
                  whiteSpace: { xs: "nowrap", md: "normal" },
                },
                "& .MuiTableHead-root .MuiTableCell-root": {
                  backgroundColor: "rgba(0, 245, 224, 0.1)",
                  color: "#8b949e",
                  fontWeight: "600",
                },
              }}
            >
              <Table sx={{ minWidth: { xs: 600, md: "auto" } }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Type</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>USD Value</TableCell>
                    <TableCell>User</TableCell>
                    <TableCell>Time</TableCell>
                    <TableCell>Transaction</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {mockActivity.map((activity) => (
                    <TableRow
                      key={activity.id}
                      sx={{
                        "&:hover": {
                          backgroundColor: "rgba(55, 65, 81, 0.2)",
                        },
                      }}
                    >
                      <TableCell>
                        <Chip
                          label={activity.type}
                          size="small"
                          sx={{
                            backgroundColor:
                              activity.type === "Borrow"
                                ? "rgba(244, 67, 54, 0.2)"
                                : activity.type === "Repay"
                                ? "rgba(76, 175, 80, 0.2)"
                                : "rgba(255, 152, 0, 0.2)",
                            color:
                              activity.type === "Borrow"
                                ? "#f87171"
                                : activity.type === "Repay"
                                ? "#81c784"
                                : "#ffb74d",
                            border: `1px solid ${
                              activity.type === "Borrow"
                                ? "rgba(244, 67, 54, 0.3)"
                                : activity.type === "Repay"
                                ? "rgba(76, 175, 80, 0.3)"
                                : "rgba(255, 152, 0, 0.3)"
                            }`,
                            fontSize: { xs: "0.7rem", sm: "0.75rem" },
                          }}
                        />
                      </TableCell>
                      <TableCell>{activity.amount}</TableCell>
                      <TableCell>{activity.usdValue}</TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{ fontFamily: "monospace", color: "white" }}
                        >
                          {activity.user}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ color: "#8b949e" }}>
                          {activity.timestamp}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`https://etherscan.io/tx/${activity.txHash}`}
                          target="_blank"
                          rel="noopener"
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.5,
                            color: "#00F5E0",
                          }}
                        >
                          <Typography
                            variant="body2"
                            sx={{ fontFamily: "monospace", color: "#00F5E0" }}
                          >
                            {`${activity.txHash.slice(0, 8)}...`}
                          </Typography>
                          <OpenInNew fontSize="small" />
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>
        </Box>
      </Paper>
    </GlowBox>
  );
}
