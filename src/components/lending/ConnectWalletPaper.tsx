import { CircularProgress, Paper, PaperProps, Typography } from "@mui/material";
import { ReactNode } from "react";

import { GradientConnectButton } from "../common/navbar/Navbar";

interface ConnectWalletPaperProps extends PaperProps {
  description?: ReactNode;
}

export const ConnectWalletPaper = ({
  description,
  sx,
  ...rest
}: ConnectWalletPaperProps) => {
  return (
    <Paper
      {...rest}
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        p: 10,
        flex: 1,
        ...sx,
        backgroundColor: "transparent",
        boxShadow: "inset 0px 4px 34px rgba(0, 255, 233, 0.4)",
      }}
    >
      <>
        <Typography variant="h2" sx={{ mb: 2 }}>
          <span>Please, connect your wallet</span>
        </Typography>
        <Typography sx={{ mb: 6 }} color="text.secondary">
          {description || (
            <span>
              Please connect your wallet to see your supplies, borrowings, and
              open positions.
            </span>
          )}
        </Typography>
        <GradientConnectButton />
      </>
    </Paper>
  );
};
