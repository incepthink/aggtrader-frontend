import type {
  ReserveDataHumanized,
  UserReserveDataHumanized,
  ReservesIncentiveDataHumanized,
  UserReservesIncentivesDataHumanized,
  ReservesDataHumanized,
} from "@aave/contract-helpers";

// Re-export the official types for consistency
export type {
  ReserveDataHumanized,
  UserReserveDataHumanized,
  ReservesIncentiveDataHumanized,
  UserReservesIncentivesDataHumanized,
  ReservesDataHumanized,
} from "@aave/contract-helpers";

// Use the official types directly
export type ReservesData = ReservesDataHumanized;
export type UserReservesData = UserReserveDataHumanized;

export interface AaveState {
  // Data
  reserves: ReservesData | null;
  userReserves: UserReserveDataHumanized[] | null;
  reserveIncentives: ReservesIncentiveDataHumanized[] | null;
  userIncentives: UserReservesIncentivesDataHumanized[] | null;

  // Loading states
  isLoading: boolean;
  isUserDataLoading: boolean;

  // Error states
  error: string | null;

  // User
  currentAccount: string | null;

  // Actions
  setCurrentAccount: (account: string | null) => void;
  fetchReserves: () => Promise<void>;
  fetchUserData: (account: string) => Promise<void>;
  fetchIncentives: () => Promise<void>;
  clearError: () => void;
  reset: () => void;
}
