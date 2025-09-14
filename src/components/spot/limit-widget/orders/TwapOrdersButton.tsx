"use client";

import React, { useState } from "react";
import { useAccount } from "wagmi";
import { TwapOrdersDialog } from "./TwapOrdersDialog";

export const TwapOrdersButton = () => {
  const { address } = useAccount();
  const [isOrdersDialogOpen, setIsOrdersDialogOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOrdersDialogOpen(true)}
        disabled={!address}
        className={`w-full py-3 px-4 rounded-xl font-medium transition-colors ${
          !address
            ? "bg-gray-600 text-gray-400 cursor-not-allowed"
            : "bg-gray-700 text-white hover:bg-gray-600 border border-gray-600"
        }`}
      >
        Orders
      </button>

      <TwapOrdersDialog
        isOpen={isOrdersDialogOpen}
        onClose={() => setIsOrdersDialogOpen(false)}
      />
    </>
  );
};
