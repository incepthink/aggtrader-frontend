import { Avatar, Chip, Tooltip } from "@mui/material";
import GlowBox from "@/components/common/ui/GlowBox";
import { getTokenColor } from "./MarketRow";

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
}

export const BorrowRateSummary = ({
  nativeApr,
  rewards,
}: BorrowRateSummaryProps) => {
  if (rewards.length === 0) {
    return (
      <Chip
        label={`${((nativeApr || 0) * 100).toFixed(2)}%`}
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

  const rewardMap = new Map(rewards.map((i) => [i.asset.symbol, i.borrowApr]));
  console.log("REWARDMAP", rewardMap);
  let rewardAprSum = 0;
  return (
    <Tooltip
      title={
        <GlowBox padding={2} spread={12}>
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center mb-1">
              <p className="text-sm ml-0.5">Native APR:</p>
              <p className=" text-xs">{((nativeApr || 0) * 100).toFixed(2)}%</p>
            </div>

            {rewards.map((i) => {
              rewardAprSum += (i.borrowApr || 0) * 100;
              return (
                <div className="flex items-center justify-between gap-8">
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
      }
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
      <Chip
        label={`${((nativeApr || 0) * 100 - rewardAprSum).toFixed(2)}%`}
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
    </Tooltip>
  );
};
