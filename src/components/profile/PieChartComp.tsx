import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Sector,
} from "recharts";
import React, { useState } from "react";
import InfoIcon from "@mui/icons-material/Info";
import {
  Tooltip as MuiToolTip,
  styled,
  tooltipClasses,
  TooltipProps,
} from "@mui/material";

type PropType = {
  spot: number;
  perp: number;
  lending: number;
  balancer: number;
  isDydxFetched: boolean;
};

export function PieChartComp({
  spot,
  perp,
  lending,
  balancer,
  isDydxFetched,
}: PropType) {
  const data = [
    { name: "Spot", value: spot, color: "#0088FE" },
    { name: "Perp", value: perp, color: "#00C49F" },
    { name: "Lending", value: lending, color: "#FFBB28" },
    { name: "Yeild", value: balancer, color: "#FF8042" },
  ];
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const handleMouseEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  const handleMouseLeave = (_: any, index: number) => {
    console.log("leave");

    setActiveIndex(null);
  };

  const renderActiveShape = (props: any) => (
    <g>
      {/*
        You can customize this however you like.
        Here's an example: draw a border around the active slice.
      */}
      <Sector {...props} stroke="#00FAFF" strokeWidth={2} />
    </g>
  );

  const HtmlTooltip = styled(({ className, ...props }: TooltipProps) => (
    <MuiToolTip {...props} classes={{ popper: className }} />
  ))(({ theme }) => ({
    [`& .${tooltipClasses.tooltip}`]: {
      backgroundColor: "#05051299",
      color: "#00F5E0",
      fontSize: 14,
      border: "1px solid #00F5E0",
    },
  }));

  return (
    <div className="flex items-stretch w-full gap-5">
      <div className="relative inline-block">
        <ResponsiveContainer width={400} height={400}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={100}
              outerRadius={120}
              paddingAngle={3}
              activeIndex={activeIndex ?? undefined}
              activeShape={renderActiveShape}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={() => {
                if (activeIndex !== undefined) setActiveIndex(null);
              }}
              stroke="none"
            >
              {data.map((entry, i) => {
                return <Cell key={i} fill={entry.color} />;
              })}
            </Pie>
            <Tooltip
              cursor={true}
              offset={-50}
              formatter={(value: number, name: string) => [`${value}`, name]}
              wrapperStyle={{
                padding: "0px",
                borderRadius: "2px",
                backgroundColor: "transparent",
                border: "none",
                outline: "none",
                pointerEvents: "none",
              }}
              contentStyle={{
                padding: "0px",
                backgroundColor: "transparent",
                border: "none",
                pointerEvents: "none",
              }}
              itemStyle={{
                backgroundColor: "#00FAFF",
                paddingBlock: "2px",
                paddingInline: "6px",
                borderRadius: "8px",
                border: "none",
                pointerEvents: "none",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <p className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          Account Value
        </p>
      </div>

      <div className="flex flex-1 flex-col justify-between ">
        {data.map((data: any, i: number) => {
          return (
            <div
              key={i}
              onMouseEnter={() => handleMouseEnter(null, i)}
              onMouseLeave={() => setActiveIndex(null)}
              className="flex flex-1 justify-between items-center text-center text-xl hover:bg-[rgba(0,250,255,0.1)] rounded-sm px-5"
            >
              <div className="flex items-center gap-2">
                <div
                  style={{ backgroundColor: data.color }}
                  className={`h-1.5 w-1.5 rounded-full`}
                ></div>
                <p>{data.name}</p>
                {data.name === "Perp" && !isDydxFetched && (
                  <HtmlTooltip
                    placement="right"
                    title={
                      <React.Fragment>
                        <a href="https://perp.aggtrade.xyz/">
                          Connect Wallet on Perp to show balance
                        </a>
                      </React.Fragment>
                    }
                    sx={{ marginLeft: 1 }}
                  >
                    <InfoIcon sx={{ color: "#00F5E0" }} />
                  </HtmlTooltip>
                )}
              </div>
              <p>{data.value} USD</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
