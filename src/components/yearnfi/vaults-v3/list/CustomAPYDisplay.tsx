import { Tooltip } from "@mui/material";
import GlowBox from "@/components/common/ui/GlowBox";
import { VaultYieldEntry } from "./VaultsV3ListRow";

interface CustomAPYDisplayProps {
  vaultYieldEntry: VaultYieldEntry;
}

export const CustomAPYDisplay = ({
  vaultYieldEntry,
}: CustomAPYDisplayProps) => {
  return (
    <Tooltip
      title={
        <GlowBox padding={2} spread={12}>
          <div className="flex flex-col gap-2">
            {Object.entries(vaultYieldEntry).map(([key, value]) => {
              return (
                <div className="flex justify-between items-center gap-8 text-[12px]">
                  <p>{key}</p>
                  <p>{value}</p>
                </div>
              );
            })}
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
      <p className=" border-dotted border-b-2 border-white/40 cursor-pointer">
        ⚔️ {vaultYieldEntry?.Total}
      </p>
    </Tooltip>
  );
};
