import { Counter } from "./Counter";

type RenderAmountProps = {
  value: number;
  symbol?: "percent" | "USD";
  decimals?: number;
  shouldHideTooltip?: boolean;
};

export function RenderAmount({
  value,
  symbol,
  decimals = 6,
  shouldHideTooltip = false,
}: RenderAmountProps) {
  if (symbol === "percent") {
    return (
      <>
        <Counter
          value={value * 100}
          decimals={decimals}
          decimalsToDisplay={[2, 4]}
        />
        %
      </>
    );
  }

  if (symbol === "USD") {
    return (
      <>
        $<Counter value={value} decimals={2} decimalsToDisplay={[2, 4]} />
      </>
    );
  }

  return <Counter value={value} decimals={decimals} />;
}
