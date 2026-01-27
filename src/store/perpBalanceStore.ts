import { create } from "zustand";
import { KatanaPerpsAccountBalance } from "@/hooks/perp/useKumaAuth";

interface PerpBalanceStore {
  accountBalance: KatanaPerpsAccountBalance | null;
  isAssociated: boolean;
  setAccountBalance: (balance: KatanaPerpsAccountBalance | null) => void;
  setIsAssociated: (associated: boolean) => void;
}

export const usePerpBalanceStore = create<PerpBalanceStore>((set, get) => ({
  accountBalance: null,
  isAssociated: false,
  setAccountBalance: (balance) => {
    const current = get().accountBalance;
    // Only update if equity value actually changed (main indicator of balance change)
    if (current?.equity === balance?.equity) {
      return;
    }
    set({ accountBalance: balance });
  },
  setIsAssociated: (associated) => {
    // Only update if value actually changed
    if (get().isAssociated === associated) {
      return;
    }
    set({ isAssociated: associated });
  },
}));
