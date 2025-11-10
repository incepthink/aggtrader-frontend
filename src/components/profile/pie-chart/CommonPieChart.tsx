// components/charts/CommonPieChart.tsx
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Sector,
} from "recharts";
import React, { useState, useEffect } from "react";

export interface PieDataItem {
  name: string;
  value: number;
  color: string;
  balance: number;
  symbol: string;
}

interface CommonPieChartProps {
  data: PieDataItem[];
  isLoading?: boolean;
  centerLabel?: string;
}

export function CommonPieChart({
  data,
  isLoading = false,
  centerLabel = "Total Portfolio",
}: CommonPieChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 1280 && width < 1600);
    };
    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  const totalValue = data.reduce((sum, item) => sum + item.value, 0);

  const handleMouseEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  const handleMouseLeave = () => {
    setActiveIndex(undefined);
  };

  const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle } = props;
    return (
      <g>
        <Sector
          {...props}
          stroke="#00FAFF"
          strokeWidth={isMobile ? 2 : 3}
          outerRadius={outerRadius + (isMobile ? 6 : 8)}
          style={{
            filter: "drop-shadow(0 0 12px rgba(0, 250, 255, 0.6))",
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        />
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

  const chartSize = isMobile ? 280 : isTablet ? 310 : 400;
  const innerRadius = isMobile ? 70 : isTablet ? 70 : 100;
  const outerRadius = isMobile ? 90 : isTablet ? 90 : 120;

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
              {data.map((entry, index) => (
                <linearGradient
                  key={`gradient-${index}`}
                  id={`gradient-${index}`}
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="0%"
                >
                  <stop offset="0%" stopColor={entry.color} stopOpacity={0.9} />
                  <stop offset="100%" stopColor={entry.color} stopOpacity={1} />
                </linearGradient>
              ))}
            </defs>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={innerRadius}
              outerRadius={outerRadius}
              paddingAngle={2}
              activeIndex={activeIndex}
              activeShape={renderActiveShape}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              stroke="none"
              animationBegin={0}
              animationDuration={1200}
              animationEasing="ease-out"
            >
              {data.map((entry, i) => (
                <Cell
                  key={i}
                  fill={`url(#gradient-${i})`}
                  style={{
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    cursor: "pointer",
                  }}
                />
              ))}
            </Pie>
            <Tooltip
              cursor={true}
              offset={-50}
              formatter={(value: number, name: string) => [
                `$${(value as number).toFixed(2)}`,
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
          ) : activeIndex !== undefined && data[activeIndex] ? (
            <>
              <span
                className={`block ${
                  isMobile ? "text-xl" : "text-2xl"
                } font-bold text-[#00FAFF] mt-1`}
              >
                {totalValue > 0
                  ? ((data[activeIndex].value / totalValue) * 100).toFixed(1)
                  : "0.0"}
                %
              </span>
              <span
                className={`block ${
                  isMobile ? "text-xs" : "text-sm"
                } text-gray-300 mt-1`}
              >
                ${data[activeIndex].value.toFixed(2)}
              </span>
            </>
          ) : (
            <>
              <span
                className={`block ${
                  isMobile ? "text-xs" : "text-sm"
                } text-gray-400`}
              >
                {centerLabel}
              </span>
              <span
                className={`block ${
                  isMobile ? "text-base" : "text-lg"
                } font-semibold text-white mt-1`}
              >
                ${totalValue.toFixed(2)}
              </span>
            </>
          )}
        </p>
      </div>

      {/* Legend Container */}
      <div
        className={`flex ${
          isMobile ? "flex-row flex-wrap gap-2" : "flex-1 flex-col"
        } justify-between`}
      >
        {data.map((dataItem: PieDataItem, i: number) => {
          const percentage =
            totalValue > 0 ? (dataItem.value / totalValue) * 100 : 0;

          return (
            <div
              key={i}
              onMouseEnter={() => handleMouseEnter(null, i)}
              onMouseLeave={handleMouseLeave}
              className={`flex ${
                isMobile
                  ? "flex-1 min-w-[calc(50%-4px)] flex-col"
                  : "flex-1 flex-row"
              } justify-between items-center text-center ${
                isMobile ? "text-sm" : "text-lg"
              } rounded-lg ${
                isMobile ? "p-3" : "px-4 py-3"
              } cursor-pointer transition-all duration-300 ease-out ${
                activeIndex === i
                  ? "bg-black/30 border-l-2 border-[#00FAFF] transform scale-[1.02] shadow-lg"
                  : "hover:bg-black/20 border-l-2 border-transparent hover:border-cyan-400/40"
              } border border-white/5 hover:border-cyan-400/20`}
              style={{
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            >
              <div
                className={`flex items-center ${
                  isMobile ? "justify-center mb-2" : ""
                } gap-3`}
              >
                <div
                  style={{
                    backgroundColor: dataItem.color,
                    boxShadow:
                      activeIndex === i ? `0 0 8px ${dataItem.color}` : "none",
                  }}
                  className={`h-3 w-3 rounded-full transition-all duration-300 ${
                    activeIndex === i ? "scale-125" : ""
                  }`}
                ></div>
                <div className="flex flex-col items-start">
                  <p
                    className={`transition-colors duration-300 font-medium ${
                      activeIndex === i ? "text-[#00FAFF]" : "text-white"
                    } ${isMobile ? "text-sm" : "text-base"}`}
                  >
                    {dataItem.name}
                  </p>
                  <p className="text-xs text-gray-400">
                    {dataItem.balance.toFixed(4)} {dataItem.symbol}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p
                  className={`transition-colors duration-300 font-medium ${
                    activeIndex === i ? "text-[#00FAFF]" : "text-white"
                  } ${isMobile ? "text-sm" : "text-base"}`}
                >
                  ${dataItem.value.toFixed(2)}
                </p>
                <p className="text-xs text-gray-400">
                  {percentage.toFixed(1)}%
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
