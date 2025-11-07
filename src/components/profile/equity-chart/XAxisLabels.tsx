// src/components/profile/equity-chart/XAxisLabels.tsx
interface XAxisLabelsProps {
  uniqueDates: string[];
  screenWidth: number;
  isMobile: boolean;
}

export default function XAxisLabels({
  uniqueDates,
  screenWidth,
  isMobile,
}: XAxisLabelsProps) {
  const fontSize = screenWidth <= 730 ? 9 : isMobile ? 10 : 11;

  return (
    <div
      className="absolute flex justify-between items-center"
      style={{
        bottom: screenWidth <= 730 || isMobile ? "10px" : "20px",
        left: screenWidth <= 730 ? "15px" : isMobile ? "25px" : "60px",
        right: screenWidth <= 730 ? "5px" : isMobile ? "5px" : "20px",
      }}
    >
      {uniqueDates.map((dateLabel, index) => (
        <div
          key={index}
          className="text-center flex-1"
          style={{
            color: "#ffffff80",
            fontSize: `${fontSize}px`,
            fontWeight: 500,
          }}
        >
          {dateLabel}
        </div>
      ))}
    </div>
  );
}
