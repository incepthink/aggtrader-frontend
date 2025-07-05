"use client";
import { useSpotStore } from "@/store/spotStore";
import React from "react";

const TokenSelect = () => {
  const { tokenOne, openModal } = useSpotStore();

  return (
    <button
      onClick={openModal}
      className="neon-bg px-6 py-3 rounded-md flex items-center gap-4 cursor-pointer border-0"
    >
      <div className="w-8">
        <img
          src={tokenOne.img}
          alt={tokenOne.ticker}
          className="w-full object-cover"
        />
      </div>
      <span>{tokenOne.ticker}</span>
    </button>
  );
};

export default TokenSelect;
