"use client";

import { Box, Typography, Button, CircularProgress, IconButton, Tooltip } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import RefreshIcon from "@mui/icons-material/Refresh";
import {
  useKatanaPerpsOrders,
  KatanaPerpsOrder,
  calculateFillPercentage,
  formatOrderType,
  formatOrderStatus,
  getStatusColor,
} from "@/hooks/perp/useKatanaPerpsOrders";

// Table styles
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

export default function OpenOrdersPage() {
  const { data: orders = [], isLoading, error, refetch } = useKatanaPerpsOrders();

  const handleCancelOrder = (orderId: string) => {
    // Placeholder for canceling order
    console.log("Cancel order:", orderId);
  };

  const handleCancelAllOrders = () => {
    // Placeholder for canceling all orders
    console.log("Cancel all orders");
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Box>
      {/* Header Row */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          py: 1.5,
          px: 2,
          borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Typography sx={{ color: "#fff", fontSize: "1.125rem", fontWeight: 500 }}>
            Open Orders
          </Typography>
          <Box
            sx={{
              px: 1,
              py: 0.25,
              borderRadius: 1,
              bgcolor: "rgba(0, 245, 224, 0.1)",
              color: "#00F5E0",
              fontSize: "0.75rem",
              fontWeight: 500,
            }}
          >
            {orders.length}
          </Box>
        </Box>
        <Box sx={{ display: "flex", gap: 1.5 }}>
          <Tooltip title="Refresh orders">
            <IconButton
              onClick={() => refetch()}
              disabled={isLoading}
              sx={{
                color: "rgba(255, 255, 255, 0.5)",
                "&:hover": { color: "#00F5E0" },
              }}
            >
              <RefreshIcon sx={{ fontSize: 20 }} />
            </IconButton>
          </Tooltip>
          <Button
            onClick={handleCancelAllOrders}
            disabled={orders.length === 0}
            sx={{
              px: 3,
              py: 0.75,
              background: "transparent",
              border: "1px solid rgba(255, 68, 68, 0.5)",
              color: "#FF4444",
              fontSize: "0.875rem",
              fontWeight: 500,
              textTransform: "none",
              borderRadius: "4px",
              "&:hover": {
                background: "rgba(255, 68, 68, 0.1)",
                border: "1px solid #FF4444",
              },
              "&.Mui-disabled": {
                color: "rgba(255, 68, 68, 0.3)",
                border: "1px solid rgba(255, 68, 68, 0.2)",
              },
            }}
          >
            Cancel All
          </Button>
        </Box>
      </Box>

      {/* Loading State */}
      {isLoading && (
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
          <Typography sx={{ color: "rgba(255, 255, 255, 0.5)", fontSize: "0.875rem" }}>
            Loading orders...
          </Typography>
        </Box>
      )}

      {/* Error State */}
      {error && !isLoading && (
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
            Failed to load orders
          </Typography>
          <Typography
            sx={{
              color: "#00F5E0",
              fontSize: "0.75rem",
              cursor: "pointer",
              "&:hover": { textDecoration: "underline" },
            }}
            onClick={() => refetch()}
          >
            Click to retry
          </Typography>
        </Box>
      )}

      {/* Orders Table */}
      {!isLoading && !error && (
        <Box sx={{ overflowX: "auto" }}>
          <table style={tableStyles.table}>
            <thead>
              <tr style={{ background: "rgba(5, 12, 25, 0.5)" }}>
                <th style={tableStyles.th}>Market</th>
                <th style={tableStyles.th}>Type</th>
                <th style={tableStyles.th}>Side</th>
                <th style={tableStyles.th}>Quantity</th>
                <th style={tableStyles.th}>Price</th>
                <th style={tableStyles.th}>Filled</th>
                <th style={tableStyles.th}>Value</th>
                <th style={tableStyles.th}>Trigger Price</th>
                <th style={tableStyles.th}>Status</th>
                <th style={tableStyles.th}>Time</th>
                <th style={{ ...tableStyles.th, textAlign: "center", width: "60px" }}></th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td
                    colSpan={11}
                    style={{ ...tableStyles.td, textAlign: "center", padding: "64px 16px" }}
                  >
                    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
                      <Typography sx={{ color: "#00F5E0", fontSize: "1rem", fontWeight: 500 }}>
                        No open orders
                      </Typography>
                      <Typography sx={{ color: "rgba(255, 255, 255, 0.4)", fontSize: "0.875rem" }}>
                        Your open orders will appear here
                      </Typography>
                    </Box>
                  </td>
                </tr>
              ) : (
                orders.map((order: KatanaPerpsOrder) => {
                  const isBuy = order.side === "buy";
                  const fillPercentage = calculateFillPercentage(order);
                  const price = order.price ? parseFloat(order.price) : 0;
                  const quantity = parseFloat(order.originalQuantity);
                  const value = price * quantity;

                  return (
                    <tr
                      key={order.orderId}
                      style={tableStyles.tr}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.02)")
                      }
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                    >
                      {/* Market */}
                      <td style={{ ...tableStyles.td, fontWeight: 500 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <span>{order.market}</span>
                          {order.reduceOnly && (
                            <Box
                              sx={{
                                px: 0.75,
                                py: 0.25,
                                borderRadius: 0.5,
                                bgcolor: "rgba(255, 165, 0, 0.2)",
                                color: "#FFA500",
                                fontSize: "0.625rem",
                                fontWeight: 600,
                              }}
                            >
                              REDUCE
                            </Box>
                          )}
                        </Box>
                      </td>

                      {/* Type */}
                      <td style={tableStyles.td}>{formatOrderType(order.type)}</td>

                      {/* Side */}
                      <td
                        style={{
                          ...tableStyles.td,
                          color: isBuy ? "#00FF88" : "#FF4444",
                          fontWeight: 500,
                        }}
                      >
                        {isBuy ? "Long" : "Short"}
                      </td>

                      {/* Quantity */}
                      <td style={tableStyles.td}>{quantity.toFixed(6)}</td>

                      {/* Price */}
                      <td style={tableStyles.td}>
                        {order.price
                          ? `$${price.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}`
                          : "Market"}
                      </td>

                      {/* Filled */}
                      <td style={tableStyles.td}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Box
                            sx={{
                              width: 40,
                              height: 4,
                              borderRadius: 2,
                              bgcolor: "rgba(255, 255, 255, 0.1)",
                              overflow: "hidden",
                            }}
                          >
                            <Box
                              sx={{
                                width: `${fillPercentage}%`,
                                height: "100%",
                                bgcolor: fillPercentage > 0 ? "#FFA500" : "transparent",
                              }}
                            />
                          </Box>
                          <span style={{ color: fillPercentage > 0 ? "#FFA500" : "inherit" }}>
                            {fillPercentage.toFixed(1)}%
                          </span>
                        </Box>
                      </td>

                      {/* Value */}
                      <td style={tableStyles.td}>
                        $
                        {value.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>

                      {/* Trigger Price */}
                      <td style={tableStyles.td}>
                        {order.triggerPrice ? (
                          <Box>
                            <span>
                              $
                              {parseFloat(order.triggerPrice).toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </span>
                            {order.triggerType && (
                              <span
                                style={{
                                  marginLeft: 4,
                                  fontSize: "0.625rem",
                                  color: "rgba(255, 255, 255, 0.4)",
                                  textTransform: "uppercase",
                                }}
                              >
                                ({order.triggerType})
                              </span>
                            )}
                          </Box>
                        ) : (
                          "-"
                        )}
                      </td>

                      {/* Status */}
                      <td style={tableStyles.td}>
                        <span
                          style={{
                            color: getStatusColor(order.status),
                            fontSize: "0.75rem",
                            fontWeight: 500,
                            textTransform: "uppercase",
                          }}
                        >
                          {formatOrderStatus(order.status)}
                        </span>
                      </td>

                      {/* Time */}
                      <td style={{ ...tableStyles.td, color: "rgba(255, 255, 255, 0.6)" }}>
                        {formatDate(order.time)}
                      </td>

                      {/* Cancel Button */}
                      <td style={{ ...tableStyles.td, textAlign: "center" }}>
                        <Tooltip title="Cancel Order">
                          <IconButton
                            size="small"
                            onClick={() => handleCancelOrder(order.orderId)}
                            sx={{
                              color: "rgba(255, 255, 255, 0.5)",
                              "&:hover": {
                                color: "#FF4444",
                                bgcolor: "rgba(255, 68, 68, 0.1)",
                              },
                            }}
                          >
                            <CloseIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </Box>
      )}
    </Box>
  );
}
