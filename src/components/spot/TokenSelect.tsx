"use client";

import { useSpotStore } from "@/store/spotStore";
import { TOKENS } from "@/utils/spot/TokenList";
import React from "react";

const TokenSelect = () => {
  const tokenOne = useSpotStore((state) => state.tokenOne);
  const setTokenOne = useSpotStore((state) => state.setTokenOne);

  return (
    <select
      value={tokenOne.symbol}
      onChange={(e) => {
        const token = TOKENS.find((t) => t.symbol === e.target.value)!;
        setTokenOne(token);
      }}
      className="neon-bg px-10 py-3 outline-none text-left rounded-md border-0"
    >
      {TOKENS.map((t) => (
        <option
          key={t.symbol}
          value={t.symbol}
          style={{ display: "flex", gap: "10px" }}
        >
          <img style={{ width: "100px" }} src={t.logo} alt="logo" />{" "}
          <p>{t.symbol}</p>
        </option>
      ))}
    </select>
  );
};

export default TokenSelect;
