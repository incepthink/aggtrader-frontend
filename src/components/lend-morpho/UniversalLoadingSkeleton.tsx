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

interface UniversalLoadingSkeletonProps {
  type?: "vaults" | "markets";
  mobileCardCount?: number;
  tableRowCount?: number;
}

const UniversalLoadingSkeleton: React.FC<UniversalLoadingSkeletonProps> = ({
  type = "vaults",
  mobileCardCount = 5,
  tableRowCount = 8,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  // Define headers based on type
  const headers = {
    vaults: ["Vault", "Deposits", "Curator", "Collateral", "APY"],
    markets: [
      "Collateral",
      "Loan",
      "LLTV",
      "Total Market Size",
      "Total Liquidity",
      "Borrow Rate",
      "Vault Listing",
    ],
  };

  if (isMobile) {
    // Mobile Card Skeleton
    return (
      <GlowBox>
        <Box sx={{ p: 2 }}>
          {Array.from({ length: mobileCardCount }).map((_, index) => (
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
                  width={type === "markets" ? 60 : 70}
                  height={32}
                  sx={{ bgcolor: "rgba(55, 65, 81, 0.5)", borderRadius: 1 }}
                />
              </Box>

              {type === "markets" && (
                /* Token pair for markets */
                <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
                  <Box sx={{ flex: 1 }}>
                    <Skeleton
                      width={60}
                      height={12}
                      sx={{ bgcolor: "rgba(55, 65, 81, 0.5)", mb: 0.5 }}
                    />
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <Skeleton
                        variant="circular"
                        width={24}
                        height={24}
                        sx={{ mr: 1, bgcolor: "rgba(55, 65, 81, 0.5)" }}
                      />
                      <Skeleton
                        width={50}
                        height={16}
                        sx={{ bgcolor: "rgba(55, 65, 81, 0.5)" }}
                      />
                    </Box>
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Skeleton
                      width={40}
                      height={12}
                      sx={{ bgcolor: "rgba(55, 65, 81, 0.5)", mb: 0.5 }}
                    />
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <Skeleton
                        variant="circular"
                        width={24}
                        height={24}
                        sx={{ mr: 1, bgcolor: "rgba(55, 65, 81, 0.5)" }}
                      />
                      <Skeleton
                        width={50}
                        height={16}
                        sx={{ bgcolor: "rgba(55, 65, 81, 0.5)" }}
                      />
                    </Box>
                  </Box>
                </Box>
              )}

              {/* Stats */}
              <Box
                sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}
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
                <Box sx={{ textAlign: "right" }}>
                  <Skeleton
                    width={60}
                    height={20}
                    sx={{ bgcolor: "rgba(55, 65, 81, 0.5)", mb: 0.5 }}
                  />
                  <Skeleton
                    width={40}
                    height={14}
                    sx={{ bgcolor: "rgba(55, 65, 81, 0.5)" }}
                  />
                </Box>
              </Box>

              {/* Additional content for different types */}
              {type === "vaults" && (
                /* Curator for vaults */
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
              )}

              {type === "markets" && (
                /* Liquidity for markets */
                <Box sx={{ mb: 2 }}>
                  <Skeleton
                    width={80}
                    height={12}
                    sx={{ bgcolor: "rgba(55, 65, 81, 0.5)", mb: 0.5 }}
                  />
                  <Skeleton
                    width={100}
                    height={16}
                    sx={{ bgcolor: "rgba(55, 65, 81, 0.5)", mb: 0.5 }}
                  />
                  <Skeleton
                    width={80}
                    height={12}
                    sx={{ bgcolor: "rgba(55, 65, 81, 0.5)" }}
                  />
                </Box>
              )}

              {/* Bottom section */}
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
              {headers[type].map((header, index) => (
                <TableCell
                  key={index}
                  sx={{
                    color: "text.primary",
                    borderBottom: "1px solid rgba(55, 65, 81, 0.5)",
                    backgroundColor: "transparent",
                    fontSize: "1rem",
                    fontWeight: 500,
                    py: 2,
                  }}
                >
                  {header}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {Array.from({ length: tableRowCount }).map((_, index) => (
              <TableRow key={index}>
                {headers[type].map((_, cellIndex) => (
                  <TableCell
                    key={cellIndex}
                    sx={{
                      color: "white",
                      borderBottom: "1px solid rgba(55, 65, 81, 0.3)",
                      py: 2.5,
                    }}
                  >
                    {/* Different skeleton patterns based on column type */}
                    {cellIndex === 0 && type === "vaults" && (
                      /* Vault column */
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
                    )}

                    {(cellIndex === 0 || cellIndex === 1) &&
                      type === "markets" && (
                        /* Token columns for markets */
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          <Skeleton
                            variant="circular"
                            width={24}
                            height={24}
                            sx={{ mr: 1, bgcolor: "rgba(55, 65, 81, 0.5)" }}
                          />
                          <Skeleton
                            width={60}
                            height={16}
                            sx={{ bgcolor: "rgba(55, 65, 81, 0.5)" }}
                          />
                        </Box>
                      )}

                    {((cellIndex === 1 && type === "vaults") ||
                      (cellIndex >= 3 &&
                        cellIndex <= 4 &&
                        type === "markets")) && (
                      /* Deposits/Market Size/Liquidity columns */
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
                    )}

                    {((cellIndex === 2 && type === "vaults") ||
                      (cellIndex === 2 && type === "markets")) && (
                      /* Curator/LLTV columns */
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        {type === "vaults" && (
                          <Skeleton
                            variant="circular"
                            width={24}
                            height={24}
                            sx={{ mr: 1.5, bgcolor: "rgba(55, 65, 81, 0.5)" }}
                          />
                        )}
                        <Skeleton
                          width={type === "vaults" ? 100 : 60}
                          height={16}
                          sx={{ bgcolor: "rgba(55, 65, 81, 0.5)" }}
                        />
                      </Box>
                    )}

                    {((cellIndex === 3 && type === "vaults") ||
                      (cellIndex >= 5 && type === "markets")) && (
                      /* Collateral/Borrow Rate/Vault Listing columns */
                      <Box sx={{ display: "flex", gap: 0.5 }}>
                        {cellIndex === 3 && type === "vaults" ? (
                          /* Collateral chips */
                          <>
                            <Skeleton
                              variant="rectangular"
                              width={50}
                              height={24}
                              sx={{
                                bgcolor: "rgba(55, 65, 81, 0.5)",
                                borderRadius: 3,
                              }}
                            />
                            <Skeleton
                              variant="rectangular"
                              width={50}
                              height={24}
                              sx={{
                                bgcolor: "rgba(55, 65, 81, 0.5)",
                                borderRadius: 3,
                              }}
                            />
                            <Skeleton
                              variant="rectangular"
                              width={30}
                              height={24}
                              sx={{
                                bgcolor: "rgba(55, 65, 81, 0.5)",
                                borderRadius: 3,
                              }}
                            />
                          </>
                        ) : (
                          /* Single chip/badge */
                          <Skeleton
                            variant="rectangular"
                            width={cellIndex === 5 ? 60 : 50}
                            height={24}
                            sx={{
                              bgcolor: "rgba(55, 65, 81, 0.5)",
                              borderRadius: 3,
                            }}
                          />
                        )}
                      </Box>
                    )}

                    {cellIndex === 4 && type === "vaults" && (
                      /* APY column */
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
                    )}

                    {/* Default fallback for any uncovered cases */}
                    {!(
                      (cellIndex === 0 && type === "vaults") ||
                      ((cellIndex === 0 || cellIndex === 1) &&
                        type === "markets") ||
                      (cellIndex === 1 && type === "vaults") ||
                      (cellIndex >= 3 &&
                        cellIndex <= 4 &&
                        type === "markets") ||
                      (cellIndex === 2 && type === "vaults") ||
                      (cellIndex === 2 && type === "markets") ||
                      (cellIndex === 3 && type === "vaults") ||
                      (cellIndex >= 5 && type === "markets") ||
                      (cellIndex === 4 && type === "vaults")
                    ) && (
                      <Skeleton
                        width={80}
                        height={20}
                        sx={{ bgcolor: "rgba(55, 65, 81, 0.5)" }}
                      />
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </GlowBox>
  );
};

export default UniversalLoadingSkeleton;
