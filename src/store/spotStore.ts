import { Token, TOKENS } from "@/utils/spot/TokenList";
import { create } from "zustand";

type spotStore = {
  tokenOne: Token;
  tokenTwo: Token;
  setTokenOne: (token: Token) => void;
  setTokenTwo: (token: Token) => void;

  modalOpenOne: boolean;
  modalOpenTwo: boolean;
  openModalOne: () => void;
  openModalTwo: () => void;
  closeModalOne: () => void;
  closeModalTwo: () => void;
};

export const useSpotStore = create<spotStore>((set) => ({
  tokenOne: TOKENS[0],
  tokenTwo: TOKENS[1],
  setTokenOne: (token: Token) => {
    set(() => ({ tokenOne: token }));
  },
  setTokenTwo: (token: Token) => {
    set(() => ({ tokenTwo: token }));
  },
  modalOpenOne: false,
  modalOpenTwo: false,
  openModalOne: () => set({ modalOpenOne: true }),
  openModalTwo: () => set({ modalOpenTwo: true }),
  closeModalOne: () => set({ modalOpenOne: false }),
  closeModalTwo: () => set({ modalOpenTwo: false }),
}));
