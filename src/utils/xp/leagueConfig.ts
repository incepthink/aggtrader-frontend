// League Configuration

import { LeagueType } from "@/types/xp";

export const leagueColors: Record<LeagueType, string> = {
  bronze: "#CD7F32",
  silver: "#C0C0C0",
  gold: "#FFD700",
  diamond: "#B9F2FF",
};

export const leagueGradients: Record<LeagueType, string> = {
  bronze: "linear-gradient(135deg, rgba(205, 127, 50, 0.2), rgba(205, 127, 50, 0.05))",
  silver: "linear-gradient(135deg, rgba(192, 192, 192, 0.2), rgba(192, 192, 192, 0.05))",
  gold: "linear-gradient(135deg, rgba(255, 215, 0, 0.2), rgba(255, 215, 0, 0.05))",
  diamond: "linear-gradient(135deg, rgba(185, 242, 255, 0.2), rgba(185, 242, 255, 0.05))",
};
