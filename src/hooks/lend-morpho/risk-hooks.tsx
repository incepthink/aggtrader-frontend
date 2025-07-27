// // Additional hook for external risk data that might not be in the main GraphQL API

// import { VaultDetail } from "./useVaultsQuery";

// export interface RiskScore {
//   score: string; // e.g., "A+", "B", "C"
//   provider: string; // e.g., "Credora", "Gauntlet"
//   details?: string;
// }

// export interface RiskMetrics {
//   riskScore?: RiskScore;
//   curatorTVL: number;
//   deploymentDate: string;
//   version: string;
//   safeRating?: string;
// }

// interface MarketRiskData {
//   uniqueKey: string;
//   loanAsset: string;
//   collateralAsset: string;
//   lltv: number;
//   utilization: number;
//   oracleType: string;
//   supplyAssetsUsd: number;
//   riskLevel: "LOW" | "MEDIUM" | "HIGH";
// }

// /**
//  * Hook to get additional risk data that might come from metadata or external sources
//  */
// export const useVaultRiskData = (vault: VaultDetail): RiskMetrics => {
//   // Calculate risk metrics from vault data
//   const calculateRiskMetrics = (): RiskMetrics => {
//     // Deployment date - note: no creationTimestamp in the interface, so we'll use a default
//     const deploymentDate = new Date().toLocaleDateString("en-US", {
//       year: "numeric",
//       month: "2-digit",
//       day: "2-digit",
//     });

//     // Calculate curator TVL (sum of all assets under management by this curator)
//     const curatorTVL = vault.state.totalAssetsUsd;

//     // Extract version info (this might come from metadata or be hardcoded)
//     const version = "v1.0"; // Default version

//     // Check for risk score in metadata or warnings
//     let riskScore: RiskScore | undefined;
//     if (vault.warnings && vault.warnings.length > 0) {
//       // If there are warnings, derive risk score
//       const hasRedWarnings = vault.warnings.some((w) => w.level === "RED");
//       const hasYellowWarnings = vault.warnings.some(
//         (w) => w.level === "YELLOW"
//       );

//       if (hasRedWarnings) {
//         riskScore = {
//           score: "C",
//           provider: "System",
//           details: "High risk warnings present",
//         };
//       } else if (hasYellowWarnings) {
//         riskScore = {
//           score: "B",
//           provider: "System",
//           details: "Medium risk warnings present",
//         };
//       }
//     }

//     // Check for SAFE rating (this might be in allocators or owner address)
//     let safeRating: string | undefined;
//     if (
//       vault.state.owner.toLowerCase().includes("safe") ||
//       vault.allocators.some((a) => a.address.toLowerCase().includes("safe"))
//     ) {
//       safeRating = "SAFE 5/9"; // Example rating
//     }

//     return {
//       riskScore,
//       curatorTVL,
//       deploymentDate,
//       version,
//       safeRating,
//     };
//   };

//   return calculateRiskMetrics();
// };

// /**
//  * Hook to get market-level risk data
//  */
// export const useMarketRiskData = (vault: VaultDetail): MarketRiskData[] => {
//   const getMarketRisks = (): MarketRiskData[] => {
//     return vault.state.allocation.map((allocation) => {
//       const market = allocation.market;

//       return {
//         uniqueKey: market.uniqueKey,
//         loanAsset: market.loanAsset?.symbol || "Unknown",
//         collateralAsset: market.collateralAsset?.symbol || "Unknown",
//         lltv: market.lltv,
//         utilization: market.state.utilization,
//         oracleType: getOracleType(market.oracleAddress),
//         supplyAssetsUsd: allocation.supplyAssetsUsd,
//         riskLevel: calculateMarketRisk(market),
//       };
//     });
//   };

//   const getOracleType = (oracleAddress: string): string => {
//     // This would need to be mapped from known oracle addresses
//     // For now, return a placeholder
//     return "Chainlink"; // Default assumption
//   };

//   const calculateMarketRisk = (
//     market: VaultDetail["state"]["allocation"][0]["market"]
//   ): "LOW" | "MEDIUM" | "HIGH" => {
//     // Simple risk calculation based on utilization and LLTV
//     const utilization = market.state.utilization;
//     const lltv = market.lltv;

//     if (utilization > 0.8 || lltv > 0.9) {
//       return "HIGH";
//     } else if (utilization > 0.6 || lltv > 0.8) {
//       return "MEDIUM";
//     }
//     return "LOW";
//   };

//   return getMarketRisks();
// };
