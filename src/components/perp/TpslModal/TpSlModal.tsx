"use client";

import { useState } from "react";
import { Button, Tabs, Tab } from "@mui/material";
import { usePerpTickerStore } from "@/store/perpTickerStore";
import GenericModal from "@/components/common/ui/GenericModal";
import { TpSlModalProps, PositionSide, TriggerType } from "./types";
import { tabsSx, confirmButtonSx } from "./styles";
import {
  TabPanel,
  MarketInfo,
  TakeProfitSection,
  StopLossSection,
} from "./components";
import { useTpSlState, useTpSlCalculations, useTpSlValidation } from "./hooks";

const TpSlModal = ({ market }: TpSlModalProps) => {
  const [positionSide, setPositionSide] = useState<PositionSide>(0);

  const {
    tpSlModalOpen,
    closeTpSlModal,
    takeProfitPrice,
    setTakeProfitPrice,
    takeProfitPercentage,
    setTakeProfitPercentage,
    takeProfitTriggerType,
    setTakeProfitTriggerType,
    handleClearTakeProfit,
    stopLossPrice,
    setStopLossPrice,
    stopLossPercentage,
    setStopLossPercentage,
    stopLossTriggerType,
    setStopLossTriggerType,
    handleClearStopLoss,
    setLongTakeProfitPrice,
    setLongTakeProfitTriggerType,
    setLongStopLossPrice,
    setLongStopLossTriggerType,
    setShortTakeProfitPrice,
    setShortTakeProfitTriggerType,
    setShortStopLossPrice,
    setShortStopLossTriggerType,
  } = useTpSlState();

  const closeStr = usePerpTickerStore((s) => s.tickers[market]?.close ?? null);
  const indexPriceStr = usePerpTickerStore((s) => s.tickers[market]?.indexPrice ?? null);
  const lastPrice = closeStr ? parseFloat(closeStr) : 0;
  const indexPrice = indexPriceStr ? parseFloat(indexPriceStr) : 0;

  // Calculate prices based on percentages
  useTpSlCalculations({
    takeProfitPercentage,
    takeProfitTriggerType,
    stopLossPercentage,
    stopLossTriggerType,
    indexPrice,
    lastPrice,
    positionSide,
    setTakeProfitPrice,
    setStopLossPrice,
  });

  const { validateTpSl } = useTpSlValidation({
    takeProfitPrice,
    takeProfitTriggerType,
    stopLossPrice,
    stopLossTriggerType,
    indexPrice,
    lastPrice,
    positionSide,
  });

  const handleTpPercentageSelect = (percentage: number) => {
    setTakeProfitPercentage(percentage.toString());
  };

  const handleSlPercentageSelect = (percentage: number) => {
    setStopLossPercentage(percentage.toString());
  };

  const handleConfirm = () => {
    const validation = validateTpSl();

    if (!validation.isValid) {
      alert(validation.errorMessage);
      return;
    }

    // Save configuration based on position side
    if (positionSide === 0) {
      setLongTakeProfitPrice(takeProfitPrice);
      setLongTakeProfitTriggerType(takeProfitTriggerType);
      setLongStopLossPrice(stopLossPrice);
      setLongStopLossTriggerType(stopLossTriggerType);
    } else {
      setShortTakeProfitPrice(takeProfitPrice);
      setShortTakeProfitTriggerType(takeProfitTriggerType);
      setShortStopLossPrice(stopLossPrice);
      setShortStopLossTriggerType(stopLossTriggerType);
    }

    console.log("TP/SL confirmed:", {
      positionSide: positionSide === 0 ? "Long" : "Short",
      takeProfit: {
        price: takeProfitPrice,
        percentage: takeProfitPercentage,
        triggerType: takeProfitTriggerType,
      },
      stopLoss: {
        price: stopLossPrice,
        percentage: stopLossPercentage,
        triggerType: stopLossTriggerType,
      },
    });

    closeTpSlModal();
  };

  // Determine base price based on trigger type
  const tpBasePrice = takeProfitTriggerType === "index" ? indexPrice : lastPrice;
  const slBasePrice = stopLossTriggerType === "index" ? indexPrice : lastPrice;

  return (
    <GenericModal
      isOpen={tpSlModalOpen}
      onClose={closeTpSlModal}
      title="TP/SL for Entire Position"
      size="md"
    >
      <MarketInfo
        market={market}
        indexPrice={indexPrice}
        lastPrice={lastPrice}
      />

      <Tabs
        value={positionSide}
        onChange={(_, newValue) => setPositionSide(newValue as PositionSide)}
        sx={tabsSx}
      >
        <Tab label="Long" />
        <Tab label="Short" />
      </Tabs>

      <TabPanel value={positionSide} index={0}>
        <TakeProfitSection
          price={takeProfitPrice}
          onPriceChange={setTakeProfitPrice}
          triggerType={takeProfitTriggerType}
          onTriggerTypeChange={(value) => setTakeProfitTriggerType(value as TriggerType)}
          percentage={takeProfitPercentage}
          onPercentageChange={setTakeProfitPercentage}
          onClear={handleClearTakeProfit}
          onPercentageSelect={handleTpPercentageSelect}
          basePrice={tpBasePrice}
          positionSide={positionSide}
        />

        <StopLossSection
          price={stopLossPrice}
          onPriceChange={setStopLossPrice}
          triggerType={stopLossTriggerType}
          onTriggerTypeChange={(value) => setStopLossTriggerType(value as TriggerType)}
          percentage={stopLossPercentage}
          onPercentageChange={setStopLossPercentage}
          onClear={handleClearStopLoss}
          onPercentageSelect={handleSlPercentageSelect}
          basePrice={slBasePrice}
          positionSide={positionSide}
        />
      </TabPanel>

      <TabPanel value={positionSide} index={1}>
        <TakeProfitSection
          price={takeProfitPrice}
          onPriceChange={setTakeProfitPrice}
          triggerType={takeProfitTriggerType}
          onTriggerTypeChange={(value) => setTakeProfitTriggerType(value as TriggerType)}
          percentage={takeProfitPercentage}
          onPercentageChange={setTakeProfitPercentage}
          onClear={handleClearTakeProfit}
          onPercentageSelect={handleTpPercentageSelect}
          basePrice={tpBasePrice}
          positionSide={positionSide}
        />

        <StopLossSection
          price={stopLossPrice}
          onPriceChange={setStopLossPrice}
          triggerType={stopLossTriggerType}
          onTriggerTypeChange={(value) => setStopLossTriggerType(value as TriggerType)}
          percentage={stopLossPercentage}
          onPercentageChange={setStopLossPercentage}
          onClear={handleClearStopLoss}
          onPercentageSelect={handleSlPercentageSelect}
          basePrice={slBasePrice}
          positionSide={positionSide}
        />
      </TabPanel>

      <Button fullWidth onClick={handleConfirm} sx={confirmButtonSx}>
        Confirm
      </Button>
    </GenericModal>
  );
};

export default TpSlModal;
