"use client";
import React from "react";
import { usePathname } from "next/navigation";
import { PerpNavbar } from "./PerpNavbar";
import { usePerpMobile } from "@/hooks/perp/usePerpResponsive";

export const ConditionalPerpNavbar: React.FC = () => {
  const pathname = usePathname();
  const isMobile = usePerpMobile();
  const shouldShowPerpNavbar = pathname.startsWith("/perp");

  if (!shouldShowPerpNavbar || isMobile) return null;

  return <PerpNavbar />;
};
