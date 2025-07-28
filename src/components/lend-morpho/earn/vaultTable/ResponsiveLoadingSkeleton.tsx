import React from "react";
import {
  Box,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import GlowBox from "@/components/common/ui/GlowBox";

const ResponsiveLoadingSkeleton: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  if (isMobile) {
    // Mobile Card Skeleton
    return (
      <GlowBox>
        <Box sx={{ p: 2 }}>
          {Array.from({ length: 5 }).map((_, index) => (
            <Box
              key={index}
              sx={{
                backgroundColor: "rgba(31, 41, 55, 0.8)",
                borderRadius: 2,
                p: 3,
                mb: 2,
                border: "1px solid rgba(55, 65, 81, 0.3)",
              }}
            >
              {/* Header */}
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <Skeleton
                  variant="circular"
                  width={40}
                  height={40}
                  sx={{ mr: 2, bgcolor: "rgba(55, 65, 81, 0.5)" }}
                />
                <Box sx={{ flex: 1 }}>
                  <Skeleton
                    width="60%"
                    height={24}
                    sx={{ bgcolor: "rgba(55, 65, 81, 0.5)", mb: 0.5 }}
                  />
                  <Skeleton
                    width="40%"
                    height={16}
                    sx={{ bgcolor: "rgba(55, 65, 81, 0.5)" }}
                  />
                </Box>
                <Skeleton
                  variant="rectangular"
                  width={70}
                  height={32}
                  sx={{ bgcolor: "rgba(55, 65, 81, 0.5)", borderRadius: 1 }}
                />
              </Box>

              {/* Stats */}
              <Box
                sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}
              >
                <Box>
                  <Skeleton
                    width={80}
                    height={24}
                    sx={{ bgcolor: "rgba(55, 65, 81, 0.5)", mb: 0.5 }}
                  />
                  <Skeleton
                    width={60}
                    height={16}
                    sx={{ bgcolor: "rgba(55, 65, 81, 0.5)" }}
                  />
                </Box>
                <Box sx={{ textAlign: "right" }}>
                  <Skeleton
                    width={60}
                    height={24}
                    sx={{ bgcolor: "rgba(55, 65, 81, 0.5)", mb: 0.5 }}
                  />
                  <Skeleton
                    width={40}
                    height={16}
                    sx={{ bgcolor: "rgba(55, 65, 81, 0.5)" }}
                  />
                </Box>
              </Box>

              {/* Curator */}
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <Skeleton
                  variant="circular"
                  width={24}
                  height={24}
                  sx={{ mr: 1.5, bgcolor: "rgba(55, 65, 81, 0.5)" }}
                />
                <Skeleton
                  width={100}
                  height={16}
                  sx={{ bgcolor: "rgba(55, 65, 81, 0.5)" }}
                />
              </Box>

              {/* Collateral */}
              <Box>
                <Skeleton
                  width={60}
                  height={12}
                  sx={{ bgcolor: "rgba(55, 65, 81, 0.5)", mb: 1 }}
                />
                <Box sx={{ display: "flex", gap: 0.5 }}>
                  <Skeleton
                    variant="rectangular"
                    width={50}
                    height={24}
                    sx={{ bgcolor: "rgba(55, 65, 81, 0.5)", borderRadius: 3 }}
                  />
                  <Skeleton
                    variant="rectangular"
                    width={50}
                    height={24}
                    sx={{ bgcolor: "rgba(55, 65, 81, 0.5)", borderRadius: 3 }}
                  />
                  <Skeleton
                    variant="rectangular"
                    width={30}
                    height={24}
                    sx={{ bgcolor: "rgba(55, 65, 81, 0.5)", borderRadius: 3 }}
                  />
                </Box>
              </Box>
            </Box>
          ))}
        </Box>
      </GlowBox>
    );
  }

  // Desktop/Tablet Table Skeleton
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
          <TableHead
            sx={{
              backgroundColor: "secondary.light",
              padding: "0px",
              borderRadius: "32px !important",
            }}
          >
            <TableRow>
              <TableCell
                sx={{
                  color: "text.primary",
                  borderBottom: "1px solid rgba(55, 65, 81, 0.5)",
                  backgroundColor: "transparent",
                  fontSize: "1rem",
                  fontWeight: 500,
                  py: 2,
                }}
              >
                Vault
              </TableCell>
              <TableCell
                sx={{
                  color: "text.primary",
                  borderBottom: "1px solid rgba(55, 65, 81, 0.5)",
                  backgroundColor: "transparent",
                  fontSize: "1rem",
                  fontWeight: 500,
                  py: 2,
                }}
              >
                Deposits
              </TableCell>
              <TableCell
                sx={{
                  color: "text.primary",
                  borderBottom: "1px solid rgba(55, 65, 81, 0.5)",
                  backgroundColor: "transparent",
                  fontSize: "1rem",
                  fontWeight: 500,
                  py: 2,
                }}
              >
                Curator
              </TableCell>
              <TableCell
                sx={{
                  color: "text.primary",
                  borderBottom: "1px solid rgba(55, 65, 81, 0.5)",
                  backgroundColor: "transparent",
                  fontSize: "1rem",
                  fontWeight: 500,
                  py: 2,
                }}
              >
                Collateral
              </TableCell>
              <TableCell
                sx={{
                  color: "text.primary",
                  borderBottom: "1px solid rgba(55, 65, 81, 0.5)",
                  backgroundColor: "transparent",
                  fontSize: "1rem",
                  fontWeight: 500,
                  py: 2,
                }}
              >
                APY
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {Array.from({ length: 8 }).map((_, index) => (
              <TableRow key={index}>
                {/* Vault */}
                <TableCell
                  sx={{
                    color: "white",
                    borderBottom: "1px solid rgba(55, 65, 81, 0.3)",
                    py: 2.5,
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <Skeleton
                      variant="circular"
                      width={32}
                      height={32}
                      sx={{ mr: 2, bgcolor: "rgba(55, 65, 81, 0.5)" }}
                    />
                    <Box>
                      <Skeleton
                        width={120}
                        height={20}
                        sx={{ bgcolor: "rgba(55, 65, 81, 0.5)", mb: 0.5 }}
                      />
                      <Skeleton
                        width={80}
                        height={14}
                        sx={{ bgcolor: "rgba(55, 65, 81, 0.5)" }}
                      />
                    </Box>
                  </Box>
                </TableCell>

                {/* Deposits */}
                <TableCell
                  sx={{
                    color: "white",
                    borderBottom: "1px solid rgba(55, 65, 81, 0.3)",
                    py: 2.5,
                  }}
                >
                  <Box>
                    <Skeleton
                      width={80}
                      height={20}
                      sx={{ bgcolor: "rgba(55, 65, 81, 0.5)", mb: 0.5 }}
                    />
                    <Skeleton
                      width={60}
                      height={14}
                      sx={{ bgcolor: "rgba(55, 65, 81, 0.5)" }}
                    />
                  </Box>
                </TableCell>

                {/* Curator */}
                <TableCell
                  sx={{
                    color: "white",
                    borderBottom: "1px solid rgba(55, 65, 81, 0.3)",
                    py: 2.5,
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <Skeleton
                      variant="circular"
                      width={24}
                      height={24}
                      sx={{ mr: 1.5, bgcolor: "rgba(55, 65, 81, 0.5)" }}
                    />
                    <Skeleton
                      width={100}
                      height={16}
                      sx={{ bgcolor: "rgba(55, 65, 81, 0.5)" }}
                    />
                  </Box>
                </TableCell>

                {/* Collateral */}
                <TableCell
                  sx={{
                    color: "white",
                    borderBottom: "1px solid rgba(55, 65, 81, 0.3)",
                    py: 2.5,
                  }}
                >
                  <Box sx={{ display: "flex", gap: 0.5 }}>
                    <Skeleton
                      variant="rectangular"
                      width={50}
                      height={24}
                      sx={{ bgcolor: "rgba(55, 65, 81, 0.5)", borderRadius: 3 }}
                    />
                    <Skeleton
                      variant="rectangular"
                      width={50}
                      height={24}
                      sx={{ bgcolor: "rgba(55, 65, 81, 0.5)", borderRadius: 3 }}
                    />
                    <Skeleton
                      variant="rectangular"
                      width={30}
                      height={24}
                      sx={{ bgcolor: "rgba(55, 65, 81, 0.5)", borderRadius: 3 }}
                    />
                  </Box>
                </TableCell>

                {/* APY */}
                <TableCell
                  sx={{
                    color: "white",
                    borderBottom: "1px solid rgba(55, 65, 81, 0.3)",
                    py: 2.5,
                  }}
                >
                  <Box>
                    <Skeleton
                      width={60}
                      height={20}
                      sx={{ bgcolor: "rgba(55, 65, 81, 0.5)", mb: 0.5 }}
                    />
                    <Skeleton
                      width={50}
                      height={14}
                      sx={{ bgcolor: "rgba(55, 65, 81, 0.5)" }}
                    />
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </GlowBox>
  );
};

export default ResponsiveLoadingSkeleton;
