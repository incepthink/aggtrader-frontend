import { TokenInfo, TOKENS } from "@/utils/spot/TokenList";
import { create } from "zustand";

type spotStore = {
  tokenOne: TokenInfo;
  tokenTwo: TokenInfo;
  setTokenOne: (token: TokenInfo) => void;
  setTokenTwo: (token: TokenInfo) => void;
};

export const useSpotStore = create<spotStore>((set) => ({
  tokenOne: TOKENS[0],
  tokenTwo: TOKENS[1],
  setTokenOne: (token: TokenInfo) => {
    set(() => ({ tokenOne: token }));
  },
  setTokenTwo: (token: TokenInfo) => {
    set(() => ({ tokenTwo: token }));
  },
}));
