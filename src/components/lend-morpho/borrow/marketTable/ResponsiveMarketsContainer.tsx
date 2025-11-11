import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  Box,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import GlowBox from "@/components/common/ui/GlowBox";
import MarketRow from "./MarketRow";
import MarketMobileCard from "./MarketMobileCard";

interface ResponsiveMarketsContainerProps {
  paginatedMarkets: any[];
  filteredMarkets: any[];
  page: number;
  rowsPerPage: number;
  favorites: Set<string>;
  handleRowClick: (market: any) => void;
  toggleFavorite: (marketId: string, event: React.MouseEvent) => void;
  handleChangePage: (event: unknown, newPage: number) => void;
  handleChangeRowsPerPage: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const ResponsiveMarketsContainer: React.FC<ResponsiveMarketsContainerProps> = ({
  paginatedMarkets,
  filteredMarkets,
  page,
  rowsPerPage,
  favorites,
  handleRowClick,
  toggleFavorite,
  handleChangePage,
  handleChangeRowsPerPage,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md")); // Mobile and small tablet
  const isTablet = useMediaQuery(theme.breakpoints.between("md", "lg")); // Tablet

  // Mobile Layout (Card-based)
  if (isMobile) {
    return (
      <GlowBox>
        <Box sx={{ p: 2 }}>
          {paginatedMarkets.map((market: any, index: number) => (
            <MarketMobileCard
              key={market.uniqueKey}
              market={market}
              favorites={favorites}
              onMarketClick={handleRowClick}
              onToggleFavorite={toggleFavorite}
            />
          ))}

          {/* Mobile Pagination */}
          {filteredMarkets.length > rowsPerPage && (
            <Box sx={{ mt: 2 }}>
              <TablePagination
                component="div"
                count={filteredMarkets.length}
                page={page}
                onPageChange={handleChangePage}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                rowsPerPageOptions={[10, 25, 50]}
                sx={{
                  color: "#9CA3AF",
                  borderTop: "1px solid rgba(55, 65, 81, 0.3)",
                  backgroundColor: "transparent",
                  "& .MuiTablePagination-selectIcon": {
                    color: "#9CA3AF",
                  },
                  "& .MuiTablePagination-select": {
                    color: "#9CA3AF",
                  },
                  "& .MuiTablePagination-displayedRows": {
                    color: "#9CA3AF",
                  },
                  "& .MuiIconButton-root": {
                    color: "#9CA3AF",
                  },
                  "& .MuiIconButton-root.Mui-disabled": {
                    color: "rgba(156, 163, 175, 0.3)",
                  },
                }}
              />
            </Box>
          )}
        </Box>
      </GlowBox>
    );
  }

  // Desktop/Tablet Layout (Table with horizontal scroll on tablet)
  return (
    <GlowBox>
      <TableContainer
        component={Paper}
        sx={{
          backgroundColor: "transparent",
          boxShadow: "none",
          borderRadius: 0,
          // Add horizontal scroll for tablet sizes
          ...(isTablet && {
            overflowX: "auto",
            "&::-webkit-scrollbar": {
              height: "8px",
            },
            "&::-webkit-scrollbar-track": {
              background: "rgba(55, 65, 81, 0.3)",
              borderRadius: "4px",
            },
            "&::-webkit-scrollbar-thumb": {
              background: "rgba(156, 163, 175, 0.5)",
              borderRadius: "4px",
              "&:hover": {
                background: "rgba(156, 163, 175, 0.7)",
              },
            },
          }),
        }}
      >
        <Table sx={{ minWidth: isTablet ? 900 : "auto" }}>
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
                  minWidth: isTablet ? 120 : "auto",
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
                  minWidth: isTablet ? 100 : "auto",
                }}
              >
                Loan
              </TableCell>
              <TableCell
                sx={{
                  color: "text.primary",
                  borderBottom: "1px solid rgba(55, 65, 81, 0.5)",
                  backgroundColor: "transparent",
                  fontSize: "1rem",
                  fontWeight: 500,
                  py: 2,
                  minWidth: isTablet ? 80 : "auto",
                }}
              >
                LLTV
              </TableCell>
              <TableCell
                sx={{
                  color: "text.primary",
                  borderBottom: "1px solid rgba(55, 65, 81, 0.5)",
                  backgroundColor: "transparent",
                  fontSize: "1rem",
                  fontWeight: 500,
                  py: 2,
                  minWidth: isTablet ? 150 : "auto",
                }}
              >
                Total Market Size
              </TableCell>
              <TableCell
                sx={{
                  color: "text.primary",
                  borderBottom: "1px solid rgba(55, 65, 81, 0.5)",
                  backgroundColor: "transparent",
                  fontSize: "1rem",
                  fontWeight: 500,
                  py: 2,
                  minWidth: isTablet ? 150 : "auto",
                }}
              >
                Total Liquidity
              </TableCell>
              <TableCell
                sx={{
                  color: "text.primary",
                  borderBottom: "1px solid rgba(55, 65, 81, 0.5)",
                  backgroundColor: "transparent",
                  fontSize: "1rem",
                  fontWeight: 500,
                  py: 2,
                  minWidth: isTablet ? 120 : "auto",
                }}
              >
                Borrow Rate
              </TableCell>
              {/* <TableCell
                sx={{
                  color: "text.primary",
                  borderBottom: "1px solid rgba(55, 65, 81, 0.5)",
                  backgroundColor: "transparent",
                  fontSize: "1rem",
                  fontWeight: 500,
                  py: 2,
                  minWidth: isTablet ? 120 : "auto",
                }}
              >
                Vault Listing
              </TableCell> */}
            </TableRow>
          </TableHead>

          <TableBody>
            {paginatedMarkets.map((market: any, index: number) => (
              <MarketRow
                key={market.uniqueKey}
                market={market}
                index={index}
                isLastRow={index === paginatedMarkets.length - 1}
                favorites={favorites}
                onRowClick={handleRowClick}
                onToggleFavorite={toggleFavorite}
              />
            ))}
          </TableBody>
        </Table>

        {/* Desktop/Tablet Pagination */}
        {filteredMarkets.length > rowsPerPage && (
          <TablePagination
            component="div"
            count={filteredMarkets.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[10, 25, 50, 100]}
            sx={{
              color: "#9CA3AF",
              borderTop: "1px solid rgba(55, 65, 81, 0.3)",
              backgroundColor: "transparent",
              "& .MuiTablePagination-selectIcon": {
                color: "#9CA3AF",
              },
              "& .MuiTablePagination-select": {
                color: "#9CA3AF",
              },
              "& .MuiTablePagination-displayedRows": {
                color: "#9CA3AF",
              },
              "& .MuiIconButton-root": {
                color: "#9CA3AF",
              },
              "& .MuiIconButton-root.Mui-disabled": {
                color: "rgba(156, 163, 175, 0.3)",
              },
            }}
          />
        )}
      </TableContainer>
    </GlowBox>
  );
};

export default ResponsiveMarketsContainer;
