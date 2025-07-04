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
  { href: "/lending", label: "Lend/Borrow" },
  { href: "https://perp.aggtrade.xyz/", label: "Perps" },
  { href: "https://yield.aggtrade.xyz/", label: "Yeild Farming" },
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
            className="bg-gradient-to-r from-[#00F5E0] to-[#00FAFF] text-black font-medium p-2 rounded-lg hover:opacity-90 
    hover:shadow-[0_0_8px_rgba(0,245,224,0.6),0_0_16px_rgba(0,245,224,0.5),0_0_24px_rgba(0,245,224,0.4)]
    transition-shadow"
          >
            {connected
              ? account.displayName // only displays address truncated
              : "Connect Wallet"}
          </button>
        );
      }}
    </ConnectButton.Custom>
  );
}

export default function Navbar() {
  return (
    <nav className="sticky top-0 bg-transparent shadow flex justify-between items-center p-2 px-10 z-10 backdrop-blur-2xl">
      <a className=" font-semibold text-2xl flex items-center gap-2" href="/">
        <div className="w-10">
          <img
            src="/assets/aggtrade.png"
            alt=""
            className="w-full object-cover"
          />
        </div>
        AggTrade
      </a>
      <ul className="flex space-x-4 p-4">
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
