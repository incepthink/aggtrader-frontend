"use client";
import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { AppBar, Button } from "@mui/material";
import { useScrollDirection } from "@/hooks/useScrollDirection";

export const SpotNavbar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const scrollUp = useScrollDirection();

  const activeTab = pathname.includes("/spot/pools") ? "pools" : "swap";

  const handleTabClick = (tab: "swap" | "pools") => {
    if (tab === "swap") {
      router.push("/spot/swap");
    } else if (tab === "pools") {
      router.push("/spot/pools");
    }
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
        transform: scrollUp ? "translateY(0%)" : "translateY(-100%)",
        opacity: scrollUp ? 1 : 0,
        pointerEvents: scrollUp ? "auto" : "none", // avoids invisible click zones
      }}
    >
      <div className="flex mx-auto justify-start sm:justify-center items-center w-full px-0 sm:px-4 relative">
        {/* Center - Navigation tabs */}
        <div className="flex md:-ml-18">
          <Button
            onClick={() => handleTabClick("swap")}
            sx={{
              color: activeTab === "swap" ? "#00F5E0" : "#8b949e",
              borderBottom:
                activeTab === "swap"
                  ? "2px solid #00F5E0"
                  : "2px solid transparent",
              borderRadius: 0,
              px: 3,
              height: "48px", // match Toolbar height
              lineHeight: "48px", // align text vertically
              fontSize: "16px",
              fontWeight: activeTab === "swap" ? "600" : "400",
              "&:hover": {
                backgroundColor: "rgba(0, 245, 224, 0.1)",
              },
            }}
          >
            Swap
          </Button>
          <Button
            onClick={() => handleTabClick("pools")}
            sx={{
              color: activeTab === "pools" ? "#00F5E0" : "#8b949e",
              borderBottom:
                activeTab === "pools"
                  ? "2px solid #00F5E0"
                  : "2px solid transparent",
              borderRadius: 0,
              px: 3,
              height: "48px", // match Toolbar height
              lineHeight: "48px", // align text vertically
              fontSize: "16px",
              fontWeight: activeTab === "pools" ? "600" : "400",
              "&:hover": {
                backgroundColor: "rgba(0, 245, 224, 0.1)",
              },
            }}
          >
            Pools
          </Button>
        </div>
      </div>
    </AppBar>
  );
};
