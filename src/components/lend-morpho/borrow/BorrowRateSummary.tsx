import { Avatar, Chip, Tooltip, Typography } from "@mui/material";
import GlowBox from "@/components/common/ui/GlowBox";
import { getTokenColor } from "./marketTable/MarketRow";

interface Rewards {
  borrowApr: number;
  supplyApr: number;
  asset: {
    symbol: string;
  };
}

interface BorrowRateSummaryProps {
  nativeApr: number;
  rewards: Rewards[];
  /**
   * Display mode for the component
   * @default "chip" - Shows as a Chip component
   * "inline" - Shows as Typography with dotted underline
   */
  displayMode?: "chip" | "inline";
}

export const BorrowRateSummary = ({
  nativeApr,
  rewards,
  displayMode = "chip",
}: BorrowRateSummaryProps) => {
  const percentageText = `${((nativeApr || 0) * 100).toFixed(2)}%`;

  if (rewards.length === 0) {
    if (displayMode === "inline") {
      return (
        <Typography
          variant="h4"
          sx={{
            fontWeight: "bold",
            color: "#f44336",
            display: "inline-block",
          }}
        >
          {percentageText}
        </Typography>
      );
    }

    return (
      <Chip
        label={percentageText}
        size="small"
        sx={{
          backgroundColor: "primary.main",
          color: "primary.dark",
          fontSize: "12px",
          fontWeight: "600",
          height: "24px",
          "& .MuiChip-label": {
            padding: "0 8px",
          },
        }}
      />
    );
  }

  // const rewardMap = new Map(rewards.map((i) => [i.asset.symbol, i.borrowApr]));
  // console.log("REWARDMAP", rewardMap);
  let rewardAprSum = 0;

  const tooltipContent = (
    <GlowBox padding={2} spread={12}>
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center mb-1">
          <p className="text-sm ml-0.5">Native APR:</p>
          <p className=" text-xs">{((nativeApr || 0) * 100).toFixed(2)}%</p>
        </div>

        {rewards.map((i) => {
          rewardAprSum += (i.borrowApr || 0) * 100;
          return (
            <div
              key={i.asset.symbol}
              className="flex items-center justify-between gap-8"
            >
              <div className="flex gap-2 items-center">
                <Avatar
                  sx={{
                    width: 24,
                    height: 24,
                    fontSize: "8x",
                    fontWeight: 600,
                    backgroundColor: getTokenColor(i.asset.symbol || ""),
                  }}
                >
                  <p className="text-xs">
                    {(i.asset.symbol || "").substring(0, 2).toUpperCase()}
                  </p>
                </Avatar>
                <p className="text-sm">{i.asset.symbol}</p>
              </div>
              <p className="text-xs">
                -{((i.borrowApr || 0) * 100).toFixed(2)}%
              </p>
            </div>
          );
        })}
        <div className="flex justify-between items-center pt-2 border-t-teal-400/30 border-t-2">
          <p className="text-sm ml-0.5">Net Rate:</p>
          <p className="text-green-400 text-xs">
            {((nativeApr || 0) * 100 - rewardAprSum).toFixed(2)}%
          </p>
        </div>
      </div>
    </GlowBox>
  );

  const netRateText = `${((nativeApr || 0) * 100 - rewardAprSum).toFixed(2)}%`;

  return (
    <Tooltip
      title={tooltipContent}
      placement="top"
      arrow
      slotProps={{
        popper: {
          modifiers: [
            {
              name: "offset",
              options: {
                offset: [0, -8],
              },
            },
          ],
        },
        tooltip: {
          sx: {
            backgroundColor: "transparent",
            padding: 0,
          },
        },
        arrow: {
          sx: {
            color: "primary.dark",
          },
        },
      }}
      TransitionProps={{
        timeout: 300,
      }}
    >
      {displayMode === "inline" ? (
        <Typography
          variant="h4"
          sx={{
            fontWeight: "bold",
            color: "#4caf50",
            display: "inline-block",
            borderBottom: "2px dotted rgba(255,255,255,0.6)",
            cursor: "pointer",
          }}
        >
          {netRateText}
        </Typography>
      ) : (
        <Chip
          label={netRateText}
          size="small"
          sx={{
            backgroundColor: "primary.main",
            color: "primary.dark",
            fontSize: "12px",
            fontWeight: "600",
            height: "24px",
            cursor: "pointer",
            "& .MuiChip-label": {
              padding: "0 8px",
            },
          }}
        />
      )}
    </Tooltip>
  );
};
