"use client";
import React from "react";
import { usePathname } from "next/navigation";
import { SpotNavbar } from "./SpotNavbar";

export const ConditionalSpotNavbar: React.FC = () => {
  const pathname = usePathname();
  const shouldShowMorphoNavbar = pathname.startsWith("/spot");

  if (!shouldShowMorphoNavbar) return null;

  return <SpotNavbar />;
};
