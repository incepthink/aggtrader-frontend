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
} from "@mui/material";
import GlowBox from "@/components/common/ui/GlowBox";

const LoadingSkeleton: React.FC = () => {
  return (
    <GlowBox>
      <TableContainer
        component={Paper}
        sx={{
          backgroundColor: "transparent",
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
                Vault
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
                Deposits
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
                Curator
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
                APY
              </TableCell>
              <TableCell
                sx={{
                  color: "#9CA3AF",
                  borderBottom: "1px solid rgba(55, 65, 81, 0.5)",
                  backgroundColor: "transparent",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  py: 2,
                  width: 120,
                }}
              />
            </TableRow>
          </TableHead>
          <TableBody>
            {Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell
                  sx={{
                    borderBottom: "1px solid rgba(55, 65, 81, 0.3)",
                    py: 2,
                  }}
                >
                  <Skeleton
                    variant="rectangular"
                    width="100%"
                    height={40}
                    sx={{ bgcolor: "rgba(55, 65, 81, 0.3)", borderRadius: 1 }}
                  />
                </TableCell>
                <TableCell
                  sx={{
                    borderBottom: "1px solid rgba(55, 65, 81, 0.3)",
                    py: 2,
                  }}
                >
                  <Skeleton
                    variant="rectangular"
                    width="100%"
                    height={40}
                    sx={{ bgcolor: "rgba(55, 65, 81, 0.3)", borderRadius: 1 }}
                  />
                </TableCell>
                <TableCell
                  sx={{
                    borderBottom: "1px solid rgba(55, 65, 81, 0.3)",
                    py: 2,
                  }}
                >
                  <Skeleton
                    variant="rectangular"
                    width="100%"
                    height={40}
                    sx={{ bgcolor: "rgba(55, 65, 81, 0.3)", borderRadius: 1 }}
                  />
                </TableCell>
                <TableCell
                  sx={{
                    borderBottom: "1px solid rgba(55, 65, 81, 0.3)",
                    py: 2,
                  }}
                >
                  <Skeleton
                    variant="rectangular"
                    width="100%"
                    height={40}
                    sx={{ bgcolor: "rgba(55, 65, 81, 0.3)", borderRadius: 1 }}
                  />
                </TableCell>
                <TableCell
                  sx={{
                    borderBottom: "1px solid rgba(55, 65, 81, 0.3)",
                    py: 2,
                  }}
                >
                  <Skeleton
                    variant="rectangular"
                    width="100%"
                    height={40}
                    sx={{ bgcolor: "rgba(55, 65, 81, 0.3)", borderRadius: 1 }}
                  />
                </TableCell>
                <TableCell
                  sx={{
                    borderBottom: "1px solid rgba(55, 65, 81, 0.3)",
                    py: 2,
                  }}
                >
                  <Skeleton
                    variant="rectangular"
                    width={100}
                    height={36}
                    sx={{ bgcolor: "rgba(55, 65, 81, 0.3)", borderRadius: 1 }}
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
