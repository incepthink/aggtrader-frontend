"use client";

import { usePerpStore } from "@/store/perpStore";
import { useMidPrice } from "@/hooks/perp/useMidPrice";

const PriceInputs = () => {
  const activeOrderType = usePerpStore((s) => s.activeOrderType);
  const limitPrice = usePerpStore((s) => s.limitPrice);
  const setLimitPrice = usePerpStore((s) => s.setLimitPrice);
  const stopPrice = usePerpStore((s) => s.stopPrice);
  const setStopPrice = usePerpStore((s) => s.setStopPrice);
  const stopPriceTriggerType = usePerpStore((s) => s.stopPriceTriggerType);
  const setStopPriceTriggerType = usePerpStore(
    (s) => s.setStopPriceTriggerType,
  );
  const orderPrice = usePerpStore((s) => s.orderPrice);
  const setOrderPrice = usePerpStore((s) => s.setOrderPrice);

  const midPrice = useMidPrice();

  const handleMidPriceSelection = () => {
    if (!midPrice) return;
    if (activeOrderType === "limit") {
      setLimitPrice(midPrice);
    } else if (activeOrderType === "stopLimit") {
      setOrderPrice(midPrice);
    }
  };

  return (
    <>
      {/* Price Input - Only for Limit Orders */}
      {activeOrderType === "limit" && (
        <div className="flex w-full items-center bg-[rgba(255,255,255,0.02)] border-2 border-[rgba(255,255,255,0.1)] mb-3">
          <p className="p-2 text-xs text-white/80 shrink-0">Price (USD)</p>
          <input
            type="text"
            value={limitPrice || ""}
            onChange={(e) => setLimitPrice(e.target.value)}
            className="flex-1 min-w-0 bg-transparent px-3 py-1 text-sm text-white outline-none focus:ring-0 text-right"
            placeholder="0.00"
          />
          <span
            onClick={handleMidPriceSelection}
            className="p-1 px-1.5 cursor-pointer text-sm shrink-0 border-l border-[rgba(255,255,255,0.1)] text-cyan-400"
          >
            MID
          </span>
        </div>
      )}

      {/* Stop Price Input - For Stop Market and Stop Limit Orders */}
      {(activeOrderType === "stopMarket" ||
        activeOrderType === "stopLimit") && (
        <div className="flex w-full items-center bg-[rgba(255,255,255,0.02)] border-2 border-[rgba(255,255,255,0.1)] mb-3">
          <p className="p-2 text-sm text-white/80 shrink-0">Stop Price</p>
          <input
            type="text"
            value={stopPrice || ""}
            onChange={(e) => setStopPrice(e.target.value)}
            className="flex-1 min-w-0 bg-transparent px-3 py-1 text-sm text-white outline-none focus:ring-0 text-right"
            placeholder="0.00"
          />
          <select
            value={stopPriceTriggerType}
            onChange={(e) =>
              setStopPriceTriggerType(e.target.value as "index" | "last")
            }
            className="shrink-0 text-white text-sm p-1 outline-none cursor-pointer border-l border-[rgba(255,255,255,0.1)] appearance-none bg-transparent [&>option:checked]:bg-[#00F5E0] [&>option:checked]:text-black [&>option]:bg-black [&>option]:text-white"
          >
            <option value="index">Index</option>
            <option value="last">Last</option>
          </select>
        </div>
      )}

      {/* Order Price Input - Only for Stop Limit Orders */}
      {activeOrderType === "stopLimit" && (
        <div className="flex w-full items-center bg-[rgba(255,255,255,0.02)] border-2 border-[rgba(255,255,255,0.1)] mb-3">
          <p className="p-2 text-xs text-white/80 shrink-0">Price (USD)</p>
          <input
            type="text"
            value={orderPrice || ""}
            onChange={(e) => setOrderPrice(e.target.value)}
            className="flex-1 min-w-0 bg-transparent px-3 py-1 text-sm text-white outline-none focus:ring-0 text-right"
            placeholder="0.00"
          />
          <span
            onClick={handleMidPriceSelection}
            className="p-1 px-1.5 cursor-pointer text-sm text-cyan-400 shrink-0 border-l border-[rgba(255,255,255,0.1)]"
          >
            MID
          </span>
        </div>
      )}
    </>
  );
};

export default PriceInputs;
