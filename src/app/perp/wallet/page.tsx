"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function WalletPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/perp/wallet/positions");
  }, [router]);

  return null;
}
