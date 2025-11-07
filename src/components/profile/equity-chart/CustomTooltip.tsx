// src/components/profile/equity-chart/CustomTooltip.tsx
interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
}

export default function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-black/80 backdrop-blur-sm border border-cyan-400/30 rounded-lg p-3 shadow-xl">
        <p className="text-cyan-300 font-bold text-lg">
          $
          {payload[0].value.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </p>
        <p className="text-white/60 text-xs mt-1">
          {new Date(payload[0].payload.timestamp).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    );
  }
  return null;
}
