"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import {
  ViewList as PositionsIcon,
  Description as OrdersIcon,
  History as HistoryIcon,
  Link as SessionKeyIcon,
  ExpandLess,
} from "@mui/icons-material";

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  children?: { label: string; path: string }[];
}

const navItems: NavItem[] = [
  {
    label: "Positions",
    path: "/perp/wallet/positions",
    icon: <PositionsIcon fontSize="small" />,
  },
  {
    label: "Open Orders",
    path: "/perp/wallet/open-orders",
    icon: <OrdersIcon fontSize="small" />,
  },
  {
    label: "History",
    path: "/perp/wallet/history/trades",
    icon: <HistoryIcon fontSize="small" />,
    children: [
      { label: "Trade History", path: "/perp/wallet/history/trades" },
      {
        label: "Deposits & Withdrawals",
        path: "/perp/wallet/history/deposits-withdrawals",
      },
      { label: "Funding History", path: "/perp/wallet/history/funding" },
    ],
  },
  {
    label: "Session Keys",
    path: "/perp/wallet/session-keys",
    icon: <SessionKeyIcon fontSize="small" />,
  },
];

export const WalletSidebar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (path: string) => pathname === path;
  const isHistoryActive = pathname.includes("/perp/wallet/history");

  const handleNavClick = (path: string) => {
    router.push(path);
  };

  return (
    <Box
      sx={{
        width: 250,
        minWidth: 170,
        backgroundColor: "#0a0e1a",
        borderRight: "1px solid rgba(255, 255, 255, 0.1)",
        minHeight: "100%",
        height: "calc(100vh - 64px)",
      }}
    >
      <List component="nav" sx={{ py: 1 }}>
        {navItems.map((item) => (
          <React.Fragment key={item.label}>
            <ListItemButton
              onClick={() => handleNavClick(item.path)}
              sx={{
                py: 0.75,
                px: 2,
                color: item.children
                  ? isHistoryActive
                    ? "#fff"
                    : "#8b949e"
                  : isActive(item.path)
                    ? "#fff"
                    : "#8b949e",
                backgroundColor:
                  !item.children && isActive(item.path)
                    ? "rgba(0, 245, 224, 0.1)"
                    : "transparent",
                "&:hover": {
                  backgroundColor: "rgba(0, 245, 224, 0.05)",
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 32,
                  color: item.children
                    ? isHistoryActive
                      ? "#00F5E0"
                      : "#8b949e"
                    : isActive(item.path)
                      ? "#00F5E0"
                      : "#8b949e",
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{
                  fontSize: "14px",
                  fontWeight: item.children
                    ? isHistoryActive
                      ? 500
                      : 400
                    : isActive(item.path)
                      ? 500
                      : 400,
                }}
              />
              {item.children && (
                <ExpandLess fontSize="small" sx={{ color: "#8b949e" }} />
              )}
            </ListItemButton>

            {item.children && (
              <List component="div" disablePadding>
                {item.children.map((child) => (
                  <ListItemButton
                    key={child.path}
                    onClick={() => handleNavClick(child.path)}
                    sx={{
                      py: 0.5,
                      pl: 4,
                      pr: 2,
                      color: isActive(child.path) ? "#fff" : "#8b949e",
                      backgroundColor: isActive(child.path)
                        ? "rgba(0, 245, 224, 0.1)"
                        : "transparent",
                      "&:hover": {
                        backgroundColor: "rgba(0, 245, 224, 0.05)",
                      },
                    }}
                  >
                    <ListItemText
                      primary={child.label}
                      primaryTypographyProps={{
                        fontSize: "13px",
                        fontWeight: isActive(child.path) ? 500 : 400,
                      }}
                    />
                  </ListItemButton>
                ))}
              </List>
            )}
          </React.Fragment>
        ))}
      </List>
    </Box>
  );
};

export default WalletSidebar;
