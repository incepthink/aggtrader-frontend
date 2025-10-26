import { useState, useCallback } from "react";
import type { SnackbarSeverity } from "../types";

interface SnackbarState {
  open: boolean;
  message: string;
  severity: SnackbarSeverity;
}

export function useSwapState() {
  const [tokenOneAmount, setTokenOneAmount] = useState("");
  const [tokenTwoAmount, setTokenTwoAmount] = useState("");
  const [slippage, setSlippage] = useState<number>(2.5);
  const [isInitiatingSwap, setIsInitiatingSwap] = useState(false);

  const [snackbarState, setSnackbarState] = useState<SnackbarState>({
    open: false,
    message: "",
    severity: "info",
  });

  const showSnackbar = useCallback(
    (message: string, severity: SnackbarSeverity) => {
      setSnackbarState({
        open: true,
        message,
        severity,
      });
    },
    []
  );

  const closeSnackbar = useCallback(() => {
    setSnackbarState((prev) => ({ ...prev, open: false }));
  }, []);

  return {
    tokenOneAmount,
    tokenTwoAmount,
    slippage,
    isInitiatingSwap,
    snackbarState,
    setTokenOneAmount,
    setTokenTwoAmount,
    setSlippage,
    setIsInitiatingSwap,
    showSnackbar,
    closeSnackbar,
  };
}