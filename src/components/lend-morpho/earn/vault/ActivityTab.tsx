"use client";

import React, { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Button,
  Select,
  MenuItem,
  FormControl,
  Pagination,
  Chip,
} from "@mui/material";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import {
  VaultDetail,
  useVaultPositions,
  useVaultTransactions,
  VaultPosition,
  Transaction,
} from "@/hooks/lend-morpho/ValutDescriptionHooks";

interface ActivityTabProps {
  vault: VaultDetail;
}

type ActivitySection = "distribution" | "transactions";

// Helper function to format large numbers
const formatNumber = (num: number): string => {
  if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
  return num.toFixed(2);
};

const formatAddress = (address: string) => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

const ActivityTab: React.FC<ActivityTabProps> = ({ vault }) => {
  const [activeSection, setActiveSection] =
    useState<ActivitySection>("distribution");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);

  // Fetch user positions and transactions
  const { data: positions = [], isLoading: positionsLoading } =
    useVaultPositions(vault.address, 50);
  const { data: transactions = [], isLoading: transactionsLoading } =
    useVaultTransactions(vault.address, 100);

  // Pagination for positions
  const totalPages = Math.ceil(positions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedPositions = positions.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const generateRandomColor = (index: number) => {
    const colors = [
      "#3b82f6",
      "#10b981",
      "#f59e0b",
      "#ef4444",
      "#8b5cf6",
      "#06b6d4",
      "#84cc16",
      "#f97316",
      "#ec4899",
      "#6366f1",
    ];
    return colors[index % colors.length];
  };

  // Section Toggle Component
  const SectionToggle = () => (
    <Box sx={{ mb: 3 }}>
      <Button
        onClick={() => setActiveSection("distribution")}
        sx={{
          mr: 2,
          color: activeSection === "distribution" ? "white" : "#8b949e",
          borderBottom:
            activeSection === "distribution" ? "2px solid #3b82f6" : "none",
          borderRadius: 0,
          textTransform: "none",
        }}
      >
        User Distribution
      </Button>
      <Button
        onClick={() => setActiveSection("transactions")}
        sx={{
          color: activeSection === "transactions" ? "white" : "#8b949e",
          borderBottom:
            activeSection === "transactions" ? "2px solid #3b82f6" : "none",
          borderRadius: 0,
          textTransform: "none",
        }}
      >
        All Transactions
      </Button>
    </Box>
  );

  return (
    <Box>
      <SectionToggle />

      {activeSection === "distribution" ? (
        <Box>
          {/* User Distribution Table */}
          <TableContainer
            component={Paper}
            sx={{
              backgroundColor: "rgba(0, 245, 224, 0.1)",
              borderRadius: 2,
              mb: 3,
            }}
          >
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell
                    sx={{ color: "#8b949e", borderBottom: "1px solid #2d3748" }}
                  >
                    User
                  </TableCell>
                  <TableCell
                    sx={{ color: "#8b949e", borderBottom: "1px solid #2d3748" }}
                  >
                    Deposit
                  </TableCell>
                  <TableCell
                    sx={{ color: "#8b949e", borderBottom: "1px solid #2d3748" }}
                  >
                    % of Deposits
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {positionsLoading ? (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      sx={{ textAlign: "center", color: "#8b949e", py: 4 }}
                    >
                      Loading user positions...
                    </TableCell>
                  </TableRow>
                ) : paginatedPositions.length > 0 ? (
                  paginatedPositions.map(
                    (position: VaultPosition, index: number) => {
                      const percentage =
                        (position.state.assetsUsd /
                          vault.state.totalAssetsUsd) *
                        100;
                      const actualIndex = startIndex + index;
                      // Create unique key combining address and index to ensure uniqueness
                      const uniqueKey = `${position.user.address}-${actualIndex}`;

                      return (
                        <TableRow
                          key={uniqueKey}
                          sx={{ "&:hover": { backgroundColor: "#252832" } }}
                        >
                          <TableCell
                            sx={{
                              color: "white",
                              borderBottom: "1px solid #2d3748",
                            }}
                          >
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                              }}
                            >
                              <Avatar
                                sx={{
                                  width: 24,
                                  height: 24,
                                  backgroundColor:
                                    generateRandomColor(actualIndex),
                                  fontSize: "12px",
                                }}
                              >
                                {position.user.address
                                  .slice(2, 4)
                                  .toUpperCase()}
                              </Avatar>
                              <Typography sx={{ fontFamily: "monospace" }}>
                                {formatAddress(position.user.address)}
                              </Typography>
                              <OpenInNewIcon
                                sx={{ color: "#8b949e", fontSize: 14 }}
                              />
                            </Box>
                          </TableCell>

                          <TableCell
                            sx={{
                              color: "white",
                              borderBottom: "1px solid #2d3748",
                            }}
                          >
                            <Box>
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 1,
                                }}
                              >
                                <Box
                                  sx={{
                                    width: 20,
                                    height: 20,
                                    backgroundColor: "#3b82f6",
                                    borderRadius: "50%",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: "10px",
                                    color: "white",
                                  }}
                                >
                                  U
                                </Box>
                                <Typography>
                                  {formatNumber(
                                    parseFloat(position.state.assets) /
                                      Math.pow(10, vault.asset.decimals)
                                  )}{" "}
                                  USDC
                                </Typography>
                              </Box>
                              <Typography
                                variant="caption"
                                sx={{ color: "#8b949e" }}
                              >
                                ${formatNumber(position.state.assetsUsd)}
                              </Typography>
                            </Box>
                          </TableCell>

                          <TableCell
                            sx={{
                              color: "white",
                              borderBottom: "1px solid #2d3748",
                            }}
                          >
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                              }}
                            >
                              <Box
                                sx={{
                                  width: 12,
                                  height: 12,
                                  backgroundColor:
                                    generateRandomColor(actualIndex),
                                  borderRadius: "50%",
                                }}
                              />
                              <Typography>{percentage.toFixed(2)}%</Typography>
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    }
                  )
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      sx={{ textAlign: "center", color: "#8b949e", py: 4 }}
                    >
                      No user positions found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          {positions.length > itemsPerPage && (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: 2,
              }}
            >
              <Typography variant="body2" sx={{ color: "#8b949e" }}>
                {startIndex + 1} of {positions.length}
              </Typography>
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={(_, page) => setCurrentPage(page)}
                sx={{
                  "& .MuiPaginationItem-root": {
                    color: "#8b949e",
                  },
                  "& .Mui-selected": {
                    backgroundColor: "#3b82f6 !important",
                    color: "white",
                  },
                }}
              />
            </Box>
          )}
        </Box>
      ) : (
        /* Transactions View */
        <Box>
          {/* Filter Controls */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              // mb: 3,
            }}
          >
            {/* <Typography variant="h6" sx={{ color: "white" }}>
              All Transactions
            </Typography> */}
            {/* <Box sx={{ display: "flex", gap: 2 }}>
              <FormControl size="small">
                <Select
                  defaultValue="All"
                  sx={{
                    backgroundColor: "#2d3748",
                    color: "white",
                    "& .MuiOutlinedInput-notchedOutline": { border: "none" },
                    "& .MuiSvgIcon-root": { color: "#8b949e" },
                  }}
                >
                  <MenuItem value="All">All</MenuItem>
                  <MenuItem value="Deposit">Deposits</MenuItem>
                  <MenuItem value="Withdraw">Withdrawals</MenuItem>
                </Select>
              </FormControl>
              <Button
                sx={{
                  color: "#8b949e",
                  borderColor: "#2d3748",
                  textTransform: "none",
                }}
              >
                Edit properties
              </Button>
            </Box> */}
          </Box>

          {/* Transactions List */}
          <Box>
            {transactionsLoading ? (
              <Paper
                sx={{ p: 4, backgroundColor: "#2d3748", textAlign: "center" }}
              >
                <Typography sx={{ color: "#8b949e" }}>
                  Loading transactions...
                </Typography>
              </Paper>
            ) : transactions.length > 0 ? (
              transactions
                .slice(0, 10)
                .map((transaction: Transaction, index: number) => {
                  // Create unique key combining hash, user address, and index to ensure uniqueness
                  const uniqueKey = `${transaction.hash}-${transaction.user.address}-${index}`;

                  return (
                    <Paper
                      key={uniqueKey}
                      sx={{
                        p: 3,
                        mb: 2,
                        backgroundColor: "rgba(0, 245, 224, 0.1)",
                        borderRadius: 2,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 2 }}
                      >
                        <Avatar
                          sx={{
                            width: 32,
                            height: 32,
                            backgroundColor: generateRandomColor(index),
                          }}
                        >
                          {transaction.user.address.slice(2, 4).toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography
                            sx={{ color: "white", fontWeight: "medium" }}
                          >
                            {formatAddress(transaction.user.address)}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{ color: "#8b949e" }}
                          >
                            {new Date(
                              transaction.timestamp * 1000
                            ).toLocaleString()}
                          </Typography>
                        </Box>
                      </Box>

                      <Box sx={{ textAlign: "right" }}>
                        <Chip
                          label={transaction.type}
                          size="small"
                          sx={{
                            backgroundColor: transaction.type.includes(
                              "Deposit"
                            )
                              ? "#1a4d3a"
                              : "#4d1a1a",
                            color: transaction.type.includes("Deposit")
                              ? "#4caf50"
                              : "#f44336",
                          }}
                        />
                        <Typography
                          variant="caption"
                          sx={{ color: "#8b949e", display: "block", mt: 0.5 }}
                        >
                          Block #{transaction.blockNumber}
                        </Typography>
                      </Box>
                    </Paper>
                  );
                })
            ) : (
              <Paper
                sx={{ p: 4, backgroundColor: "#2d3748", textAlign: "center" }}
              >
                <Typography sx={{ color: "#8b949e" }}>
                  No transactions found
                </Typography>
              </Paper>
            )}
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default ActivityTab;
