"use client";

// src/components/Navbar.tsx
import React from "react";
import NavLink from "./Navlink";
import { ConnectButton } from "@rainbow-me/rainbowkit";

const navItems = [
  { href: "/spot", label: "Spot" },
  { href: "/lending", label: "Lend/Borrow" },
  { href: "/perp", label: "Perps" },
  { href: "/profile", label: "Account" },
];

function GradientConnectButton() {
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
            className="bg-gradient-to-r from-[#00F5E0] to-[#00FAFF] text-black font-medium p-2 rounded-lg hover:opacity-90 transition-opacity"
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
    <nav className="sticky top-0 bg-transparent shadow flex justify-between items-center p-4 px-10">
      <h2 className=" font-semibold text-2xl">AggTrade</h2>
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
