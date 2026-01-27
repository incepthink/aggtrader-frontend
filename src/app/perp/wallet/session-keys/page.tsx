"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  IconButton,
  Tooltip,
} from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { useAccount } from "wagmi";
import {
  SessionKey,
  getSessionKeysForWallet,
  removeSessionKey,
  formatExpiry,
  formatCreatedAt,
  hasValidSessionKey,
} from "@/utils/perp/sessionKeyStorage";
import UnlockWalletModal from "@/components/perp/UnlockWalletModal";

export default function SessionKeysPage() {
  const { address, isConnected } = useAccount();
  const [sessionKeys, setSessionKeys] = useState<SessionKey[]>([]);
  const [showUnlockModal, setShowUnlockModal] = useState(false);

  // Load session keys on mount and when address changes
  useEffect(() => {
    if (address) {
      const keys = getSessionKeysForWallet(address);
      setSessionKeys(keys);
    } else {
      setSessionKeys([]);
    }
  }, [address]);

  const handleRemoveKey = (keyId: string) => {
    removeSessionKey(keyId);
    if (address) {
      setSessionKeys(getSessionKeysForWallet(address));
    }
  };

  const handleInvalidateAll = () => {
    if (address) {
      // Remove all keys for this wallet
      sessionKeys.forEach((key) => removeSessionKey(key.id));
      setSessionKeys([]);
    }
  };

  const handleCreateNewKey = () => {
    setShowUnlockModal(true);
  };

  const handleUnlockSuccess = () => {
    setShowUnlockModal(false);
    if (address) {
      // Refresh the session keys list
      setSessionKeys(getSessionKeysForWallet(address));
    }
  };

  // Check if current session is active
  const hasActiveSession = address ? hasValidSessionKey(address) : false;

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: "auto" }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 4,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography
            variant="h5"
            sx={{ color: "#fff", fontWeight: 600 }}
          >
            Session Keys
          </Typography>
          <Tooltip
            title="Session keys allow you to stay logged in without signing every time. Do not share your session keys with anyone."
            placement="right"
          >
            <IconButton size="small" sx={{ color: "rgba(255,255,255,0.5)" }}>
              <InfoOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        <Box sx={{ display: "flex", gap: 2 }}>
          {sessionKeys.length > 0 && (
            <Button
              variant="outlined"
              onClick={handleInvalidateAll}
              sx={{
                borderColor: "#f44336",
                color: "#f44336",
                textTransform: "none",
                "&:hover": {
                  borderColor: "#ff5252",
                  backgroundColor: "rgba(244, 67, 54, 0.1)",
                },
              }}
            >
              Invalidate All
            </Button>
          )}
          <Button
            variant="contained"
            onClick={handleCreateNewKey}
            sx={{
              background: "linear-gradient(90deg, #00F5E0 0%, #00C9B8 100%)",
              color: "#050C19",
              textTransform: "none",
              fontWeight: 600,
              "&:hover": {
                background: "linear-gradient(90deg, #00E5D0 0%, #00B9A8 100%)",
              },
            }}
          >
            Create New Key
          </Button>
        </Box>
      </Box>

      {/* Table */}
      {!isConnected ? (
        <Box
          sx={{
            p: 4,
            textAlign: "center",
            background: "rgba(255,255,255,0.02)",
            borderRadius: 2,
          }}
        >
          <Typography sx={{ color: "rgba(255,255,255,0.5)" }}>
            Connect your wallet to view session keys
          </Typography>
        </Box>
      ) : sessionKeys.length === 0 ? (
        <Box
          sx={{
            p: 4,
            textAlign: "center",
            background: "rgba(255,255,255,0.02)",
            borderRadius: 2,
          }}
        >
          <Typography sx={{ color: "rgba(255,255,255,0.5)", mb: 2 }}>
            No active session keys
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: "rgba(255,255,255,0.3)" }}
          >
            Create a session key to stay logged in without signing each time
          </Typography>
        </Box>
      ) : (
        <Box
          sx={{
            background: "rgba(5, 12, 25, 0.6)",
            borderRadius: 2,
            border: "1px solid rgba(255,255,255,0.05)",
            overflow: "hidden",
          }}
        >
          {/* Table Header */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "1.5fr 1fr 2fr 100px",
              gap: 2,
              p: 2,
              borderBottom: "1px solid rgba(255,255,255,0.05)",
              background: "rgba(0,0,0,0.2)",
            }}
          >
            <Typography
              variant="caption"
              sx={{
                color: "rgba(255,255,255,0.5)",
                textTransform: "uppercase",
                fontWeight: 600,
                letterSpacing: "0.5px",
              }}
            >
              Created
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: "rgba(255,255,255,0.5)",
                textTransform: "uppercase",
                fontWeight: 600,
                letterSpacing: "0.5px",
              }}
            >
              Expires
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: "rgba(255,255,255,0.5)",
                textTransform: "uppercase",
                fontWeight: 600,
                letterSpacing: "0.5px",
              }}
            >
              Client
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: "rgba(255,255,255,0.5)",
                textTransform: "uppercase",
                fontWeight: 600,
                letterSpacing: "0.5px",
                textAlign: "right",
              }}
            >
              Actions
            </Typography>
          </Box>

          {/* Table Rows */}
          {sessionKeys.map((key) => {
            const isExpired = new Date(key.expiresAt) <= new Date();
            const isCurrentSession = !isExpired && hasActiveSession;

            return (
              <Box
                key={key.id}
                sx={{
                  display: "grid",
                  gridTemplateColumns: "1.5fr 1fr 2fr 100px",
                  gap: 2,
                  p: 2,
                  borderBottom: "1px solid rgba(255,255,255,0.03)",
                  "&:last-child": {
                    borderBottom: "none",
                  },
                  "&:hover": {
                    background: "rgba(255,255,255,0.02)",
                  },
                }}
              >
                <Typography
                  sx={{
                    color: "#fff",
                    fontSize: "0.875rem",
                  }}
                >
                  {formatCreatedAt(key.createdAt)}
                </Typography>
                <Typography
                  sx={{
                    color: isExpired
                      ? "rgba(255,255,255,0.3)"
                      : "rgba(255,255,255,0.7)",
                    fontSize: "0.875rem",
                  }}
                >
                  {formatExpiry(key.expiresAt)}
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Typography
                    sx={{
                      color: "rgba(255,255,255,0.7)",
                      fontSize: "0.875rem",
                    }}
                  >
                    {key.client}
                  </Typography>
                  {isCurrentSession && !isExpired && (
                    <Typography
                      sx={{
                        color: "#4caf50",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                      }}
                    >
                      Active Session
                    </Typography>
                  )}
                </Box>
                <Box sx={{ textAlign: "right" }}>
                  <Button
                    size="small"
                    onClick={() => handleRemoveKey(key.id)}
                    sx={{
                      color: "#00F5E0",
                      textTransform: "none",
                      fontSize: "0.875rem",
                      minWidth: "auto",
                      "&:hover": {
                        background: "rgba(0, 245, 224, 0.1)",
                      },
                    }}
                  >
                    Remove
                  </Button>
                </Box>
              </Box>
            );
          })}

          {/* Warning Message */}
          <Box
            sx={{
              p: 2,
              borderTop: "1px solid rgba(255,255,255,0.05)",
              textAlign: "center",
            }}
          >
            <Typography
              variant="caption"
              sx={{ color: "rgba(255,255,255,0.4)" }}
            >
              Do not share your Session Keys with any untrusted third party.
            </Typography>
          </Box>
        </Box>
      )}

      {/* Unlock Wallet Modal */}
      <UnlockWalletModal
        open={showUnlockModal}
        onClose={() => setShowUnlockModal(false)}
        onSuccess={handleUnlockSuccess}
      />
    </Box>
  );
}
