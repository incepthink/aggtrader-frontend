"use client";

import { Box, Typography, LinearProgress, Chip, Alert } from "@mui/material";
import WarningIcon from "@mui/icons-material/Warning";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import SecurityIcon from "@mui/icons-material/Security";
import type { TYDaemonVault } from "@/lib/yearnfi/lib/utils/schemas/yDaemonVaultsSchemas";

type RiskTabProps = {
  vault: TYDaemonVault;
};

function RiskScore({ score }: { score: number }) {
  const getColor = (score: number) => {
    if (score <= 3) return "success.main";
    if (score <= 6) return "warning.main";
    return "error.main";
  };

  const getLabel = (score: number) => {
    if (score <= 3) return "Low Risk";
    if (score <= 6) return "Medium Risk";
    return "High Risk";
  };

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 1,
        }}
      >
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {getLabel(score)}
        </Typography>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {score}/10
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={(score / 10) * 100}
        sx={{
          height: 8,
          borderRadius: 1,
          bgcolor: "rgba(0, 255, 233, 0.1)",
          "& .MuiLinearProgress-bar": {
            bgcolor: getColor(score),
            borderRadius: 1,
          },
        }}
      />
    </Box>
  );
}

function RiskFactor({
  title,
  description,
  status,
}: {
  title: string;
  description: string;
  status: "low" | "medium" | "high";
}) {
  const getIcon = () => {
    if (status === "low") return <CheckCircleIcon color="success" />;
    return <WarningIcon color={status === "medium" ? "warning" : "error"} />;
  };

  const getChipColor = () => {
    if (status === "low") return "success";
    if (status === "medium") return "warning";
    return "error";
  };

  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 2,
        bgcolor: "rgba(0, 255, 233, 0.03)",
        border: "1px solid",
        borderColor: "rgba(0, 255, 233, 0.1)",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 1,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {getIcon()}
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            {title}
          </Typography>
        </Box>
        <Chip
          label={status.toUpperCase()}
          color={getChipColor() as any}
          size="small"
        />
      </Box>
      <Typography variant="body2" sx={{ color: "text.secondary", ml: 4 }}>
        {description}
      </Typography>
    </Box>
  );
}

export function RiskTab({ vault }: RiskTabProps) {
  // Calculate overall risk score (simplified - in production this comes from yDaemon)
  const calculateRiskScore = (): number => {
    let score = 3; // Base score for V3 vaults

    // Add risk for multi-strategy vaults
    if (vault.kind === "Multi Strategy") score += 1;

    // Add risk based on number of strategies
    const strategyCount = vault.strategies?.length || 0;
    if (strategyCount > 3) score += 1;

    // Lower risk for established vaults with high TVL
    if (vault.tvl && vault.tvl.tvl > 10000000) score -= 1;

    return Math.max(1, Math.min(10, score)); // Clamp between 1-10
  };

  const overallRisk = calculateRiskScore();

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {/* Overall Risk Score */}
      <Box>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
          Overall Risk Score
        </Typography>
        <Box
          sx={{
            bgcolor: "rgba(0, 255, 233, 0.05)",
            borderRadius: 2,
            p: 3,
            border: "1px solid",
            borderColor: "rgba(0, 255, 233, 0.2)",
          }}
        >
          <RiskScore score={overallRisk} />
          <Typography
            variant="caption"
            sx={{ display: "block", mt: 2, color: "text.secondary" }}
          >
            This score represents the overall risk level based on strategy
            complexity, vault maturity, TVL, and smart contract risks.
          </Typography>
        </Box>
      </Box>

      {/* Risk Factors */}
      <Box>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
          Risk Factors
        </Typography>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <RiskFactor
            title="Smart Contract Risk"
            description="All vaults carry smart contract risk. Yearn V3 vaults have been audited by multiple security firms."
            status="low"
          />
          <RiskFactor
            title="Strategy Risk"
            description={`This vault deploys funds across ${
              vault.strategies?.length || 0
            } ${
              vault.strategies?.length === 1 ? "strategy" : "strategies"
            }. Each strategy interacts with different DeFi protocols.`}
            status={
              vault.strategies && vault.strategies.length > 3 ? "medium" : "low"
            }
          />
          <RiskFactor
            title="Market Risk"
            description={`The underlying asset (${vault.token.symbol}) is subject to market volatility and price fluctuations.`}
            status="medium"
          />
          <RiskFactor
            title="Liquidity Risk"
            description="Funds may not be instantly withdrawable if strategies are actively deployed in protocols with lock-up periods."
            status="low"
          />
        </Box>
      </Box>

      {/* Security Measures */}
      <Box>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
          Security Measures
        </Typography>
        <Box
          sx={{
            bgcolor: "rgba(0, 255, 233, 0.05)",
            borderRadius: 2,
            p: 3,
            border: "1px solid",
            borderColor: "rgba(0, 255, 233, 0.2)",
          }}
        >
          <Box
            sx={{ display: "flex", alignItems: "flex-start", gap: 2, mb: 2 }}
          >
            <SecurityIcon color="primary" />
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
                Multi-Signature Governance
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                Critical vault operations require approval from multiple signers
                to prevent unauthorized changes.
              </Typography>
            </Box>
          </Box>

          <Box
            sx={{ display: "flex", alignItems: "flex-start", gap: 2, mb: 2 }}
          >
            <SecurityIcon color="primary" />
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
                Audited Smart Contracts
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                Yearn V3 vaults have undergone security audits by leading
                blockchain security firms.
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
            <SecurityIcon color="primary" />
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
                Emergency Shutdown
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                Vaults can be emergency shutdown by governance to protect user
                funds in case of discovered vulnerabilities.
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Important Notice */}
      <Alert severity="warning" icon={<WarningIcon />}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
          Important Disclaimer
        </Typography>
        <Typography variant="body2">
          DeFi protocols carry inherent risks including smart contract
          vulnerabilities, market volatility, and potential loss of funds. Only
          invest what you can afford to lose. Past performance does not
          guarantee future results.
        </Typography>
      </Alert>
    </Box>
  );
}
