import { NextRequest, NextResponse } from "next/server";
import { getKumaConfig } from "../utils";

export const runtime = "edge";
export const preferredRegion = "bom1";

function formatQuantity(quantity: string, stepSize: number, minimum: number): string {
  const value = parseFloat(quantity);
  const rounded = Math.round(value / stepSize) * stepSize;
  const final = Math.max(rounded, minimum);
  return final.toFixed(8);
}

function formatPrice(price: string | number): string {
  const value = typeof price === "string" ? parseFloat(price) : price;
  const rounded = Math.round(value);
  return rounded.toFixed(8);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { market, quantity, price, triggerPrice } = body;

    if (!market || !quantity) {
      return NextResponse.json(
        { error: "Missing required fields: market, quantity" },
        { status: 400 },
      );
    }

    const { baseUrl } = getKumaConfig();

    const marketResponse = await fetch(`${baseUrl}/v1/markets?market=${market}`);
    if (!marketResponse.ok) {
      return NextResponse.json({ error: "Failed to fetch market data" }, { status: 500 });
    }

    const marketData = await marketResponse.json();
    if (!marketData || marketData.length === 0) {
      return NextResponse.json({ error: `Market ${market} not found` }, { status: 400 });
    }

    const marketInfo = marketData[0];
    const stepSize = parseFloat(marketInfo.stepSize);
    const minimumOrderSize = parseFloat(marketInfo.takerOrderMinimum);

    const formattedQuantity = formatQuantity(quantity, stepSize, minimumOrderSize);
    const formattedPrice =
      price && parseFloat(price) > 0 ? formatPrice(price) : "0.00000000";
    const formattedTriggerPrice =
      triggerPrice && parseFloat(triggerPrice) > 0 ? formatPrice(triggerPrice) : "0.00000000";

    return NextResponse.json(
      { formattedQuantity, formattedPrice, formattedTriggerPrice },
      { status: 200 },
    );
  } catch (error: unknown) {
    console.error("Error in get-order-typed-data API route:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}
