"use client";

import { Box, Button, useMediaQuery, useTheme } from "@mui/material";
import { useAccount } from "wagmi";
import SuppliedPositionsList from "./lists/main/SuppliedPositionsList";
import SupplyAssetsList from "./lists/main/SupplyAssetsList";
import BorrowedPositionsList from "./lists/main/BorrowedPositionsList";
import BorrowAssetsList from "./lists/main/BorrowAssetsList";

interface DashboardContentWrapperProps {
  isBorrow: boolean;
}

export const DashboardContentWrapper = ({
  isBorrow,
}: DashboardContentWrapperProps) => {
  const { breakpoints } = useTheme();

  const isDesktop = useMediaQuery(breakpoints.up("lg"));
  const paperWidth = isDesktop ? "calc(50% - 8px)" : "100%";

  return (
    <Box>
      <Box
        sx={{
          display: isDesktop ? "flex" : "block",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <Box
          sx={{
            position: "relative",

            display: { xs: isBorrow ? "none" : "block", lg: "block" },
            width: paperWidth,
          }}
        >
          {/* {isConnected && !isBorrow && downToLg && (
            <Box
              sx={{
                position: { xs: 'static', md: 'relative' },
                display: 'flex',
                justifyContent: 'flex-end',
                mb: { xs: 2, md: 0 },
              }}
            >
              <Button
                sx={{
                  position: { xs: 'static', md: 'absolute' },
                  top: { xs: 'auto', md: '-130px' },
                  right: { xs: 'auto', md: '0px' },
                }}
                onClick={() => {
                  router.push(ROUTES.history);
                }}
                component="a"
                variant="surface"
                size="small"
              >
                <Trans>View Transactions</Trans>
              </Button>
            </Box>
          )} */}

          <SuppliedPositionsList />
          <SupplyAssetsList />
        </Box>

        <Box
          sx={{
            position: "relative",

            display: { xs: !isBorrow ? "none" : "block", lg: "block" },
            width: paperWidth,
          }}
        >
          {/* {isConnected && (
            <Box
              sx={{
                position: { xs: 'static', md: 'absolute' },
                top: { xs: 'auto', md: downToLg ? '-130px' : '-90px' },
                right: { xs: 'auto', md: '0px' },
                mb: { xs: 2, md: 0 },
              }}
            >
              <Button
                onClick={() => {
                  router.push(ROUTES.history);
                }}
                component="a"
                sx={{
                  border: '1px solid rgba(0, 255, 233, 0.5)',
                  backgroundColor: 'rgba(0, 255, 233, 0.3)',
                }}
                size="small"
              >
                <Trans>View Transactions</Trans>
              </Button>
            </Box>
          )} */}

          <BorrowedPositionsList />
          <BorrowAssetsList />
        </Box>
      </Box>
    </Box>
  );
};
