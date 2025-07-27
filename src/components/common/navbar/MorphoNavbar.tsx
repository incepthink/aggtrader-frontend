"use client";
import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { AppBar, Toolbar, Button, Box } from "@mui/material";
import { useScrollDirection } from "@/hooks/useScrollDirection";

export const MorphoNavbar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const scrollUp = useScrollDirection();

  const activeTab = pathname.includes("/lend/borrow") ? "borrow" : "earn";

  const handleTabClick = (tab: "earn" | "borrow") => {
    router.push(tab === "earn" ? "/lend/earn" : "/lend/borrow");
  };

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        top: "64px", // Below main nav
        zIndex: 20, // Lower than main nav
        backgroundColor: "#0a0e1a",
        transition: "transform 0.3s ease, opacity 0.3s ease",
        transform: scrollUp ? "translateY(0)" : "translateY(-100%)",
        opacity: scrollUp ? 1 : 0,
        pointerEvents: scrollUp ? "auto" : "none", // avoids invisible click zones
      }}
    >
      <Toolbar
        disableGutters
        sx={{
          minHeight: "auto", // Remove default height
          height: "fit-content", // Only as tall as its content
          px: 2,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Button
          onClick={() => handleTabClick("earn")}
          sx={{
            color: activeTab === "earn" ? "#00F5E0" : "#8b949e",
            borderBottom:
              activeTab === "earn"
                ? "2px solid #00F5E0"
                : "2px solid transparent",
            borderRadius: 0,
            px: 3,
            height: "48px", // match Toolbar height
            lineHeight: "48px", // align text vertically
            fontSize: "16px",
            fontWeight: activeTab === "earn" ? "600" : "400",
            "&:hover": {
              backgroundColor: "rgba(0, 245, 224, 0.1)",
            },
          }}
        >
          Earn
        </Button>
        <Button
          onClick={() => handleTabClick("borrow")}
          sx={{
            color: activeTab === "borrow" ? "#00F5E0" : "#8b949e",
            borderBottom:
              activeTab === "borrow"
                ? "2px solid #00F5E0"
                : "2px solid transparent",
            borderRadius: 0,
            px: 3,
            height: "48px", // match Toolbar height
            lineHeight: "48px", // align text vertically
            fontSize: "16px",
            fontWeight: activeTab === "borrow" ? "600" : "400",
            "&:hover": {
              backgroundColor: "rgba(0, 245, 224, 0.1)",
            },
          }}
        >
          Borrow
        </Button>
      </Toolbar>
    </AppBar>
  );
};
