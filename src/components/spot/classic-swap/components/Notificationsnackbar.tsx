import React, { memo } from "react";
import { Alert, Snackbar } from "@mui/material";
import type { SnackbarSeverity } from "../types";

interface NotificationSnackbarProps {
  open: boolean;
  message: string;
  severity: SnackbarSeverity;
  onClose: () => void;
}

export const NotificationSnackbar = memo(
  ({ open, message, severity, onClose }: NotificationSnackbarProps) => {
    return (
      <Snackbar
        open={open}
        autoHideDuration={4000}
        onClose={onClose}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        sx={{ mt: 8 }}
      >
        <Alert
          onClose={onClose}
          severity={severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {message}
        </Alert>
      </Snackbar>
    );
  }
);

NotificationSnackbar.displayName = "NotificationSnackbar";
