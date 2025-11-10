import { Token, KATANA_TOKENS } from "@/utils/spot/TokenList";
import { create } from "zustand";

// Katana is the only supported chain
type ChainId = 747474;

type TokenPosition = "tokenOne" | "tokenTwo";

type spotStore = {
  tokenOne: Token;
  tokenTwo: Token;
  chartToken: Token; // Token displayed on chart (independent of swap)
  setTokenOne: (token: Token) => void;
  setTokenTwo: (token: Token) => void;
  setChartToken: (token: Token) => void;
  switchTokens: () => void; // Switch tokenOne <-> tokenTwo without affecting chart

  // Unified modal state
  modalOpen: boolean;
  modalTokenPosition: TokenPosition | null;
  openModal: (position: TokenPosition) => void;
  closeModal: () => void;

  chainId: ChainId; // Always 747474 (Katana)
};

// Always use Katana tokens
const initialChainId: ChainId = 747474;
const [initialTokenOne, initialTokenTwo] = [KATANA_TOKENS[0], KATANA_TOKENS[1]];

export const useSpotStore = create<spotStore>((set, get) => ({
  tokenOne: initialTokenOne,
  tokenTwo: initialTokenTwo,
  chartToken: initialTokenOne,
  chainId: initialChainId,

  setTokenOne: (token: Token) => {
    set(() => ({
      tokenOne: token,
      chartToken: token // When tokenOne changes manually, update chart
    }));
  },

  setTokenTwo: (token: Token) => {
    set(() => ({ tokenTwo: token }));
  },

  setChartToken: (token: Token) => {
    set(() => ({ chartToken: token }));
  },

  switchTokens: () => {
    const { tokenOne, tokenTwo } = get();
    set(() => ({
      tokenOne: tokenTwo,
      tokenTwo: tokenOne,
      // chartToken stays unchanged
    }));
  },

  modalOpen: false,
  modalTokenPosition: null,
  openModal: (position: TokenPosition) =>
    set({ modalOpen: true, modalTokenPosition: position }),
  closeModal: () => set({ modalOpen: false, modalTokenPosition: null }),
}));