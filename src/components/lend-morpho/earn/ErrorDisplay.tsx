"use client";

import React from "react";
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  Alert,
} from "@mui/material";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import RefreshIcon from "@mui/icons-material/Refresh";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useRouter } from "next/navigation";

interface ErrorDisplayProps {
  error?: string;
  title?: string;
  showBackButton?: boolean;
  showRetryButton?: boolean;
  onRetry?: () => void;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error = "An unexpected error occurred",
  title = "Error loading vault",
  showBackButton = true,
  showRetryButton = true,
  onRetry,
}) => {
  const router = useRouter();

  const handleGoBack = () => {
    router.back();
  };

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Paper
        sx={{
          p: 6,
          backgroundColor: "#1a1d29",
          borderRadius: 3,
          textAlign: "center",
          border: "1px solid #2d3748",
        }}
      >
        {/* Error Icon */}
        <Box
          sx={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 80,
            height: 80,
            borderRadius: "50%",
            backgroundColor: "#2d1b1b",
            mb: 3,
          }}
        >
          <ErrorOutlineIcon
            sx={{
              fontSize: 40,
              color: "#f44336",
            }}
          />
        </Box>

        {/* Error Title */}
        <Typography
          variant="h4"
          sx={{
            color: "white",
            fontWeight: "bold",
            mb: 2,
          }}
        >
          {title}
        </Typography>

        {/* Error Message */}
        <Typography
          variant="body1"
          sx={{
            color: "#8b949e",
            mb: 4,
            lineHeight: 1.6,
            maxWidth: "500px",
            mx: "auto",
          }}
        >
          {error}
        </Typography>

        {/* Error Alert */}
        <Alert
          severity="error"
          sx={{
            backgroundColor: "#2d1b1b",
            border: "1px solid #f44336",
            color: "#f44336",
            mb: 4,
            "& .MuiAlert-icon": {
              color: "#f44336",
            },
          }}
        >
          <Typography variant="body2">
            If this problem persists, please try refreshing the page or contact
            support.
          </Typography>
        </Alert>

        {/* Action Buttons */}
        <Box
          sx={{
            display: "flex",
            gap: 2,
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          {showRetryButton && (
            <Button
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={handleRetry}
              sx={{
                backgroundColor: "#3b82f6",
                color: "white",
                px: 4,
                py: 1.5,
                borderRadius: 2,
                textTransform: "none",
                fontSize: "16px",
                fontWeight: "medium",
                "&:hover": {
                  backgroundColor: "#2563eb",
                },
              }}
            >
              Try Again
            </Button>
          )}

          {showBackButton && (
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={handleGoBack}
              sx={{
                borderColor: "#2d3748",
                color: "#8b949e",
                px: 4,
                py: 1.5,
                borderRadius: 2,
                textTransform: "none",
                fontSize: "16px",
                fontWeight: "medium",
                "&:hover": {
                  borderColor: "#3b82f6",
                  color: "white",
                  backgroundColor: "rgba(59, 130, 246, 0.1)",
                },
              }}
            >
              Go Back
            </Button>
          )}
        </Box>

        {/* Additional Help */}
        <Box sx={{ mt: 4, pt: 4, borderTop: "1px solid #2d3748" }}>
          <Typography variant="body2" sx={{ color: "#6b7280", mb: 2 }}>
            Need help? Here are some things you can try:
          </Typography>

          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 1,
              alignItems: "center",
            }}
          >
            <Typography variant="caption" sx={{ color: "#8b949e" }}>
              • Check your internet connection
            </Typography>
            <Typography variant="caption" sx={{ color: "#8b949e" }}>
              • Verify the vault address is correct
            </Typography>
            <Typography variant="caption" sx={{ color: "#8b949e" }}>
              • Try switching to a different network if needed
            </Typography>
            <Typography variant="caption" sx={{ color: "#8b949e" }}>
              • Contact support if the issue persists
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default ErrorDisplay;
