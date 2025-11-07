"use client";

import { VaultProviders } from "@/lib/yearnfi/lib/contexts/Providers";

export default function VaultLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <VaultProviders>{children}</VaultProviders>;
}
