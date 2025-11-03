import { Token, TOKENS, KATANA_TOKENS } from "@/utils/spot/TokenList";
import { create } from "zustand";

type ChainId = 747474 | 1;

type TokenPosition = "tokenOne" | "tokenTwo";

type spotStore = {
  tokenOne: Token;
  tokenTwo: Token;
  chartToken: Token; // NEW: Token displayed on chart (independent of swap)
  setTokenOne: (token: Token) => void;
  setTokenTwo: (token: Token) => void;
  setChartToken: (token: Token) => void; // NEW: Update chart token
  switchTokens: () => void; // NEW: Switch tokenOne <-> tokenTwo without affecting chart

  // Unified modal state
  modalOpen: boolean;
  modalTokenPosition: TokenPosition | null;
  openModal: (position: TokenPosition) => void;
  closeModal: () => void;

  chainId: ChainId;
  setChainId: (chainId: ChainId) => void;

  // Method to sync with connected wallet chain
  syncWithConnectedChain: (connectedChainId: number) => void;
};

// Helper function to get default tokens for a chain
const getDefaultTokensForChain = (chainId: ChainId): [Token, Token] => {
  if (chainId === 747474) {
    return [KATANA_TOKENS[0], KATANA_TOKENS[1]];
  }
  return [TOKENS[0], TOKENS[1]];
};

// Helper function to validate and convert chain ID
const getValidChainId = (chainId: number): ChainId => {
  if (chainId === 747474) return 747474;
  return 747474;
};

// Get initial chain ID from window if available (for hydration)
const getInitialChainId = (): ChainId => {
  if (typeof window !== "undefined") {
    try {
      const savedChainId = localStorage.getItem("selectedChainId");
      if (savedChainId) {
        const parsed = parseInt(savedChainId, 10);
        return getValidChainId(parsed);
      }

      if (window.ethereum?.chainId) {
        const chainId = parseInt(window.ethereum.chainId, 16);
        return getValidChainId(chainId);
      }
    } catch (error) {
      console.warn("Failed to get initial chain ID:", error);
    }
  }

  return 747474;
};

const initialChainId = getInitialChainId();
const [initialTokenOne, initialTokenTwo] = getDefaultTokensForChain(initialChainId);

export const useSpotStore = create<spotStore>((set, get) => ({
  tokenOne: initialTokenOne,
  tokenTwo: initialTokenTwo,
  chartToken: initialTokenOne, // NEW: Initialize chart token same as tokenOne
  chainId: initialChainId,

  setTokenOne: (token: Token) => {
    set(() => ({ 
      tokenOne: token,
      chartToken: token // When tokenOne changes manually, update chart
    }));
  },
  
  setTokenTwo: (token: Token) => {
    set(() => ({ tokenTwo: token }));
    // Chart stays on chartToken (doesn't change)
  },

  setChartToken: (token: Token) => {
    set(() => ({ chartToken: token }));
  },

  // NEW: Switch tokens without affecting chart
  switchTokens: () => {
    const { tokenOne, tokenTwo } = get();
    set(() => ({
      tokenOne: tokenTwo,
      tokenTwo: tokenOne,
      // chartToken stays unchanged!
    }));
  },

  modalOpen: false,
  modalTokenPosition: null,
  openModal: (position: TokenPosition) =>
    set({ modalOpen: true, modalTokenPosition: position }),
  closeModal: () => set({ modalOpen: false, modalTokenPosition: null }),

  setChainId: (chainId: ChainId) => {
    const [defaultTokenOne, defaultTokenTwo] = getDefaultTokensForChain(chainId);

    if (typeof window !== "undefined") {
      localStorage.setItem("selectedChainId", chainId.toString());
    }

    set(() => ({
      chainId,
      tokenOne: defaultTokenOne,
      tokenTwo: defaultTokenTwo,
      chartToken: defaultTokenOne, // Reset chart token too
    }));
  },

  syncWithConnectedChain: (connectedChainId: number) => {
    const validChainId = getValidChainId(connectedChainId);
    const currentChainId = get().chainId;

    if (validChainId !== currentChainId) {
      const [defaultTokenOne, defaultTokenTwo] = getDefaultTokensForChain(validChainId);

      if (typeof window !== "undefined") {
        localStorage.setItem("selectedChainId", validChainId.toString());
      }

      set(() => ({
        chainId: validChainId,
        tokenOne: defaultTokenOne,
        tokenTwo: defaultTokenTwo,
        chartToken: defaultTokenOne, // Reset chart token too
      }));
    }
  },
}));