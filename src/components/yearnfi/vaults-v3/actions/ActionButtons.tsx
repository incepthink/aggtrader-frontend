"use client";

import React from "react";
import { Button, Box } from "@mui/material";
import { useVaultActions } from "@/lib/yearnfi/lib/contexts/useVaultActions";
import { useAccount } from "wagmi";

export function ActionButtons() {
  const { address } = useAccount();
  const {
    amount,
    isDepositing,
    needsApproval,
    onApprove,
    isApproving,
    onDeposit,
    isDepositingTx,
    onWithdraw,
    isWithdrawingTx,
    expectedOut,
    isLoadingPreview,
  } = useVaultActions();

  const amountNum = parseFloat(amount || "0");
  const isDisabled =
    !address ||
    amountNum <= 0 ||
    expectedOut.raw === BigInt(0) ||
    isLoadingPreview;

  if (!address) {
    return (
      <Box
        sx={{
          display: "flex",
          width: { xs: "100%", md: "auto" },
          minWidth: { md: "200px" },
        }}
      >
        <Button
          fullWidth
          variant="contained"
          size="large"
          disabled
          sx={{
            bgcolor: "primary.main",
            "&.Mui-disabled": {
              bgcolor: "primary.main",
              opacity: 0.5,
              color: "white",
            },
          }}
        >
          Connect Wallet
        </Button>
      </Box>
    );
  }

  if (isDepositing && needsApproval) {
    return (
      <Box
        sx={{
          display: "flex",
          width: { xs: "100%", md: "auto" },
          minWidth: { md: "200px" },
        }}
      >
        <Button
          fullWidth
          variant="contained"
          size="large"
          onClick={onApprove}
          disabled={isDisabled || isApproving}
          sx={{
            bgcolor: "primary.main",
            "&.Mui-disabled": {
              bgcolor: "primary.main",
              opacity: 0.5,
              color: "white",
            },
          }}
        >
          {isApproving ? "Approving..." : "Approve"}
        </Button>
      </Box>
    );
  }

  if (isDepositing) {
    return (
      <Box
        sx={{
          display: "flex",
          width: { xs: "100%", md: "auto" },
          minWidth: { md: "200px" },
        }}
      >
        <Button
          fullWidth
          variant="contained"
          size="large"
          onClick={onDeposit}
          disabled={isDisabled || isDepositingTx}
          sx={{
            bgcolor: "primary.main",
            "&.Mui-disabled": {
              bgcolor: "primary.main",
              opacity: 0.5,
              color: "white",
            },
          }}
        >
          {isDepositingTx ? "Depositing..." : "Deposit"}
        </Button>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        width: { xs: "100%", md: "auto" },
        minWidth: { md: "200px" },
      }}
    >
      <Button
        fullWidth
        variant="contained"
        size="large"
        onClick={onWithdraw}
        disabled={isDisabled || isWithdrawingTx}
        sx={{
          bgcolor: "primary.main",
          "&.Mui-disabled": {
            bgcolor: "primary.main",
            opacity: 0.5,
            color: "white",
          },
        }}
      >
        {isWithdrawingTx ? "Withdrawing..." : "Withdraw"}
      </Button>
    </Box>
  );
}
