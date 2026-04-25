"use client";

import { Box, Button, Stack, Typography } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useAccount, useChainId } from "wagmi";
import GenericModal from "@/components/common/ui/GenericModal";
import { useTokenBalance } from "@/hooks/useTokenBalance";
import { useKatanaPerpsDeposit } from "@/hooks/perp/useKatanaPerpsDeposit";
import {
  KATANA_CHAIN_ID,
  VB_USDC_ADDRESS,
  VB_USDC_SYMBOL,
} from "@/utils/perp/katanaPerpsConstants";

interface DepositModalProps {
  open: boolean;
  onClose: () => void;
}

const sanitizeAmount = (raw: string) => {
  let cleaned = raw.replace(/[^0-9.]/g, "");
  const firstDot = cleaned.indexOf(".");
  if (firstDot !== -1) {
    cleaned =
      cleaned.slice(0, firstDot + 1) +
      cleaned.slice(firstDot + 1).replace(/\./g, "");
  }
  return cleaned;
};

const DepositModal = ({ open, onClose }: DepositModalProps) => {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { balance: walletBalance, formattedBalance, isLoading: isBalanceLoading } =
    useTokenBalance(VB_USDC_ADDRESS);

  const { deposit, isSubmitting, error, step, reset } = useKatanaPerpsDeposit();

  const [amount, setAmount] = useState("");

  // Reset local state when modal closes/opens
  useEffect(() => {
    if (!open) {
      setAmount("");
      reset();
    }
  }, [open, reset]);

  // Auto-close on success
  useEffect(() => {
    if (step === "success") {
      const t = setTimeout(() => {
        onClose();
      }, 1000);
      return () => clearTimeout(t);
    }
  }, [step, onClose]);

  const parsedAmount = Number(amount);
  const isAmountValid =
    !!amount && !Number.isNaN(parsedAmount) && parsedAmount > 0;
  const isOverBalance = isAmountValid && parsedAmount > walletBalance;
  const isWrongChain = isConnected && chainId !== KATANA_CHAIN_ID;

  const validationMessage = useMemo(() => {
    if (!isConnected) return "Connect your wallet to deposit";
    if (isWrongChain) return "Switch your wallet to Katana";
    if (amount && !isAmountValid) return "Enter a valid amount";
    if (isOverBalance) return "Insufficient balance";
    return null;
  }, [amount, isAmountValid, isConnected, isOverBalance, isWrongChain]);

  const canSubmit =
    isConnected &&
    !isWrongChain &&
    isAmountValid &&
    !isOverBalance &&
    !isSubmitting;

  const handleMax = () => {
    if (walletBalance > 0) setAmount(String(walletBalance));
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    await deposit(amount);
  };

  const primaryLabel = (() => {
    if (!isConnected) return "Connect wallet";
    if (isWrongChain) return "Switch to Katana";
    if (step === "approving") return `Approving ${VB_USDC_SYMBOL}…`;
    if (step === "depositing") return "Depositing…";
    if (step === "success") return "Deposited";
    return "Deposit";
  })();

  return (
    <GenericModal
      isOpen={open}
      onClose={onClose}
      title="Deposit"
      size="sm"
      closeOnBackdropClick={!isSubmitting}
    >
      <Stack spacing={2}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography
            sx={{ color: "rgba(255,255,255,0.6)", fontSize: "0.875rem" }}
          >
            Available
          </Typography>
          <Typography sx={{ color: "#fff", fontSize: "0.875rem" }}>
            {isBalanceLoading
              ? "…"
              : `${formattedBalance} ${VB_USDC_SYMBOL}`}
          </Typography>
        </Box>

        <Box
          sx={{
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: "6px",
            px: 1.5,
            py: 1,
            display: "flex",
            alignItems: "center",
            gap: 1,
            "&:focus-within": { borderColor: "#00F5E0" },
          }}
        >
          <input
            inputMode="decimal"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(sanitizeAmount(e.target.value))}
            disabled={isSubmitting}
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              color: "#fff",
              fontSize: "1.125rem",
              minWidth: 0,
            }}
          />
          <Typography
            sx={{ color: "rgba(255,255,255,0.6)", fontSize: "0.875rem" }}
          >
            {VB_USDC_SYMBOL}
          </Typography>
          <Button
            onClick={handleMax}
            disabled={isSubmitting || walletBalance <= 0}
            sx={{
              minWidth: 0,
              px: 1,
              py: 0.25,
              fontSize: "0.75rem",
              color: "#00F5E0",
              textTransform: "none",
              border: "1px solid rgba(0,245,224,0.4)",
              borderRadius: "4px",
              "&:hover": { background: "rgba(0,245,224,0.1)" },
            }}
          >
            Max
          </Button>
        </Box>

        {validationMessage && (
          <Typography
            sx={{ color: "#FFA500", fontSize: "0.8125rem", mt: -1 }}
          >
            {validationMessage}
          </Typography>
        )}

        {error && (
          <Typography sx={{ color: "#FF4444", fontSize: "0.8125rem" }}>
            {error}
          </Typography>
        )}

        {step === "success" && (
          <Typography sx={{ color: "#00FF88", fontSize: "0.8125rem" }}>
            Deposit confirmed
          </Typography>
        )}

        <Button
          onClick={handleSubmit}
          disabled={!canSubmit}
          sx={{
            width: "100%",
            py: 1.5,
            mt: 1,
            background: canSubmit ? "#00F5E0" : "transparent",
            border: "1px solid #00F5E0",
            color: canSubmit ? "#050C19" : "#fff",
            fontSize: "0.875rem",
            fontWeight: 600,
            textTransform: "none",
            borderRadius: "4px",
            "&:hover": {
              background: canSubmit ? "#00F5E0" : "rgba(0,245,224,0.1)",
              border: "1px solid #00F5E0",
            },
            "&.Mui-disabled": {
              color: "rgba(255,255,255,0.4)",
              border: "1px solid rgba(255,255,255,0.2)",
            },
          }}
        >
          {primaryLabel}
        </Button>
      </Stack>
    </GenericModal>
  );
};

export default DepositModal;
