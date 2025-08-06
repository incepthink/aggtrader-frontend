"use client";
import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { AppBar, Toolbar, Button, Box } from "@mui/material";
import { useScrollDirection } from "@/hooks/useScrollDirection";
import { useChain, SUPPORTED_CHAINS, ChainName } from "@/context/ChainContext";

export const MorphoNavbar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const scrollUp = useScrollDirection();
  const { chainName, switchChain, isLoading } = useChain();

  const activeTab = pathname.includes("/lend/borrow") ? "borrow" : "earn";

  const handleTabClick = (tab: "earn" | "borrow") => {
    router.push(tab === "earn" ? "/lend/earn" : "/lend/borrow");
  };

  const handleChainSwitch = (newChainName: ChainName) => {
    if (newChainName !== chainName) {
      switchChain(newChainName);
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
      <div className="flex mx-auto justify-center items-center w-full px-4 relative">
        {/* Center - Navigation tabs */}
        <div className="flex">
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
        </div>

        {/* Right side - Chain Switcher (positioned absolutely to extreme right) */}
        <div className="absolute right-9 flex items-center">
          {isLoading ? (
            <div className="animate-pulse bg-gray-700 rounded-lg h-8 w-24" />
          ) : (
            <div className="bg-gray-800 rounded-lg p-1">
              <div className="flex space-x-1">
                {Object.entries(SUPPORTED_CHAINS).map(([key, config]) => {
                  const isActive = key === chainName;
                  return (
                    <button
                      key={key}
                      onClick={() => handleChainSwitch(key as ChainName)}
                      className={`
                        px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200
                        ${
                          isActive
                            ? "bg-[#00F5E0] text-black shadow-sm"
                            : "text-gray-300 hover:text-white hover:bg-gray-700"
                        }
                      `}
                    >
                      <div className="flex items-center space-x-1.5">
                        <div
                          className={`w-1.5 h-1.5 rounded-full ${
                            key === "ETHEREUM" ? "bg-blue-500" : "bg-purple-500"
                          }`}
                        />
                        <span>{config.name}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </AppBar>
  );
};
