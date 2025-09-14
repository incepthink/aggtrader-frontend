// components/limit-widget/LimitTokenSelectionModal.tsx
"use client";

import React, {
  type FC,
  useCallback,
  useState,
  useMemo,
  useEffect,
} from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  CircularProgress,
  Box,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Chip,
  TextField,
  InputAdornment,
  Tabs,
  Tab,
} from "@mui/material";
import { Close as CloseIcon, Search as SearchIcon } from "@mui/icons-material";
import { useAccount, useBalance, type UseBalanceParameters } from "wagmi";
import type { GetBalanceReturnType } from "@wagmi/core";
import {
  useTokensBackend,
  type TokenData,
} from "../../../hooks/useTokensBackend";
import { convertTokenDataToToken } from "@/store/limit-order/utils/simpleCurrency";
import type { Token } from "@/store/limit-order/utils/token.types";
import { isNativeToken } from "@/store/limit-order/utils/token.types";

// Priority tokens that should appear first
const PRIORITY_TOKENS = ["ETH", "WETH", "USDC", "USDT", "WBTC", "BNB", "MATIC"];

interface LimitTokenSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (token: Token) => void;
  selectedToken?: Token;
  otherToken?: Token;
  chainId: number;
  title?: string;
}

// Component to handle individual token balance fetching with proper native/ERC20 logic
const TokenItemWithBalance: FC<{
  tokenData: TokenData;
  isSelected: boolean;
  isDisabled: boolean;
  onClick: () => void;
  address?: `0x${string}`;
  chainId: number;
}> = ({ tokenData, isSelected, isDisabled, onClick, address, chainId }) => {
  // Convert to Token for native detection
  const token = useMemo(() => convertTokenDataToToken(tokenData), [tokenData]);

  // Correctly typed args for useBalance
  const balanceArgs = useMemo<UseBalanceParameters | undefined>(() => {
    if (!address) return undefined;

    const isNative = isNativeToken(token);

    return {
      address,
      ...(isNative ? {} : { token: token.address as `0x${string}` }),
      chainId,
      query: { enabled: true },
    };
  }, [address, token, chainId]);

  const { data: balanceRaw, isLoading: isBalanceLoading } =
    useBalance(balanceArgs);

  // Narrow the type (TS-safe)
  const balance = balanceRaw as GetBalanceReturnType | undefined;

  const formattedBalance = useMemo(() => {
    if (!balance) return undefined;

    // Use wagmi's preformatted string
    const num = Number(balance.formatted);

    if (Number.isNaN(num)) return undefined;
    if (num === 0) return "0";
    if (num < 0.0001) return "< 0.0001";
    if (num < 1) return num.toFixed(4);
    if (num < 1000) return num.toFixed(2);

    return num.toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  }, [balance]);

  return (
    <ListItemButton
      onClick={onClick}
      disabled={isDisabled}
      sx={{
        py: 1.5,
        px: 2,
        bgcolor: isSelected ? "rgba(0, 245, 224, 0.1)" : "transparent",
        border: isSelected ? "1px solid rgba(0, 245, 224, 0.3)" : "none",
        "&:hover": {
          bgcolor: isSelected
            ? "rgba(0, 245, 224, 0.15)"
            : "rgba(255, 255, 255, 0.05)",
        },
      }}
    >
      <ListItemAvatar>
        <Avatar
          src={tokenData.logoURI}
          sx={{
            width: 32,
            height: 32,
            bgcolor: "rgba(255, 255, 255, 0.1)",
            color: "white",
            fontSize: "12px",
            fontWeight: 600,
          }}
        >
          {!tokenData.logoURI && tokenData.symbol?.slice(0, 2).toUpperCase()}
        </Avatar>
      </ListItemAvatar>
      <ListItemText
        primary={
          <Box display="flex" alignItems="center" gap={1}>
            <Typography
              variant="body1"
              sx={{
                color: "white",
                fontWeight: PRIORITY_TOKENS.includes(
                  tokenData.symbol?.toUpperCase() || ""
                )
                  ? 600
                  : 400,
              }}
            >
              {tokenData.symbol}
            </Typography>
            {PRIORITY_TOKENS.includes(
              tokenData.symbol?.toUpperCase() || ""
            ) && (
              <Chip
                label="Popular"
                size="small"
                sx={{
                  bgcolor: "rgba(0, 245, 224, 0.2)",
                  color: "#00F5E0",
                  fontSize: "0.7rem",
                  height: 20,
                }}
              />
            )}
            {isSelected && (
              <Chip
                label="Selected"
                size="small"
                sx={{
                  bgcolor: "rgba(0, 245, 224, 0.3)",
                  color: "#00F5E0",
                  fontSize: "0.7rem",
                  height: 20,
                }}
              />
            )}
          </Box>
        }
        secondary={
          <Typography
            variant="body2"
            sx={{
              color: "rgba(255, 255, 255, 0.6)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {tokenData.name}
          </Typography>
        }
      />
      <Box textAlign="right">
        {isBalanceLoading ? (
          <CircularProgress size={16} sx={{ color: "#00F5E0" }} />
        ) : formattedBalance ? (
          <Typography variant="body2" sx={{ color: "white" }}>
            {formattedBalance}
          </Typography>
        ) : null}
      </Box>
    </ListItemButton>
  );
};

export const LimitTokenSelectionModal: FC<LimitTokenSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  selectedToken,
  otherToken,
  chainId,
  title = "Select a token",
}) => {
  const { address } = useAccount();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"popular" | "all">("popular");

  // Fetch tokens using the backend hook
  const { tokens: rawTokens, isLoading, isError } = useTokensBackend(chainId);

  // Reset search and tab when modal opens
  useEffect(() => {
    if (isOpen) {
      setSearchQuery("");
      setActiveTab("popular");
    }
  }, [isOpen]);

  // Memoize expensive computations
  const { priorityTokens, allTokens } = useMemo(() => {
    if (!rawTokens || rawTokens.length === 0)
      return { priorityTokens: [], allTokens: [] };

    const priority: TokenData[] = [];
    const regular: TokenData[] = [];

    rawTokens.forEach((token) => {
      if (PRIORITY_TOKENS.includes(token.symbol?.toUpperCase() || "")) {
        priority.push(token);
      } else {
        regular.push(token);
      }
    });

    // Sort priority tokens by their order in PRIORITY_TOKENS array
    priority.sort((a, b) => {
      const aIndex = PRIORITY_TOKENS.indexOf(a.symbol?.toUpperCase() || "");
      const bIndex = PRIORITY_TOKENS.indexOf(b.symbol?.toUpperCase() || "");
      return aIndex - bIndex;
    });

    // Sort regular tokens alphabetically
    regular.sort((a, b) => (a.symbol || "").localeCompare(b.symbol || ""));

    return {
      priorityTokens: priority,
      allTokens: [...priority, ...regular],
    };
  }, [rawTokens]);

  // Determine which tokens to show based on active tab
  const tokensToShow = useMemo(() => {
    return activeTab === "popular" ? priorityTokens : allTokens;
  }, [activeTab, priorityTokens, allTokens]);

  // Filter tokens based on search query
  const filteredTokens = useMemo(() => {
    if (!searchQuery.trim()) return tokensToShow;

    const query = searchQuery.toLowerCase();
    return tokensToShow.filter(
      (token) =>
        token.symbol?.toLowerCase().includes(query) ||
        token.name?.toLowerCase().includes(query)
    );
  }, [tokensToShow, searchQuery]);

  const handleSelect = useCallback(
    (tokenData: TokenData) => {
      const selectedTokenObj = convertTokenDataToToken(tokenData);
      onSelect(selectedTokenObj);
      onClose();
    },
    [onSelect, onClose]
  );

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleTabChange = useCallback(
    (event: React.SyntheticEvent, newValue: "popular" | "all") => {
      setActiveTab(newValue);
    },
    []
  );

  if (isError) {
    console.error("Error loading tokens");
    return null;
  }

  return (
    <Dialog
      open={isOpen}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      keepMounted
      PaperProps={{
        sx: {
          bgcolor: "rgba(30, 41, 59, 0.95)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: 2,
          color: "white",
          minHeight: "600px",
          maxHeight: "80vh",
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          color: "white",
          borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
          py: 2,
        }}
      >
        <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
          {title}
        </Typography>
        <IconButton
          onClick={handleClose}
          sx={{
            color: "rgba(255, 255, 255, 0.7)",
            "&:hover": {
              backgroundColor: "rgba(255, 255, 255, 0.1)",
            },
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0, display: "flex", flexDirection: "column" }}>
        <Box sx={{ p: 3, display: "flex", flexDirection: "column", gap: 3 }}>
          {/* Search Input */}
          <TextField
            fullWidth
            placeholder="Search by name or symbol"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            variant="outlined"
            autoComplete="off"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: "rgba(255, 255, 255, 0.5)" }} />
                </InputAdornment>
              ),
              sx: {
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                color: "white",
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "rgba(255, 255, 255, 0.3)",
                },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: "rgba(255, 255, 255, 0.5)",
                },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#00F5E0",
                },
              },
            }}
            sx={{
              "& .MuiInputBase-input::placeholder": {
                color: "rgba(255, 255, 255, 0.5)",
                opacity: 1,
              },
            }}
          />

          {/* Token Type Tabs */}
          <Box
            sx={{
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              borderRadius: "12px",
              p: 0.5,
              "& .MuiTabs-root": {
                minHeight: "auto",
              },
              "& .MuiTab-root": {
                minHeight: "auto",
                padding: "8px 16px",
                margin: 0,
                borderRadius: "8px",
                color: "rgba(255, 255, 255, 0.7)",
                fontSize: "14px",
                fontWeight: 500,
                textTransform: "none",
                transition: "all 0.2s",
                "&:hover": {
                  color: "white",
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                },
                "&.Mui-selected": {
                  backgroundColor: "#00F5E0",
                  color: "#000",
                  "&:hover": {
                    backgroundColor: "#00F5E0",
                    color: "#000",
                  },
                },
              },
              "& .MuiTabs-indicator": {
                display: "none",
              },
            }}
          >
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              variant="fullWidth"
            >
              <Tab
                value="popular"
                label={`Popular (${priorityTokens.length})`}
              />
              <Tab value="all" label={`All Tokens (${allTokens.length})`} />
            </Tabs>
          </Box>
        </Box>

        {isLoading ? (
          <Box display="flex" flexDirection="column" alignItems="center" py={4}>
            <CircularProgress sx={{ color: "#00F5E0", mb: 2 }} />
            <Typography
              variant="body2"
              sx={{ color: "rgba(255, 255, 255, 0.7)" }}
            >
              Loading tokens...
            </Typography>
          </Box>
        ) : (
          <Box
            sx={{
              flex: 1,
              overflowY: "auto",
              borderTop: "1px solid rgba(255, 255, 255, 0.1)",
            }}
          >
            {filteredTokens.length === 0 ? (
              <Box textAlign="center" py={8}>
                <Typography sx={{ color: "rgba(255, 255, 255, 0.5)" }}>
                  {searchQuery
                    ? "No tokens found matching your search"
                    : `No ${activeTab} tokens available`}
                </Typography>
              </Box>
            ) : (
              <>
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  p={2}
                  pb={0}
                  mb={2}
                >
                  <Typography
                    variant="body2"
                    sx={{ color: "rgba(255, 255, 255, 0.7)" }}
                  >
                    {searchQuery
                      ? `${filteredTokens.length} tokens found`
                      : `${filteredTokens.length} ${activeTab} tokens`}
                  </Typography>
                </Box>

                <List sx={{ p: 0 }}>
                  {filteredTokens.map((token: TokenData, index) => {
                    const isCurrentlySelected =
                      selectedToken?.address === token.address;
                    const isOtherToken = otherToken?.address === token.address;

                    return (
                      <ListItem
                        key={`${token.address}-${index}`}
                        disablePadding
                        sx={{
                          borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
                          "&:last-child": {
                            borderBottom: "none",
                          },
                        }}
                      >
                        <TokenItemWithBalance
                          tokenData={token}
                          isSelected={isCurrentlySelected}
                          isDisabled={isOtherToken}
                          onClick={() => handleSelect(token)}
                          address={address}
                          chainId={chainId}
                        />
                      </ListItem>
                    );
                  })}
                </List>
              </>
            )}
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};
