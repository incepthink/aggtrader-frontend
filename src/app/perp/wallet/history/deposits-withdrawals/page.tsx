"use client";

import { Box, Typography } from "@mui/material";
import { useAccount } from "wagmi";
import { DepositsWithdrawalsTable } from "@/components/perp/wallet/DepositsWithdrawalsTable";
import { useKatanaPerpsDepositsWithdrawals } from "@/hooks/perp/useKatanaPerpsDepositsWithdrawals";
import { Button } from "@mui/material";

export default function DepositsWithdrawalsPage() {
  const { isConnected } = useAccount();

  const {
    data: transactions = [],
    isLoading,
    isError,
    error,
  } = useKatanaPerpsDepositsWithdrawals();

  // Show connect wallet message if not connected
  if (!isConnected) {
    return (
      <Box>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            py: 1.5,
            px: 2,
            borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          <Typography
            sx={{ color: "#fff", fontSize: "1.125rem", fontWeight: 500 }}
          >
            Deposits & Withdrawals
          </Typography>
        </Box>
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            py: 8,
          }}
        >
          <Typography
            sx={{ color: "rgba(255, 255, 255, 0.5)", fontSize: "0.875rem" }}
          >
            Connect your wallet to view transaction history
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          py: 1.5,
          px: 2,
          borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Typography
            sx={{ color: "#fff", fontSize: "1.125rem", fontWeight: 500 }}
          >
            Deposits & Withdrawals
          </Typography>
          <Box
            sx={{
              px: 1,
              py: 0.25,
              borderRadius: 1,
              bgcolor: "rgba(0, 245, 224, 0.1)",
              color: "#00F5E0",
              fontSize: "0.75rem",
              fontWeight: 500,
            }}
          >
            {transactions.length}
          </Box>
        </Box>

        <Box sx={{ display: "flex", gap: 1.5 }}>
          <Button
            disabled
            sx={{
              px: 3,
              py: 0.75,
              background: "transparent",
              border: "1px solid rgba(255, 255, 255, 0.3)",
              color: "#fff",
              fontSize: "0.875rem",
              fontWeight: 500,
              textTransform: "none",
              borderRadius: "4px",
              minWidth: "100px",
              "&.Mui-disabled": {
                color: "rgba(255, 255, 255, 0.5)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
              },
            }}
          >
            Withdraw
          </Button>
          <Button
            disabled
            sx={{
              px: 3,
              py: 0.75,
              background: "transparent",
              border: "1px solid #00F5E0",
              color: "#00F5E0",
              fontSize: "0.875rem",
              fontWeight: 500,
              textTransform: "none",
              borderRadius: "4px",
              minWidth: "100px",
              "&.Mui-disabled": {
                color: "rgba(0, 245, 224, 0.5)",
                border: "1px solid rgba(0, 245, 224, 0.3)",
              },
            }}
          >
            Deposit
          </Button>
        </Box>
      </Box>

      {/* Table */}
      <Box>
        <DepositsWithdrawalsTable
          transactions={transactions}
          isLoading={isLoading}
          error={isError ? (error as Error) : null}
        />
      </Box>
    </Box>
  );
}
