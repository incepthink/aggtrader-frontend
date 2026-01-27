"use client";
import React from "react";
import { usePathname } from "next/navigation";
import { PerpNavbar } from "./PerpNavbar";

export const ConditionalPerpNavbar: React.FC = () => {
  const pathname = usePathname();
  const shouldShowPerpNavbar = pathname.startsWith("/perp");

  if (!shouldShowPerpNavbar) return null;

  return <PerpNavbar />;
};
