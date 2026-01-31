"use client";

import { useState, useRef } from "react";
import {
  Tabs,
  Tab,
  Popper,
  Paper,
  MenuList,
  MenuItem,
  ClickAwayListener,
} from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { usePerpStore } from "@/store/perpStore";

const OrderTypeTabs = () => {
  const activeOrderType = usePerpStore((s) => s.activeOrderType);
  const setActiveOrderType = usePerpStore((s) => s.setActiveOrderType);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const stopTabRef = useRef<HTMLDivElement>(null);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: string) => {
    if (newValue === "stopMarket" || newValue === "stopLimit") {
      // Open dropdown instead of selecting directly
      setDropdownOpen(true);
    } else {
      setActiveOrderType(
        newValue as "market" | "limit" | "stopMarket" | "stopLimit",
      );
    }
  };

  const handleStopTabClick = () => {
    setDropdownOpen((prev) => !prev);
  };

  const handleSelectStopType = (type: "stopMarket" | "stopLimit") => {
    setActiveOrderType(type);
    setDropdownOpen(false);
  };

  const handleClickAway = () => {
    setDropdownOpen(false);
  };

  const isStopTypeSelected =
    activeOrderType === "stopMarket" || activeOrderType === "stopLimit";
  const stopTabLabel =
    activeOrderType === "stopLimit" ? "Stop Limit" : "Stop Market";

  return (
    <>
      <Tabs
        value={isStopTypeSelected ? false : activeOrderType}
        onChange={handleTabChange}
        sx={{
          pt: 0.5,
          minHeight: "36px",
          "& .MuiTabs-indicator": {
            display: "none",
          },
          "& .MuiTab-root": {
            minWidth: "auto",
            fontSize: "0.75rem",
            fontWeight: 500,
            textTransform: "none",
            color: "rgba(255, 255, 255, 0.6)",
            "&.Mui-selected": {
              color: "#00F5E0",
            },
            "&.Mui-disabled": {
              color: "rgba(255, 255, 255, 0.3)",
            },
          },
        }}
      >
        <Tab label="Limit" value="limit" />
        <Tab label="Market" value="market" />
        <Tab
          ref={stopTabRef}
          label={
            <div
              onClick={handleStopTabClick}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "2px",
              }}
            >
              {stopTabLabel}
              <KeyboardArrowDownIcon sx={{ fontSize: 16 }} />
            </div>
          }
          value={activeOrderType === "stopLimit" ? "stopLimit" : "stopMarket"}
          sx={{
            color: isStopTypeSelected
              ? "#00F5E0 !important"
              : "rgba(255, 255, 255, 0.6)",
          }}
        />
      </Tabs>

      <Popper
        open={dropdownOpen}
        anchorEl={stopTabRef.current}
        placement="bottom-start"
        sx={{ zIndex: 1300 }}
      >
        <ClickAwayListener onClickAway={handleClickAway}>
          <Paper
            sx={{
              bgcolor: "#1a1f2e",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: 1,
              mt: 0.5,
            }}
          >
            <MenuList dense>
              <MenuItem
                onClick={() => handleSelectStopType("stopLimit")}
                selected={activeOrderType === "stopLimit"}
                sx={{
                  fontSize: "0.875rem",
                  color: "#fff",
                  bgcolor:
                    activeOrderType === "stopLimit" ? "#00F5E0" : "transparent",
                  "&.Mui-selected": {
                    bgcolor: "#00F5E0",
                    color: "#000",
                    "&:hover": {
                      bgcolor: "#00D4C0",
                    },
                  },
                  "&:hover": {
                    bgcolor:
                      activeOrderType === "stopLimit"
                        ? "#00D4C0"
                        : "rgba(255, 255, 255, 0.05)",
                  },
                  py: 1,
                  px: 2,
                }}
              >
                Stop Limit
              </MenuItem>
              <MenuItem
                onClick={() => handleSelectStopType("stopMarket")}
                selected={activeOrderType === "stopMarket"}
                sx={{
                  fontSize: "0.875rem",
                  color: "#fff",
                  bgcolor:
                    activeOrderType === "stopMarket"
                      ? "#00F5E0"
                      : "transparent",
                  "&.Mui-selected": {
                    bgcolor: "#00F5E0",
                    color: "#000",
                    "&:hover": {
                      bgcolor: "#00D4C0",
                    },
                  },
                  "&:hover": {
                    bgcolor:
                      activeOrderType === "stopMarket"
                        ? "#00D4C0"
                        : "rgba(255, 255, 255, 0.05)",
                  },
                  py: 1,
                  px: 2,
                }}
              >
                Stop Market
              </MenuItem>
            </MenuList>
          </Paper>
        </ClickAwayListener>
      </Popper>
    </>
  );
};

export default OrderTypeTabs;
