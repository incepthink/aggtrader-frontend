// components/lend/markets/LoadingSkeleton.tsx
import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Skeleton,
  Box,
} from "@mui/material";
import GlowBox from "@/components/common/ui/GlowBox";

const LoadingSkeleton: React.FC = () => {
  return (
    <GlowBox>
      <TableContainer
        component={Paper}
        sx={{
          backgroundColor: "rgba(30, 41, 59, 0.4)",
          boxShadow: "none",
          borderRadius: 0,
        }}
      >
        <Table>
          <TableHead>
            <TableRow>
              <TableCell
                sx={{
                  color: "#9CA3AF",
                  borderBottom: "1px solid rgba(55, 65, 81, 0.5)",
                  backgroundColor: "transparent",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  py: 2,
                }}
              >
                Collateral
              </TableCell>
              <TableCell
                sx={{
                  color: "#9CA3AF",
                  borderBottom: "1px solid rgba(55, 65, 81, 0.5)",
                  backgroundColor: "transparent",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  py: 2,
                }}
              >
                Loan
              </TableCell>
              <TableCell
                sx={{
                  color: "#9CA3AF",
                  borderBottom: "1px solid rgba(55, 65, 81, 0.5)",
                  backgroundColor: "transparent",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  py: 2,
                }}
              >
                LLTV
              </TableCell>
              <TableCell
                sx={{
                  color: "#9CA3AF",
                  borderBottom: "1px solid rgba(55, 65, 81, 0.5)",
                  backgroundColor: "transparent",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  py: 2,
                }}
              >
                Total Market Size
              </TableCell>
              <TableCell
                sx={{
                  color: "#9CA3AF",
                  borderBottom: "1px solid rgba(55, 65, 81, 0.5)",
                  backgroundColor: "transparent",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  py: 2,
                }}
              >
                Total Liquidity
              </TableCell>
              <TableCell
                sx={{
                  color: "#9CA3AF",
                  borderBottom: "1px solid rgba(55, 65, 81, 0.5)",
                  backgroundColor: "transparent",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  py: 2,
                }}
              >
                Borrow Rate
              </TableCell>
              <TableCell
                sx={{
                  color: "#9CA3AF",
                  borderBottom: "1px solid rgba(55, 65, 81, 0.5)",
                  backgroundColor: "transparent",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  py: 2,
                }}
              >
                Vault Listing
              </TableCell>
              <TableCell
                sx={{
                  color: "#9CA3AF",
                  borderBottom: "1px solid rgba(55, 65, 81, 0.5)",
                  backgroundColor: "transparent",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  py: 2,
                }}
              ></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Array.from({ length: 10 }).map((_, index) => (
              <TableRow
                key={index}
                sx={{
                  "&:hover": {
                    backgroundColor: "rgba(55, 65, 81, 0.3)",
                  },
                  borderBottom:
                    index === 9 ? "none" : "1px solid rgba(55, 65, 81, 0.3)",
                }}
              >
                <TableCell
                  sx={{
                    color: "white",
                    borderBottom: "none",
                    py: 2,
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Skeleton
                      variant="circular"
                      width={24}
                      height={24}
                      sx={{ bgcolor: "rgba(55, 65, 81, 0.3)" }}
                    />
                    <Skeleton
                      variant="text"
                      width={80}
                      sx={{ bgcolor: "rgba(55, 65, 81, 0.3)" }}
                    />
                  </Box>
                </TableCell>
                <TableCell
                  sx={{
                    color: "white",
                    borderBottom: "none",
                    py: 2,
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Skeleton
                      variant="circular"
                      width={24}
                      height={24}
                      sx={{ bgcolor: "rgba(55, 65, 81, 0.3)" }}
                    />
                    <Skeleton
                      variant="text"
                      width={80}
                      sx={{ bgcolor: "rgba(55, 65, 81, 0.3)" }}
                    />
                  </Box>
                </TableCell>
                <TableCell
                  sx={{
                    color: "white",
                    borderBottom: "none",
                    py: 2,
                  }}
                >
                  <Skeleton
                    variant="text"
                    width={60}
                    sx={{ bgcolor: "rgba(55, 65, 81, 0.3)" }}
                  />
                </TableCell>
                <TableCell
                  sx={{
                    color: "white",
                    borderBottom: "none",
                    py: 2,
                  }}
                >
                  <Box>
                    <Skeleton
                      variant="text"
                      width={120}
                      sx={{ bgcolor: "rgba(55, 65, 81, 0.3)" }}
                    />
                    <Skeleton
                      variant="text"
                      width={80}
                      sx={{ bgcolor: "rgba(55, 65, 81, 0.3)" }}
                    />
                  </Box>
                </TableCell>
                <TableCell
                  sx={{
                    color: "white",
                    borderBottom: "none",
                    py: 2,
                  }}
                >
                  <Box>
                    <Skeleton
                      variant="text"
                      width={120}
                      sx={{ bgcolor: "rgba(55, 65, 81, 0.3)" }}
                    />
                    <Skeleton
                      variant="text"
                      width={80}
                      sx={{ bgcolor: "rgba(55, 65, 81, 0.3)" }}
                    />
                  </Box>
                </TableCell>
                <TableCell
                  sx={{
                    color: "white",
                    borderBottom: "none",
                    py: 2,
                  }}
                >
                  <Skeleton
                    variant="rounded"
                    width={60}
                    height={24}
                    sx={{ bgcolor: "rgba(55, 65, 81, 0.3)" }}
                  />
                </TableCell>
                <TableCell
                  sx={{
                    color: "white",
                    borderBottom: "none",
                    py: 2,
                  }}
                >
                  <Skeleton
                    variant="rounded"
                    width={40}
                    height={20}
                    sx={{ bgcolor: "rgba(55, 65, 81, 0.3)" }}
                  />
                </TableCell>
                <TableCell
                  sx={{
                    color: "white",
                    borderBottom: "none",
                    py: 2,
                  }}
                >
                  <Skeleton
                    variant="circular"
                    width={20}
                    height={20}
                    sx={{ bgcolor: "rgba(55, 65, 81, 0.3)" }}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </GlowBox>
  );
};

export default LoadingSkeleton;
