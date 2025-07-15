import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Sector,
} from "recharts";
import React, { useState, useEffect } from "react";
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
  isLoading?: boolean;
};

export function PieChartComp({
  spot,
  perp,
  lending,
  balancer,
  isDydxFetched,
  isLoading = false,
}: PropType) {
  const data = [
    { name: "Spot", value: spot, color: "#0088FE" },
    { name: "Perp", value: perp, color: "#00C49F" },
    { name: "Lending", value: lending, color: "#FFBB28" },
    { name: "Yield", value: balancer, color: "#FF8042" },
  ];

  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile on client side
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleMouseEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  const handleMouseLeave = () => {
    setActiveIndex(undefined);
  };

  const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } =
      props;

    return (
      <g>
        <Sector
          {...props}
          stroke="#00FAFF"
          strokeWidth={isMobile ? 2 : 3}
          outerRadius={outerRadius + (isMobile ? 6 : 8)} // Smaller expansion on mobile
          style={{
            filter: "drop-shadow(0 0 12px rgba(0, 250, 255, 0.6))",
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        />
        {/* Add inner glow effect */}
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius - 2}
          outerRadius={innerRadius}
          startAngle={startAngle}
          endAngle={endAngle}
          fill="#00FAFF"
          opacity={0.3}
          style={{
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        />
      </g>
    );
  };

  const HtmlTooltip = styled(({ className, ...props }: TooltipProps) => (
    <MuiToolTip {...props} classes={{ popper: className }} />
  ))(({ theme }) => ({
    [`& .${tooltipClasses.tooltip}`]: {
      backgroundColor: "#05051299",
      color: "#00F5E0",
      fontSize: isMobile ? 12 : 14,
      border: "1px solid #00F5E0",
    },
  }));

  // Responsive chart dimensions
  const chartSize = isMobile ? 280 : 400;
  const innerRadius = isMobile ? 70 : 100;
  const outerRadius = isMobile ? 90 : 120;

  return (
    <div
      className={`flex ${
        isMobile ? "flex-col" : "flex-row"
      } items-stretch w-full ${isMobile ? "gap-4" : "gap-5"}`}
    >
      {/* Chart Container */}
      <div
        className={`relative ${
          isMobile ? "w-full flex justify-center" : "inline-block"
        }`}
      >
        <ResponsiveContainer width={chartSize} height={chartSize}>
          <PieChart>
            <defs>
              {/* Gradient definitions for enhanced visual appeal */}
              <linearGradient
                id="spotGradient"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >
                <stop offset="0%" stopColor="#0088FE" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#0088FE" stopOpacity={1} />
              </linearGradient>
              <linearGradient
                id="perpGradient"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >
                <stop offset="0%" stopColor="#00C49F" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#00C49F" stopOpacity={1} />
              </linearGradient>
              <linearGradient
                id="lendingGradient"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >
                <stop offset="0%" stopColor="#FFBB28" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#FFBB28" stopOpacity={1} />
              </linearGradient>
              <linearGradient
                id="yieldGradient"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >
                <stop offset="0%" stopColor="#FF8042" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#FF8042" stopOpacity={1} />
              </linearGradient>
            </defs>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={innerRadius}
              outerRadius={outerRadius}
              paddingAngle={3}
              activeIndex={activeIndex}
              activeShape={renderActiveShape}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              stroke="none"
              animationBegin={0}
              animationDuration={1200}
              animationEasing="ease-out"
            >
              {data.map((entry, i) => {
                return (
                  <Cell
                    key={i}
                    fill={entry.color}
                    style={{
                      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                      cursor: "pointer",
                    }}
                  />
                );
              })}
            </Pie>
            <Tooltip
              cursor={true}
              offset={-50}
              formatter={(value: number, name: string) => [
                `${value.toFixed(2)}`,
                name,
              ]}
              wrapperStyle={{
                padding: "0px",
                borderRadius: "8px",
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
                paddingBlock: "4px",
                paddingInline: "8px",
                borderRadius: "6px",
                border: "none",
                pointerEvents: "none",
                fontWeight: "500",
                fontSize: isMobile ? "12px" : "14px",
              }}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Center Content */}
        <p className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
          {isLoading ? (
            <span
              className={`text-cyan-400 ${
                isMobile ? "text-base" : "text-lg"
              } animate-pulse`}
            >
              Loading...
            </span>
          ) : activeIndex !== undefined ? (
            <>
              <span
                className={`block ${
                  isMobile ? "text-xl" : "text-2xl"
                } font-bold text-[#00FAFF] mt-1`}
              >
                {(
                  (data[activeIndex].value /
                    (spot + perp + lending + balancer)) *
                  100
                ).toFixed(1)}
                %
              </span>
              <span
                className={`block ${
                  isMobile ? "text-xs" : "text-sm"
                } text-gray-300 mt-1`}
              >
                {data[activeIndex].value.toFixed(2)} USD
              </span>
            </>
          ) : (
            <>
              <span
                className={`block ${
                  isMobile ? "text-xs" : "text-sm"
                } text-gray-400`}
              >
                Account Value
              </span>
              <span
                className={`block ${
                  isMobile ? "text-base" : "text-lg"
                } font-semibold text-white mt-1`}
              >
                {(spot + perp + lending + balancer).toFixed(2)} USD
              </span>
            </>
          )}
        </p>
      </div>

      {/* Legend Container */}
      <div
        className={`flex ${
          isMobile ? "flex-row flex-wrap gap-2" : "flex-1 flex-col"
        } justify-between ${isMobile ? "" : ""}`}
      >
        {data.map((dataItem: any, i: number) => {
          return (
            <div
              key={i}
              onMouseEnter={() => handleMouseEnter(null, i)}
              onMouseLeave={() => setActiveIndex(undefined)}
              className={`flex ${
                isMobile
                  ? "flex-1 min-w-[calc(50%-4px)] flex-col"
                  : "flex-1 flex-row"
              } justify-between items-center text-center ${
                isMobile ? "text-sm" : "text-xl"
              } rounded-sm ${
                isMobile ? "p-3" : "px-5"
              } cursor-pointer transition-all duration-300 ease-out ${
                activeIndex === i
                  ? "bg-[rgba(0,250,255,0.15)] border-l-2 border-[#00FAFF] transform scale-[1.02]"
                  : "hover:bg-[rgba(0,250,255,0.1)] border-l-2 border-transparent"
              }`}
              style={{
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            >
              <div
                className={`flex items-center ${
                  isMobile ? "justify-center mb-2" : ""
                } gap-2`}
              >
                <div
                  style={{
                    backgroundColor: dataItem.color,
                    boxShadow:
                      activeIndex === i ? `0 0 8px ${dataItem.color}` : "none",
                  }}
                  className={`h-1.5 w-1.5 rounded-full transition-all duration-300 ${
                    activeIndex === i ? "scale-150" : ""
                  }`}
                ></div>
                <p
                  className={`transition-colors duration-300 ${
                    activeIndex === i ? "text-[#00FAFF]" : ""
                  } ${isMobile ? "text-sm" : ""}`}
                >
                  {dataItem.name}
                </p>
                {dataItem.name === "Perp" && !isDydxFetched && (
                  <HtmlTooltip
                    placement={isMobile ? "top" : "right"}
                    title={
                      <React.Fragment>
                        <a href="https://perp.aggtrade.xyz/">
                          Connect Wallet on Perp to show balance
                        </a>
                      </React.Fragment>
                    }
                    sx={{ marginLeft: 1 }}
                  >
                    <InfoIcon
                      sx={{ color: "#00F5E0", fontSize: isMobile ? 16 : 20 }}
                    />
                  </HtmlTooltip>
                )}
              </div>
              <p
                className={`transition-colors duration-300 ${
                  activeIndex === i ? "text-[#00FAFF] font-semibold" : ""
                } ${isMobile ? "text-xs text-center" : ""}`}
              >
                {dataItem.value.toFixed(2)} USD
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
