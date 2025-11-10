"use client";

// src/components/Navbar.tsx
import React, { useState } from "react";
import NavLink from "./Navlink";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Menu, Close } from "@mui/icons-material";
import { NetworkSelector } from "./NetworkSelector";
import { Typography } from "@mui/material";
import KatanaLogo from "./KatanaLogo";

const navItems = [
  {
    href: ["/spot/swap", "/spot/pools"],
    label: "SPOT",
  },
  { href: ["/earn/lend", "/earn/borrow", "/earn/vault"], label: "EARN" },
  { href: ["/referrals"], label: "REFERRALS" },
  { href: ["/profile"], label: "ACCOUNT" },
  {
    href: [
      "https://relay.link/bridge/katana?fromChainId=1&fromCurrency=0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48&toCurrency=0x203a662b0bd271a6ed5a60edfbd04bfce608fd36",
    ],
    label: "BRIDGE",
  },
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

        // Default navbar styling
        const defaultStyles = `bg-gradient-to-r from-[#00F5E0] to-[#00FAFF] text-black font-semibold p-2 px-3 rounded-sm hover:ring-2 hover:ring-[#00F5E0] hover:ring-offset-2 hover:ring-offset-gray-900
   hover:shadow-[0_0_4px_rgba(0,245,224,0.8),0_0_8px_rgba(0,245,224,0.7),0_0_12px_rgba(0,245,224,0.6),0_0_18px_rgba(0,245,224,0.5),0_0_24px_rgba(0,245,224,0.4)]
   transition-all duration-300 cursor-pointer flex gap-3 items-center text-sm justify-center whitespace-nowrap`;

        // Form variant styling (matches your button design)
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
          </h2>
          <svg
            width="59"
            height="24"
            viewBox="0 0 59 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect width="59" height="24" fill="#F6FF0D"></rect>
            <path
              d="M22.012 12.114L23.697 8.911C23.726 8.856 23.715 8.785 23.671 8.738L21.379 6.447L19.088 4.157C19.043 4.113 18.973 4.102 18.917 4.131L15.429 5.816L11.94 4.131C11.884 4.101 11.814 4.112 11.768 4.157L9.476 6.448L7.185 8.738C7.141 8.783 7.13 8.856 7.159 8.911L8.844 12.114L7.159 15.316C7.13 15.372 7.141 15.442 7.185 15.489L9.476 17.78L11.768 20.07C11.796 20.099 11.833 20.113 11.871 20.113C11.961 20.126 15.205 18.432 15.286 18.412C15.352 18.429 18.627 20.129 18.699 20.113C18.737 20.113 18.775 20.099 18.803 20.07L21.094 17.78L23.386 15.489C23.429 15.444 23.441 15.372 23.412 15.316L22.012 12.114ZM20.654 9.883V12.353H17.159V11.091L20.654 9.927L20.703 10.027V9.883ZM13.455 13.877L13.12 13.542H17.692L17.399 13.877C17.32 13.956 15.551 15.725 15.429 15.85C15.298 15.718 13.542 13.963 13.455 13.877ZM10.254 9.783L13.696 10.9V12.353H10.201V9.882L10.254 9.782V9.783Z"
              fill="#070B20"
            ></path>
            <path
              d="M32.262 16.423C31.459 16.423 30.894 16.111 30.606 15.524V16.399H29.646V7.999H30.719V11.264C31.011 10.796 31.542 10.543 32.262 10.543H32.862C33.978 10.543 34.722 11.288 34.722 12.452V14.514C34.722 15.679 33.978 16.423 32.862 16.423H32.262ZM30.719 14.084C30.719 14.804 31.087 15.175 31.758 15.175H32.647C33.294 15.175 33.663 14.852 33.663 14.251V12.715C33.663 12.113 33.294 11.778 32.74 11.778H31.758C31.087 11.778 30.719 12.163 30.719 12.896V14.084ZM38.076 16.423C36.839 16.423 36.047 15.679 36.047 14.49V12.524C36.047 11.336 36.839 10.543 38.076 10.543H38.845C40.082 10.543 40.874 11.336 40.874 12.524V13.645H37.057V14.347C37.057 14.9 37.413 15.244 38.052 15.244H38.869C39.493 15.244 39.874 14.925 39.874 14.372V14.215H40.874V14.49C40.874 15.679 40.094 16.423 38.845 16.423H38.076ZM37.057 13.165H39.888V13.008C39.888 12.442 39.52 12.11 38.893 12.11H38.028C37.401 12.11 37.057 12.442 37.057 13.008V13.165ZM44.103 16.399C43.098 16.399 42.593 15.884 42.593 14.816V11.872H41.617V10.567H42.593V8.744H43.666V10.567H44.811V11.872H43.666V14.503C43.666 14.924 43.844 15.126 44.241 15.126H44.787V16.399H44.103ZM48.114 16.423C46.974 16.423 46.206 15.679 46.206 14.514V12.452C46.206 11.288 46.974 10.543 48.114 10.543H48.714C49.434 10.543 49.965 10.796 50.257 11.264V10.567H51.33V16.399H50.369V15.524C50.081 16.111 49.516 16.423 48.714 16.423H48.114ZM47.279 14.251C47.279 14.852 47.648 15.175 48.283 15.175H49.196C49.867 15.175 50.257 14.804 50.257 14.084V12.896C50.257 12.163 49.867 11.778 49.196 11.778H48.186C47.648 11.778 47.279 12.113 47.279 12.715V14.251Z"
              fill="#070B20"
            ></path>
          </svg>
        </a>

        {/* Desktop Navigation */}
        <ul className="hidden lg:flex list-none gap-6 m-0 p-4">
          {navItems.map(({ href, label }) => (
            <li key={href[0]}>
              <NavLink href={href}>{label}</NavLink>
            </li>
          ))}
        </ul>

        {/* Desktop Network Selector and Connect Button */}
        <div className="hidden lg:flex items-center gap-2">
          <div className="-mr-12">
            <KatanaLogo />
          </div>
          <GradientConnectButton />
        </div>

        {/* Mobile Menu Button and Connect Button */}
        <div className="lg:hidden flex items-center gap-1.5">
          <div className="-mr-10 hidden sm:block">
            <KatanaLogo />
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

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
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
        <div className="pt-4 pl-2 border-gray-700">
          <div className="">
            <KatanaLogo />
          </div>
        </div>

        <ul className="flex flex-col p-4 gap-4">
          {navItems.map(({ href, label }) => (
            <li key={href[0]}>
              <a
                href={href[0]}
                onClick={closeMenu}
                className="block text-white hover:text-[#00F5E0] transition-colors duration-200 py-2"
              >
                {label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
