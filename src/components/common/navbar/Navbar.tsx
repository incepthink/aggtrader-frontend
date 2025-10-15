"use client";

// src/components/Navbar.tsx
import React, { useState, useEffect } from "react";
import NavLink from "./Navlink";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Menu, Close, KeyboardArrowDown } from "@mui/icons-material";
import { NetworkSelector } from "./NetworkSelector";
import { Typography, Menu as MuiMenu, MenuItem } from "@mui/material";
import { useAccount } from "wagmi";
import { usePathname } from "next/navigation";
import axios from "axios";
import { BACKEND_URL } from "@/utils/constants";

const productsItems = [
  { href: "/lend/earn", label: "Earn" },
  { href: "/lend/borrow", label: "Borrow" },
  { href: "/vault", label: "Vaults" },
];

interface GradientConnectButtonProps {
  customStyles?: string;
  fullWidth?: boolean;
  variant?: "default" | "form";
}

export function GradientConnectButton({
  customStyles = "",
  fullWidth = false,
  variant = "default",
}: GradientConnectButtonProps) {
  return (
    <ConnectButton.Custom>
      {({
        account,
        openConnectModal,
        openAccountModal,
        mounted,
        authenticationStatus,
      }) => {
        if (!mounted) return null;
        const ready = mounted && authenticationStatus !== "loading";
        const connected = ready && account;

        const defaultStyles = `bg-gradient-to-r from-[#00F5E0] to-[#00FAFF] text-black font-semibold p-2 px-3 rounded-sm hover:ring-2 hover:ring-[#00F5E0] hover:ring-offset-2 hover:ring-offset-gray-900
   hover:shadow-[0_0_4px_rgba(0,245,224,0.8),0_0_8px_rgba(0,245,224,0.7),0_0_12px_rgba(0,245,224,0.6),0_0_18px_rgba(0,245,224,0.5),0_0_24px_rgba(0,245,224,0.4)]
   transition-all duration-300 cursor-pointer flex gap-3 items-center text-sm justify-center whitespace-nowrap`;

        const formStyles = `bg-gradient-to-r from-[#00F5E0] to-[#00FAFF] text-black font-bold py-3 px-4 rounded-lg hover:opacity-90 transition-all duration-300 cursor-pointer flex gap-2 items-center justify-center text-base ${
          fullWidth ? "w-full" : ""
        }`;

        const buttonStyles = variant === "form" ? formStyles : defaultStyles;
        const finalStyles = customStyles || buttonStyles;

        return (
          <button
            onClick={connected ? openAccountModal : openConnectModal}
            className={finalStyles}
          >
            {connected ? (
              <>
                <div>
                  <img
                    src={"/avatar.svg"}
                    alt="User avatar"
                    className="w-5 h-5 rounded-full"
                  />
                </div>
                <span
                  className={variant === "form" ? "block" : "hidden sm:inline"}
                >
                  {account.displayName}
                </span>
              </>
            ) : (
              <>
                <span
                  className={variant === "form" ? "block" : "hidden sm:inline"}
                >
                  Connect Wallet
                </span>
                <span className={variant === "form" ? "hidden" : "sm:hidden"}>
                  Connect
                </span>
              </>
            )}
          </button>
        );
      }}
    </ConnectButton.Custom>
  );
}

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedProduct, setSelectedProduct] = useState("Earn");
  const { address, isConnected } = useAccount();
  const pathname = usePathname();

  // Set selected product based on current pathname
  useEffect(() => {
    if (pathname?.includes("/lend/earn")) {
      setSelectedProduct("Earn");
    } else if (pathname?.includes("/lend/borrow")) {
      setSelectedProduct("Borrow");
    } else if (pathname?.includes("/vault")) {
      setSelectedProduct("Vaults");
    } else {
      // Default to Earn for other pages (spot, account, etc.)
      setSelectedProduct("Earn");
    }
  }, [pathname]);

  const handleDropdownClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleDropdownClose = () => {
    setAnchorEl(null);
  };

  const handleProductSelect = (label: string, href: string) => {
    setSelectedProduct(label);
    handleDropdownClose();
    window.location.href = href;
  };

  // Store user for equity tracking when wallet connects
  useEffect(() => {
    const storeUserForTracking = async () => {
      if (isConnected && address) {
        try {
          const response = await axios.post(
            `${BACKEND_URL}/api/user/store`,
            { walletAddress: address },
            { timeout: 10000 }
          );

          console.log("[Equity Tracking] User stored:", response.data);
        } catch (error: any) {
          console.error(
            "[Equity Tracking] Failed to store user:",
            error?.message
          );
        }
      }
    };

    storeUserForTracking();
  }, [isConnected, address]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <>
      <nav className="sticky top-0 bg-transparent shadow flex justify-between items-center p-2 px-4 lg:px-10 z-50 backdrop-blur-2xl">
        {/* Logo */}
        <a href="/" className="flex gap-2 items-center">
          <div className="w-10 h-10">
            <img
              src="/assets/aggtrade.png"
              alt="AggTrade Logo"
              className="w-full h-full object-cover"
            />
          </div>
          <h2 className="text-xl md:text-2xl font-semibold text-white cursor-pointer flex justify-center gap-2">
            AggTrade{" "}
            <span className="bg-yellow-500 text-black rounded-full py-0.5 my-auto px-1 text-[8px]">
              BETA
            </span>
          </h2>
        </a>

        {/* Desktop Navigation */}
        <ul className="hidden lg:flex list-none gap-6 m-0 p-4 items-center">
          <li>
            <NavLink href={["/spot"]}>Spot</NavLink>
          </li>
          <li>
            <button
              onClick={handleDropdownClick}
              className="flex items-center gap-1 text-white hover:text-[#00F5E0] transition-colors duration-200 cursor-pointer text-xl font-medium"
            >
              {selectedProduct}
              <KeyboardArrowDown sx={{ fontSize: 20 }} />
            </button>
          </li>
          <li>
            <NavLink href={["/profile"]}>Account</NavLink>
          </li>
        </ul>

        {/* Dropdown Menu */}
        <MuiMenu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleDropdownClose}
          sx={{
            "& .MuiPaper-root": {
              backgroundColor: "#1a1a1a",
              border: "1px solid rgba(0, 245, 224, 0.2)",
              borderRadius: "8px",
              marginTop: "8px",
            },
          }}
        >
          {productsItems.map((item) => (
            <MenuItem
              key={item.href}
              onClick={() => handleProductSelect(item.label, item.href)}
              sx={{
                color: "#ffffff",
                "&:hover": {
                  backgroundColor: "rgba(0, 245, 224, 0.1)",
                  color: "#00F5E0",
                },
                padding: "10px 20px",
                fontSize: "16px",
              }}
            >
              {item.label}
            </MenuItem>
          ))}
        </MuiMenu>

        {/* Desktop Network Selector and Connect Button */}
        <div className="hidden lg:flex items-center gap-3">
          <NetworkSelector variant="navbar" size="small" />
          <GradientConnectButton />
        </div>

        {/* Mobile Menu Button and Connect Button */}
        <div className="lg:hidden flex items-center gap-2">
          <div className="hidden sm:block">
            <NetworkSelector variant="navbar" size="small" />
          </div>
          <GradientConnectButton />
          <button
            onClick={toggleMenu}
            className="text-white p-2 hover:bg-gray-800 rounded-md transition-colors duration-200 flex items-center justify-center"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? (
              <Close sx={{ fontSize: 24 }} />
            ) : (
              <Menu sx={{ fontSize: 24 }} />
            )}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay - Translucent */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={closeMenu}
        />
      )}

      {/* Mobile Menu */}
      <div
        className={`fixed top-0 right-0 h-full w-64 bg-gray-900 transform transition-transform duration-300 ease-in-out z-50 lg:hidden ${
          isMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h3 className="text-white font-semibold">Menu</h3>
          <button
            onClick={closeMenu}
            className="text-white p-2 hover:bg-gray-800 rounded-md transition-colors duration-200"
            aria-label="Close menu"
          >
            <Close sx={{ fontSize: 24 }} />
          </button>
        </div>

        {/* Network Selector in Mobile Menu */}
        <div className="p-4 border-b border-gray-700">
          <Typography
            variant="body2"
            className="text-gray-400 mb-2"
            sx={{ fontSize: "0.875rem" }}
          >
            Network
          </Typography>
          <NetworkSelector variant="standalone" size="medium" />
        </div>

        <ul className="flex flex-col p-4 gap-4">
          <li>
            <a
              href="/spot"
              onClick={closeMenu}
              className="block text-white hover:text-[#00F5E0] transition-colors duration-200 py-2"
            >
              Spot
            </a>
          </li>
          {productsItems.map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                onClick={() => {
                  setSelectedProduct(item.label);
                  closeMenu();
                }}
                className="block text-white hover:text-[#00F5E0] transition-colors duration-200 py-2"
              >
                {item.label}
              </a>
            </li>
          ))}
          <li>
            <a
              href="/profile"
              onClick={closeMenu}
              className="block text-white hover:text-[#00F5E0] transition-colors duration-200 py-2"
            >
              Account
            </a>
          </li>
        </ul>
      </div>
    </>
  );
}
