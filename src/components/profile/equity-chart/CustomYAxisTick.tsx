// src/components/profile/equity-chart/CustomYAxisTick.tsx
interface CustomYAxisTickProps {
  x?: number;
  y?: number;
  payload?: any;
  screenWidth: number;
  isMobile: boolean;
}

export default function CustomYAxisTick({
  x,
  y,
  payload,
  screenWidth,
  isMobile,
}: CustomYAxisTickProps) {
  const fontSize = screenWidth <= 730 ? 9 : isMobile ? 10 : 11;

  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={0}
        dy={4}
        textAnchor="end"
        fill="#ffffff80"
        fontSize={fontSize}
        fontWeight={500}
      >
        ${payload.value.toFixed(0)}
      </text>
    </g>
  );
}
