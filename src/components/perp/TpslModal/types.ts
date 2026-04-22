export interface TpSlModalProps {
  market: string;
}

export interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

export type TriggerType = "index" | "last";

export type PositionSide = 0 | 1; // 0 = Long, 1 = Short

export interface PriceInputRowProps {
  price: string;
  onPriceChange: (value: string) => void;
  triggerType: TriggerType;
  onTriggerTypeChange: (value: TriggerType) => void;
  percentage: string;
  onPercentageChange: (value: string) => void;
  onClear: () => void;
  hasError: boolean;
}

export interface PercentageButtonsProps {
  percentages: number[];
  selectedPercentage: string;
  onSelect: (percentage: number) => void;
}

export interface PriceSliderProps {
  value: number;
  onChange: (value: number) => void;
  color: "profit" | "loss";
}

export interface TpSlSectionProps {
  type: "takeProfit" | "stopLoss";
  price: string;
  onPriceChange: (value: string) => void;
  triggerType: TriggerType;
  onTriggerTypeChange: (value: TriggerType) => void;
  percentage: string;
  onPercentageChange: (value: string) => void;
  onClear: () => void;
  onPercentageSelect: (percentage: number) => void;
  basePrice: number;
  positionSide: PositionSide;
}

export interface MarketInfoProps {
  market: string;
  indexPrice: number;
  lastPrice: number;
}
