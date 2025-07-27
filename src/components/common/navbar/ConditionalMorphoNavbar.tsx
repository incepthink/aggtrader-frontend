"use client";
import React from "react";
import { usePathname } from "next/navigation";
import { MorphoNavbar } from "./MorphoNavbar";

export const ConditionalMorphoNavbar: React.FC = () => {
  const pathname = usePathname();
  const shouldShowMorphoNavbar = pathname.startsWith("/lend");

  if (!shouldShowMorphoNavbar) return null;

  return <MorphoNavbar />;
};
