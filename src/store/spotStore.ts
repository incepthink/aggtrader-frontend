import { Token, TOKENS, KATANA_TOKENS } from "@/utils/spot/TokenList";
import { create } from "zustand";

type ChainId = 1 | 747474;

type TokenPosition = "tokenOne" | "tokenTwo";

type spotStore = {
  tokenOne: Token;
  tokenTwo: Token;
  setTokenOne: (token: Token) => void;
  setTokenTwo: (token: Token) => void;

  // Unified modal state
  modalOpen: boolean;
  modalTokenPosition: TokenPosition | null; // Which token is being selected
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
  // Only allow supported chains, fallback to Ethereum
  if (chainId === 747474) return 747474;
  return 1; // Default to Ethereum for any unsupported chain
};

// Get initial chain ID from window if available (for hydration)
const getInitialChainId = (): ChainId => {
  // Check if we're in browser environment
  if (typeof window !== "undefined") {
    try {
      // Try to get from localStorage for persistence
      const savedChainId = localStorage.getItem("selectedChainId");
      if (savedChainId) {
        const parsed = parseInt(savedChainId, 10);
        return getValidChainId(parsed);
      }

      // Try to get from ethereum provider if available
      if (window.ethereum?.chainId) {
        const chainId = parseInt(window.ethereum.chainId, 16);
        return getValidChainId(chainId);
      }
    } catch (error) {
      console.warn("Failed to get initial chain ID:", error);
    }
  }

  // Fallback to Ethereum
  return 1;
};

const initialChainId = getInitialChainId();
const [initialTokenOne, initialTokenTwo] =
  getDefaultTokensForChain(initialChainId);

export const useSpotStore = create<spotStore>((set, get) => ({
  // Initialize with connected chain or fallback to Ethereum
  tokenOne: initialTokenOne,
  tokenTwo: initialTokenTwo,
  chainId: initialChainId,

  setTokenOne: (token: Token) => {
    set(() => ({ tokenOne: token }));
  },
  setTokenTwo: (token: Token) => {
    set(() => ({ tokenTwo: token }));
  },

  modalOpen: false,
  modalTokenPosition: null,
  openModal: (position: TokenPosition) =>
    set({ modalOpen: true, modalTokenPosition: position }),
  closeModal: () => set({ modalOpen: false, modalTokenPosition: null }),

  setChainId: (chainId: ChainId) => {
    const [defaultTokenOne, defaultTokenTwo] =
      getDefaultTokensForChain(chainId);

    // Persist to localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("selectedChainId", chainId.toString());
    }

    set(() => ({
      chainId,
      tokenOne: defaultTokenOne,
      tokenTwo: defaultTokenTwo,
    }));
  },

  // Method to sync store with connected wallet chain
  syncWithConnectedChain: (connectedChainId: number) => {
    const validChainId = getValidChainId(connectedChainId);
    const currentChainId = get().chainId;

    // Only update if the connected chain is different from current
    if (validChainId !== currentChainId) {
      const [defaultTokenOne, defaultTokenTwo] =
        getDefaultTokensForChain(validChainId);

      // Persist to localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("selectedChainId", validChainId.toString());
      }

      set(() => ({
        chainId: validChainId,
        tokenOne: defaultTokenOne,
        tokenTwo: defaultTokenTwo,
      }));
    }
  },
}));
