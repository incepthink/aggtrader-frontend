"use client";

import React, { ReactNode } from "react";
import { Box, Typography, CircularProgress } from "@mui/material";

// Table styles matching open-orders styling
const tableStyles = {
  table: {
    width: "100%",
    borderCollapse: "collapse" as const,
  },
  th: {
    padding: "12px 16px",
    textAlign: "left" as const,
    fontSize: "0.75rem",
    fontWeight: 500,
    color: "rgba(255, 255, 255, 0.4)",
    borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
    whiteSpace: "nowrap" as const,
    textTransform: "uppercase" as const,
    letterSpacing: "0.5px",
  },
  td: {
    padding: "16px",
    fontSize: "0.875rem",
    color: "#fff",
    borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
  },
  tr: {
    transition: "background-color 0.2s",
  },
};

export interface WalletTableColumn {
  key: string;
  label: string;
  width?: string;
  align?: "left" | "center" | "right";
}

interface WalletTableProps<T> {
  columns: WalletTableColumn[];
  data: T[];
  isLoading?: boolean;
  isError?: boolean;
  error?: Error | null;
  emptyTitle?: string;
  emptyMessage?: string;
  renderRow: (item: T, index: number) => ReactNode;
  minWidth?: string;
}

export function WalletTable<T>({
  columns,
  data,
  isLoading = false,
  isError = false,
  error = null,
  emptyTitle = "No data",
  emptyMessage = "Your data will appear here",
  renderRow,
  minWidth = "1200px",
}: WalletTableProps<T>) {
  // Loading State
  if (isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          py: 8,
          gap: 2,
        }}
      >
        <CircularProgress size={32} sx={{ color: "#00F5E0" }} />
        <Typography
          sx={{ color: "rgba(255, 255, 255, 0.5)", fontSize: "0.875rem" }}
        >
          Loading...
        </Typography>
      </Box>
    );
  }

  // Error State
  if (isError) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          py: 8,
          gap: 1,
        }}
      >
        <Typography sx={{ color: "#FF4444", fontSize: "0.875rem" }}>
          {error?.message || "Failed to load data"}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ overflowX: "auto" }}>
      <table style={{ ...tableStyles.table, minWidth }}>
        <thead className="sticky">
          <tr style={{ background: "rgba(5, 12, 25, 0.5)" }}>
            {columns.map((column) => (
              <th
                key={column.key}
                style={{
                  ...tableStyles.th,
                  textAlign: column.align || "left",
                  width: column.width,
                }}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                style={{
                  ...tableStyles.td,
                  textAlign: "center",
                  padding: "64px 16px",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  <Typography
                    sx={{
                      color: "#00F5E0",
                      fontSize: "1rem",
                      fontWeight: 500,
                    }}
                  >
                    {emptyTitle}
                  </Typography>
                  <Typography
                    sx={{
                      color: "rgba(255, 255, 255, 0.4)",
                      fontSize: "0.875rem",
                    }}
                  >
                    {emptyMessage}
                  </Typography>
                </Box>
              </td>
            </tr>
          ) : (
            data.map((item, index) => renderRow(item, index))
          )}
        </tbody>
      </table>
    </Box>
  );
}

// Row wrapper component for consistent hover effects
interface WalletTableRowProps {
  children: ReactNode;
  onClick?: () => void;
}

export const WalletTableRow: React.FC<WalletTableRowProps> = ({
  children,
  onClick,
}) => {
  return (
    <tr
      style={tableStyles.tr}
      onMouseEnter={(e) =>
        (e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.02)")
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.backgroundColor = "transparent")
      }
      onClick={onClick}
    >
      {children}
    </tr>
  );
};

// Cell component for consistent styling
interface WalletTableCellProps {
  children: ReactNode;
  align?: "left" | "center" | "right";
  style?: React.CSSProperties;
}

export const WalletTableCell: React.FC<WalletTableCellProps> = ({
  children,
  align = "left",
  style,
}) => {
  return (
    <td
      style={{
        ...tableStyles.td,
        textAlign: align,
        ...style,
      }}
    >
      {children}
    </td>
  );
};

export { tableStyles };
