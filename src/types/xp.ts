// XP Dashboard Types

export type LeagueType = "bronze" | "silver" | "gold" | "diamond";

export interface WeeklyData {
  week_start: string;
  week_end: string;
  league: LeagueType;
  total_xp: number;
  swap_xp_raw: number;
  swap_xp_decayed: number;
  pair_bonus_xp: number;
  eligible_volume: number;
  total_fees: number;
  unique_pairs_count: number;
  new_pairs_count: number;
  total_swaps: number;
  calculated_at: string;
}

export interface XpDashboardData {
  wallet_address: string;
  total_xp: number;
  total_weeks: number;
  weekly_data: WeeklyData[];
}

export interface ApiResponse {
  status: "success" | "error";
  data?: XpDashboardData;
  msg?: string;
}

// XP Preview Types (Expected Points)
export interface PerPairResult {
  pair: string;
  eligibleVolume: number;
  totalFees: number;
  xp_raw: number;
  xp_decayed: number;
  decayFraction: number;
}

export interface SwapTypeBreakdown {
  classic: number;
  limitOrder: number;
  total: number;
  classicVolume: number;
  limitOrderVolume: number;
}

export interface XpPreviewData {
  wallet_address: string;
  user_id: number;
  week_start: string;
  week_end: string;
  league: LeagueType;
  swap_xp_raw: number;
  swap_xp_decayed: number;
  pair_bonus_xp: number;
  total_xp: number;
  eligible_volume: number;
  total_fees: number;
  unique_pairs_count: number;
  new_pairs_count: number;
  total_swaps: number;
  per_pair_results: PerPairResult[];
  new_pairs: string[];
  swap_type_breakdown: SwapTypeBreakdown;
  is_preview: boolean;
  calculated_at: string;
  cached: boolean;
}
