"use client";

// src/components/Navbar.tsx
import React from "react";
import NavLink from "./Navlink";
import { ConnectButton } from "@rainbow-me/rainbowkit";

const navItems = [
  {
    href: "/spot",
    label: "Spot",
  },
  { href: "https://perp.aggtrade.xyz/", label: "Perps" },
  { href: "https://lending.aggtrade.xyz/", label: "Lend/Borrow" },
  { href: "https://yield.aggtrade.xyz/", label: "Yield Farming" },
  { href: "/profile", label: "Account" },
];

export function GradientConnectButton() {
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

        return (
          <button
            onClick={connected ? openAccountModal : openConnectModal}
            className="bg-gradient-to-r from-[#00F5E0] to-[#00FAFF] text-black font-semibold p-2 px-3 rounded-sm hover:opacity-90 
    hover:shadow-[0_0_8px_rgba(0,245,224,0.6),0_0_16px_rgba(0,245,224,0.5),0_0_24px_rgba(0,245,224,0.4)]
    transition-shadow flex gap-3 text-sm"
          >
            {connected ? (
              <>
                <div>
                  {/* ENS avatar or blockie fallback */}
                  <img
                    src={"/avatar.svg"}
                    alt="User avatar"
                    className="w-5 h-5 rounded-full"
                  />
                </div>
                <span>{account.displayName}</span>
              </>
            ) : (
              "Connect Wallet"
            )}
          </button>
        );
      }}
    </ConnectButton.Custom>
  );
}

export default function Navbar() {
  return (
    <nav className="sticky top-0 bg-transparent shadow flex justify-between items-center p-2 px-10 z-10 backdrop-blur-2xl">
      <a
        href="/"
        style={{ display: "flex", gap: "10px", alignItems: "center" }}
      >
        <div style={{ width: "40px" }}>
          <img
            src="/assets/aggtrade.png"
            alt=""
            style={{ width: "100%", objectFit: "cover" }}
          />
        </div>
        <h2
          style={{
            fontSize: "1.5rem",
            fontWeight: 600,
            margin: 0,
            cursor: "pointer",
            color: "white",
          }}
        >
          AggTrade
        </h2>
      </a>
      <ul
        style={{
          listStyle: "none",
          display: "flex",
          gap: "24px",
          margin: 0,
        }}
        className="p-4"
      >
        {navItems.map(({ href, label }) => (
          <li key={href}>
            <NavLink href={href}>{label}</NavLink>
          </li>
        ))}
      </ul>
      <GradientConnectButton />
    </nav>
  );
}
