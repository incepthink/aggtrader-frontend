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
import {
  useTokensBackend,
  type TokenData,
} from "../../../../hooks/useTokensBackend";
import { useSpotStore } from "@/store/spotStore";

// Priority tokens that should appear first
const PRIORITY_TOKENS = ["ETH", "WETH", "USDC", "USDT", "WBTC", "BNB", "MATIC"];

// Convert TokenData to match the store's Token interface
interface Token {
  name: string;
  ticker: string;
  img: string;
  address: `0x${string}`;
  decimals: number;
  chainId: number;
}

const convertTokenDataToToken = (tokenData: TokenData): Token => ({
  name: tokenData.name,
  ticker: tokenData.symbol,
  img: tokenData.logoURI || "",
  address: tokenData.address as `0x${string}`,
  decimals: tokenData.decimals,
  chainId: tokenData.chainId,
});

export const TokenSelectionModal: FC = () => {
  const {
    modalOpen,
    modalTokenPosition,
    closeModal,
    setTokenOne,
    setTokenTwo,
    tokenOne,
    tokenTwo,
    chainId,
  } = useSpotStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"popular" | "all">("popular");

  // Fetch tokens using the backend hook - this will use cached data if available
  const { tokens: rawTokens, isLoading, isError } = useTokensBackend(chainId);
  console.log("RAW TOKENS", rawTokens);

  // Reset search and tab when modal opens
  useEffect(() => {
    if (modalOpen) {
      setSearchQuery("");
      setActiveTab("popular");
    }
  }, [modalOpen]);

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

  // Get currently selected token based on modal position
  const currentlySelectedToken = useMemo(() => {
    if (modalTokenPosition === "tokenOne") return tokenOne;
    if (modalTokenPosition === "tokenTwo") return tokenTwo;
    return null;
  }, [modalTokenPosition, tokenOne, tokenTwo]);

  // Get the other token (to avoid selecting the same token twice)
  const otherToken = useMemo(() => {
    if (modalTokenPosition === "tokenOne") return tokenTwo;
    if (modalTokenPosition === "tokenTwo") return tokenOne;
    return null;
  }, [modalTokenPosition, tokenOne, tokenTwo]);

  const handleSelect = useCallback(
    (tokenData: TokenData) => {
      const selectedToken = convertTokenDataToToken(tokenData);

      // If selecting the same token as the other position, switch them
      if (selectedToken.address === otherToken?.address) {
        if (modalTokenPosition === "tokenOne") {
          setTokenOne(selectedToken);
          setTokenTwo(tokenOne);
        } else if (modalTokenPosition === "tokenTwo") {
          setTokenTwo(selectedToken);
          setTokenOne(tokenTwo);
        }
      } else {
        // Otherwise, just set the selected position
        if (modalTokenPosition === "tokenOne") {
          setTokenOne(selectedToken);
        } else if (modalTokenPosition === "tokenTwo") {
          setTokenTwo(selectedToken);
        }
      }

      closeModal();
    },
    [
      modalTokenPosition,
      setTokenOne,
      setTokenTwo,
      tokenOne,
      tokenTwo,
      otherToken,
      closeModal,
    ]
  );

  const handleClose = useCallback(() => {
    closeModal();
  }, [closeModal]);

  const handleTabChange = useCallback(
    (event: React.SyntheticEvent, newValue: "popular" | "all") => {
      setActiveTab(newValue);
    },
    []
  );

  // Get modal title based on position
  const getModalTitle = () => {
    if (modalTokenPosition === "tokenOne") return "Select token to sell";
    if (modalTokenPosition === "tokenTwo") return "Select token to buy";
    return "Select a token";
  };

  if (isError) {
    console.error("Error loading tokens");
    return null;
  }

  return (
    <Dialog
      open={modalOpen}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      keepMounted // Keep the dialog mounted to preserve state
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
          {getModalTitle()}
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

          {/* Current selection indicator */}
          {/* {currentlySelectedToken && (
            <Box
              sx={{
                p: 2,
                backgroundColor: "rgba(0, 245, 224, 0.1)",
                border: "1px solid rgba(0, 245, 224, 0.3)",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                gap: 2,
              }}
            >
              <Avatar
                src={currentlySelectedToken.img}
                sx={{ width: 24, height: 24 }}
              >
                {currentlySelectedToken.ticker.slice(0, 2)}
              </Avatar>
              <Typography variant="body2" sx={{ color: "#00F5E0" }}>
                Currently selected: {currentlySelectedToken.ticker}
              </Typography>
            </Box>
          )} */}
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
                    const isPriority = PRIORITY_TOKENS.includes(
                      token.symbol?.toUpperCase() || ""
                    );
                    const isCurrentlySelected =
                      currentlySelectedToken?.address === token.address;
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
                        <ListItemButton
                          onClick={() => handleSelect(token)}
                          sx={{
                            py: 1.5,
                            px: 2,
                            bgcolor: isCurrentlySelected
                              ? "rgba(0, 245, 224, 0.1)"
                              : "transparent",
                            border: isCurrentlySelected
                              ? "1px solid rgba(0, 245, 224, 0.3)"
                              : "none",
                            "&:hover": {
                              bgcolor: isCurrentlySelected
                                ? "rgba(0, 245, 224, 0.15)"
                                : "rgba(255, 255, 255, 0.05)",
                            },
                          }}
                        >
                          <ListItemAvatar>
                            <Avatar
                              src={token.logoURI}
                              sx={{
                                width: 32,
                                height: 32,
                                bgcolor: "rgba(255, 255, 255, 0.1)",
                                color: "white",
                                fontSize: "12px",
                                fontWeight: 600,
                              }}
                            >
                              {!token.logoURI &&
                                token.symbol?.slice(0, 2).toUpperCase()}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Box display="flex" alignItems="center" gap={1}>
                                <Typography
                                  variant="body1"
                                  sx={{
                                    color: "white",
                                    fontWeight: isPriority ? 600 : 400,
                                  }}
                                >
                                  {token.symbol}
                                </Typography>
                                {isPriority && activeTab === "all" && (
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
                                {isCurrentlySelected && (
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
                                {isOtherToken && (
                                  <Chip
                                    label={
                                      modalTokenPosition === "tokenOne"
                                        ? "Currently buying"
                                        : "Currently selling"
                                    }
                                    size="small"
                                    sx={{
                                      bgcolor: "rgba(255, 165, 0, 0.2)",
                                      color: "#FFA500",
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
                                {token.name}
                              </Typography>
                            }
                          />
                        </ListItemButton>
                      </ListItem>
                    );
                  })}
                </List>
              </>
            )}
          </Box>
        )}

        {/* Footer info */}
        <Box
          sx={{
            p: 2,
            borderTop: "1px solid rgba(255, 255, 255, 0.1)",
            backgroundColor: "rgba(255, 255, 255, 0.02)",
          }}
        >
          <Typography
            variant="caption"
            sx={{ color: "rgba(255, 255, 255, 0.5)" }}
          >
            {searchQuery
              ? `Showing ${filteredTokens.length} results for "${searchQuery}"`
              : `${
                  activeTab === "popular"
                    ? priorityTokens.length
                    : allTokens.length
                } ${activeTab} tokens available on Katana`}
          </Typography>
        </Box>
      </DialogContent>
    </Dialog>
  );
};
