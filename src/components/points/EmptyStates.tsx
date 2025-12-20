import React from "react";
import { Box, Typography, Container, CircularProgress } from "@mui/material";

export const NotConnectedState: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-900">
      <Container maxWidth="xl" sx={{ py: { xs: 4, sm: 6, lg: 10 } }}>
        <Box
          display="flex"
          alignItems="center"
          justifyContent="center"
          minHeight="60vh"
        >
          <Typography
            variant="h3"
            component="h1"
            textAlign="center"
            sx={{
              fontSize: { xs: "2rem", sm: "2.5rem", lg: "3rem" },
              fontWeight: 600,
              color: "white"
            }}
          >
            Connect Your Wallet
          </Typography>
        </Box>
      </Container>
    </div>
  );
};

export const LoadingState: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-900">
      <Container maxWidth="xl" sx={{ py: { xs: 4, sm: 6, lg: 10 } }}>
        <Box
          display="flex"
          alignItems="center"
          justifyContent="center"
          minHeight="60vh"
          flexDirection="column"
          gap={2}
        >
          <CircularProgress sx={{ color: "#00F5E0" }} size={60} />
          <Typography variant="h6" color="white">
            Loading XP data...
          </Typography>
        </Box>
      </Container>
    </div>
  );
};

interface ErrorStateProps {
  error: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ error }) => {
  return (
    <div className="min-h-screen bg-gray-900">
      <Container maxWidth="xl" sx={{ py: { xs: 4, sm: 6, lg: 10 } }}>
        <Box
          display="flex"
          alignItems="center"
          justifyContent="center"
          minHeight="60vh"
          flexDirection="column"
          gap={2}
        >
          <Typography
            variant="h5"
            textAlign="center"
            sx={{ color: "#ff6b6b", mb: 2 }}
          >
            {error}
          </Typography>
          <Typography variant="body1" color="white" textAlign="center">
            {error.includes("No XP data")
              ? "Start trading to earn XP!"
              : "Please try again later."}
          </Typography>
        </Box>
      </Container>
    </div>
  );
};

export const NoWeeklyDataState: React.FC = () => {
  return (
    <Box className="neon-panel" textAlign="center" py={6}>
      <Typography variant="h6" color="white">
        No weekly data available yet.
      </Typography>
      <Typography
        variant="body1"
        sx={{ color: "rgba(255,255,255,0.7)", mt: 1 }}
      >
        Start trading to earn XP!
      </Typography>
    </Box>
  );
};
