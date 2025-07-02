import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { AaveState } from "../types/aave";
import { aaveService } from "../services/lending/aaveService";

export const useAaveStore = create<AaveState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        reserves: null,
        userReserves: null,
        reserveIncentives: null,
        userIncentives: null,
        isLoading: false,
        isUserDataLoading: false,
        error: null,
        currentAccount: null,

        // Actions
        setCurrentAccount: (account) => {
          set({ currentAccount: account });
          if (account) {
            get().fetchUserData(account);
          }
        },

        fetchReserves: async () => {
          set({ isLoading: true, error: null });
          try {
            const reserves = await aaveService.getReserves();

            set({ reserves, isLoading: false });
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : "Unknown error",
              isLoading: false,
            });
          }
        },

        fetchUserData: async (account) => {
          set({ isUserDataLoading: true, error: null });
          try {
            const [userReserves, userIncentives] = await Promise.all([
              aaveService.getUserReserves(account),
              aaveService.getUserIncentives(account),
            ]);
            set({
              userReserves,
              userIncentives,
              isUserDataLoading: false,
            });
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : "Unknown error",
              isUserDataLoading: false,
            });
          }
        },

        fetchIncentives: async () => {
          set({ isLoading: true, error: null });
          try {
            const reserveIncentives = await aaveService.getReserveIncentives();
            set({ reserveIncentives, isLoading: false });
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : "Unknown error",
              isLoading: false,
            });
          }
        },

        clearError: () => set({ error: null }),

        reset: () =>
          set({
            reserves: null,
            userReserves: null,
            reserveIncentives: null,
            userIncentives: null,
            isLoading: false,
            isUserDataLoading: false,
            error: null,
            currentAccount: null,
          }),
      }),
      {
        name: "aave-storage",
        partialize: (state) => ({
          currentAccount: state.currentAccount,
          // Don't persist data, only user preferences
        }),
      }
    ),
    { name: "aave-store" }
  )
);
