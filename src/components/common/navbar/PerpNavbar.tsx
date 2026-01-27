"use client";
import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { AppBar, Button } from "@mui/material";

export const PerpNavbar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();

  const activeTab = pathname.includes("/perp/wallet") ? "wallet" : "trade";

  const handleTabClick = (tab: "trade" | "wallet") => {
    if (tab === "trade") {
      router.push("/perp");
    } else if (tab === "wallet") {
      router.push("/perp/wallet");
    }
  };

  return (
    <AppBar
      position="static"
      elevation={0}
      sx={{
        backgroundColor: "#0a0e1a",
        minHeight: "unset",
      }}
    >
      <div className="flex mx-auto justify-start sm:justify-center items-center w-full px-0 sm:px-4 relative">
        <div className="flex md:-ml-18">
          <Button
            onClick={() => handleTabClick("trade")}
            sx={{
              color: activeTab === "trade" ? "#00F5E0" : "#8b949e",
              borderBottom:
                activeTab === "trade"
                  ? "2px solid #00F5E0"
                  : "2px solid transparent",
              borderRadius: 0,
              px: 2,
              py: 0,
              minHeight: "32px",
              height: "32px",
              lineHeight: "32px",
              fontSize: "14px",
              fontWeight: activeTab === "trade" ? "600" : "400",
              textTransform: "none",
              "&:hover": {
                backgroundColor: "rgba(0, 245, 224, 0.1)",
              },
            }}
          >
            TRADE
          </Button>
          <Button
            onClick={() => handleTabClick("wallet")}
            sx={{
              color: activeTab === "wallet" ? "#00F5E0" : "#8b949e",
              borderBottom:
                activeTab === "wallet"
                  ? "2px solid #00F5E0"
                  : "2px solid transparent",
              borderRadius: 0,
              px: 2,
              py: 0,
              minHeight: "32px",
              height: "32px",
              lineHeight: "32px",
              fontSize: "14px",
              fontWeight: activeTab === "wallet" ? "600" : "400",
              textTransform: "none",
              "&:hover": {
                backgroundColor: "rgba(0, 245, 224, 0.1)",
              },
            }}
          >
            WALLETS
          </Button>
        </div>
      </div>
    </AppBar>
  );
};
