// components/ApprovalButton.tsx

"use client";

import React, { useState, useCallback } from "react";
import {
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
  CircularProgress,
  Divider,
} from "@mui/material";
import {
  KeyboardArrowDown as ArrowDropDownIcon,
  CheckCircle as CheckIcon,
  Info as InfoIcon,
} from "@mui/icons-material";
import { SimpleAmount } from "@/store/limit-order/utils/simpleCurrency";
import type { Token } from "@/store/limit-order/utils/token.types";
import {
  useTokenApproval,
  ApprovalState,
} from "@/hooks/sushiswap/useTokenApproval";
import type { Address } from "viem";

interface ApprovalButtonProps {
  token: Token;
  amount: SimpleAmount;
  spender: Address;
  chainId: number;
  owner?: Address;
  onApprovalSuccess?: () => void;
  disabled?: boolean;
  className?: string;
}

export const ApprovalButton: React.FC<ApprovalButtonProps> = ({
  token,
  amount,
  spender,
  chainId,
  owner,
  onApprovalSuccess,
  disabled = false,
  className = "",
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedOption, setSelectedOption] = useState<"exact" | "unlimited">(
    "exact"
  );

  const {
    approvalState,
    approveExactAmount,
    approveUnlimitedAmount,
    isPending,
    isSuccess,
  } = useTokenApproval({
    token,
    amount,
    spender,
    chainId,
    owner,
    enabled: true,
  });

  // Handle approval success
  React.useEffect(() => {
    if (isSuccess && onApprovalSuccess) {
      onApprovalSuccess();
    }
  }, [isSuccess, onApprovalSuccess]);

  const handleMenuOpen = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  }, []);

  const handleMenuClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const handleApproval = useCallback(
    async (type: "exact" | "unlimited") => {
      setSelectedOption(type);
      handleMenuClose();

      try {
        if (type === "exact") {
          await approveExactAmount();
        } else {
          await approveUnlimitedAmount();
        }
      } catch (error) {
        console.error("Approval failed:", error);
      }
    },
    [approveExactAmount, approveUnlimitedAmount, handleMenuClose]
  );

  const formatAmount = (amount: SimpleAmount): string => {
    try {
      return amount.toSignificant(6);
    } catch {
      return "0";
    }
  };

  // Don't render if already approved
  if (approvalState === ApprovalState.APPROVED) {
    return null;
  }

  // Loading state
  if (approvalState === ApprovalState.LOADING) {
    return (
      <Button
        fullWidth
        size="large"
        disabled
        className={className}
        sx={{
          py: 1.5,
          backgroundColor: "#1E293B",
          color: "#94A3B8",
          "&:disabled": {
            backgroundColor: "#1E293B",
            color: "#94A3B8",
          },
        }}
      >
        <CircularProgress size={20} sx={{ mr: 1, color: "#00F5E0" }} />
        Checking allowance...
      </Button>
    );
  }

  // Pending state
  if (approvalState === ApprovalState.PENDING || isPending) {
    return (
      <Button
        fullWidth
        size="large"
        disabled
        className={className}
        sx={{
          py: 1.5,
          backgroundColor: "#1E293B",
          color: "#94A3B8",
          "&:disabled": {
            backgroundColor: "#1E293B",
            color: "#94A3B8",
          },
        }}
      >
        <CircularProgress size={20} sx={{ mr: 1, color: "#00F5E0" }} />
        {selectedOption === "exact" ? "Approving..." : "Approving unlimited..."}
      </Button>
    );
  }

  return (
    <>
      <Button
        fullWidth
        size="large"
        disabled={disabled}
        onClick={handleMenuOpen}
        endIcon={<ArrowDropDownIcon />}
        className={className}
        sx={{
          py: 1.5,
          backgroundColor: "#3B82F6",
          color: "white",
          fontWeight: 600,
          fontSize: "16px",
          textTransform: "none",
          "&:hover": {
            backgroundColor: "#2563EB",
          },
          "&:disabled": {
            backgroundColor: "#374151",
            color: "#9CA3AF",
          },
        }}
      >
        Approve {token.ticker}
      </Button>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            backgroundColor: "#1E293B",
            border: "1px solid #334155",
            borderRadius: "12px",
            mt: 1,
            minWidth: 320,
          },
        }}
      >
        <MenuItem
          onClick={() => handleApproval("exact")}
          sx={{
            py: 2,
            px: 3,
            backgroundColor:
              selectedOption === "exact"
                ? "rgba(0, 245, 224, 0.1)"
                : "transparent",
            "&:hover": {
              backgroundColor: "rgba(0, 245, 224, 0.05)",
            },
          }}
        >
          <ListItemIcon sx={{ color: "#00F5E0", minWidth: 36 }}>
            <CheckIcon />
          </ListItemIcon>
          <Box>
            <ListItemText
              primary="Approve one-time only"
              primaryTypographyProps={{
                color: "white",
                fontWeight: 500,
                fontSize: "14px",
              }}
            />
            <Typography
              variant="caption"
              sx={{
                color: "#94A3B8",
                fontSize: "12px",
                display: "block",
                mt: 0.5,
              }}
            >
              You'll give your approval to spend {formatAmount(amount)}{" "}
              {token.ticker} on your behalf
            </Typography>
          </Box>
        </MenuItem>

        <Divider sx={{ backgroundColor: "#334155", my: 0.5 }} />

        <MenuItem
          onClick={() => handleApproval("unlimited")}
          sx={{
            py: 2,
            px: 3,
            backgroundColor:
              selectedOption === "unlimited"
                ? "rgba(0, 245, 224, 0.1)"
                : "transparent",
            "&:hover": {
              backgroundColor: "rgba(0, 245, 224, 0.05)",
            },
          }}
        >
          <ListItemIcon sx={{ color: "#94A3B8", minWidth: 36 }}>
            <InfoIcon />
          </ListItemIcon>
          <Box>
            <ListItemText
              primary="Approve unlimited amount"
              primaryTypographyProps={{
                color: "white",
                fontWeight: 500,
                fontSize: "14px",
              }}
            />
            <Typography
              variant="caption"
              sx={{
                color: "#94A3B8",
                fontSize: "12px",
                display: "block",
                mt: 0.5,
              }}
            >
              You won't need to approve again next time you want to spend{" "}
              {token.ticker}.
            </Typography>
          </Box>
        </MenuItem>
      </Menu>
    </>
  );
};
