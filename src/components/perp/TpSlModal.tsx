"use client";

import {
  Box,
  Typography,
  Stack,
  Button,
  TextField,
  Select,
  MenuItem,
  Tabs,
  Tab,
  FormControl,
  InputAdornment,
  Divider,
  IconButton,
  Slider,
} from "@mui/material";
import { useState, useEffect } from "react";
import GenericModal from "@/components/common/ui/GenericModal";
import { usePerpStore } from "@/store/perpStore";
import { KatanaPerpsTicker } from "@katanaperps/katana-perps-sdk";
import CloseIcon from "@mui/icons-material/Close";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
}

interface TpSlModalProps {
  market: string;
  tickerData: KumaTicker | null;
}

const TpSlModal = ({ market, tickerData }: TpSlModalProps) => {
  const tpSlModalOpen = usePerpStore((s) => s.tpSlModalOpen);
  const closeTpSlModal = usePerpStore((s) => s.closeTpSlModal);

  // Take Profit
  const takeProfitPrice = usePerpStore((s) => s.takeProfitPrice);
  const setTakeProfitPrice = usePerpStore((s) => s.setTakeProfitPrice);
  const takeProfitPercentage = usePerpStore((s) => s.takeProfitPercentage);
  const setTakeProfitPercentage = usePerpStore((s) => s.setTakeProfitPercentage);
  const takeProfitTriggerType = usePerpStore((s) => s.takeProfitTriggerType);
  const setTakeProfitTriggerType = usePerpStore(
    (s) => s.setTakeProfitTriggerType
  );

  // Stop Loss
  const stopLossPrice = usePerpStore((s) => s.stopLossPrice);
  const setStopLossPrice = usePerpStore((s) => s.setStopLossPrice);
  const stopLossPercentage = usePerpStore((s) => s.stopLossPercentage);
  const setStopLossPercentage = usePerpStore((s) => s.setStopLossPercentage);
  const stopLossTriggerType = usePerpStore((s) => s.stopLossTriggerType);
  const setStopLossTriggerType = usePerpStore((s) => s.setStopLossTriggerType);

  const [positionSide, setPositionSide] = useState(0); // 0 = Long, 1 = Short

  // Quick percentage select values
  const tpPercentages = [5, 10, 15, 20, 25];
  const slPercentages = [5, 10, 15, 20, 25];

  // Get prices from ticker data
  const lastPrice = tickerData?.close ? parseFloat(tickerData.close) : 0;
  const indexPrice = tickerData?.indexPrice ? parseFloat(tickerData.indexPrice) : 0;

  // Calculate price based on percentage for Take Profit
  useEffect(() => {
    if (!takeProfitPercentage || takeProfitPercentage === "") {
      return;
    }

    const basePrice = takeProfitTriggerType === "index" ? indexPrice : lastPrice;
    const percentage = parseFloat(takeProfitPercentage);

    if (!isNaN(percentage) && basePrice > 0) {
      // Take profit should be ABOVE current price (increase)
      const calculatedPrice = basePrice * (1 + percentage / 100);
      setTakeProfitPrice(calculatedPrice.toFixed(2));
    }
  }, [takeProfitPercentage, takeProfitTriggerType, indexPrice, lastPrice]);

  // Calculate price based on percentage for Stop Loss
  useEffect(() => {
    if (!stopLossPercentage || stopLossPercentage === "") {
      return;
    }

    const basePrice = stopLossTriggerType === "index" ? indexPrice : lastPrice;
    const percentage = parseFloat(stopLossPercentage);

    if (!isNaN(percentage) && basePrice > 0) {
      // Stop loss should be BELOW current price (decrease)
      const calculatedPrice = basePrice * (1 - percentage / 100);
      setStopLossPrice(calculatedPrice.toFixed(2));
    }
  }, [stopLossPercentage, stopLossTriggerType, indexPrice, lastPrice]);

  const handleTpPercentageSelect = (percentage: number) => {
    setTakeProfitPercentage(percentage.toString());
  };

  const handleSlPercentageSelect = (percentage: number) => {
    setStopLossPercentage(percentage.toString());
  };

  const handleTakeProfitPriceChange = (value: string) => {
    setTakeProfitPrice(value);
    // Optionally clear percentage when manually entering price
    // setTakeProfitPercentage("");
  };

  const handleStopLossPriceChange = (value: string) => {
    setStopLossPrice(value);
    // Optionally clear percentage when manually entering price
    // setStopLossPercentage("");
  };

  const handleClearTakeProfit = () => {
    setTakeProfitPrice("");
    setTakeProfitPercentage("");
  };

  const handleClearStopLoss = () => {
    setStopLossPrice("");
    setStopLossPercentage("");
  };

  const handleConfirm = () => {
    const basePrice = takeProfitTriggerType === "index" ? indexPrice : lastPrice;
    const tpPrice = parseFloat(takeProfitPrice);
    const slPrice = parseFloat(stopLossPrice);

    // Validate take profit (must be above current price for long positions)
    if (takeProfitPrice && tpPrice <= basePrice) {
      alert(`Take Profit price must be higher than current ${takeProfitTriggerType} price (${basePrice.toFixed(2)})`);
      return;
    }

    // Validate stop loss (must be below current price for long positions)
    if (stopLossPrice && slPrice >= basePrice) {
      alert(`Stop Loss price must be lower than current ${stopLossTriggerType} price (${basePrice.toFixed(2)})`);
      return;
    }

    console.log("TP/SL confirmed:", {
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

  return (
    <GenericModal
      isOpen={tpSlModalOpen}
      onClose={closeTpSlModal}
      title="TP/SL for Entire Position"
      size="md"
    >
      {/* Market Info */}
      <Stack
        direction="row"
        justifyContent="space-between"
        sx={{
          mb: 2,
          p: 2,
          backgroundColor: "rgba(0, 0, 0, 0.3)",
          borderRadius: 1,
        }}
      >
        <Box>
          <Typography
            variant="caption"
            sx={{ color: "rgba(255, 255, 255, 0.6)" }}
          >
            Market
          </Typography>
          <Typography variant="body2" sx={{ color: "#fff", fontWeight: 600 }}>
            {market}
          </Typography>
        </Box>
        <Box>
          <Typography
            variant="caption"
            sx={{ color: "rgba(255, 255, 255, 0.6)" }}
          >
            Index Price
          </Typography>
          <Typography variant="body2" sx={{ color: "#fff", fontWeight: 600 }}>
            {indexPrice > 0 ? `$${indexPrice.toFixed(2)}` : "-"}
          </Typography>
        </Box>
        <Box>
          <Typography
            variant="caption"
            sx={{ color: "rgba(255, 255, 255, 0.6)" }}
          >
            Last Price
          </Typography>
          <Typography variant="body2" sx={{ color: "#fff", fontWeight: 600 }}>
            {lastPrice > 0 ? `$${lastPrice.toFixed(2)}` : "-"}
          </Typography>
        </Box>
      </Stack>

      {/* Long/Short Tabs */}
      <Tabs
        value={positionSide}
        onChange={(_, newValue) => setPositionSide(newValue)}
        sx={{
          mb: 2,
          "& .MuiTabs-indicator": {
            backgroundColor: "#00F5E0",
          },
          "& .MuiTab-root": {
            color: "rgba(255, 255, 255, 0.6)",
            textTransform: "none",
            fontSize: "0.875rem",
            fontWeight: 500,
            "&.Mui-selected": {
              color: "#00F5E0",
            },
          },
        }}
      >
        <Tab label="Long" />
        <Tab label="Short" />
      </Tabs>

      {/* Content for Long/Short */}
      <TabPanel value={positionSide} index={0}>
        {/* Take Profit Section */}
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ mb: 1.5 }}
        >
          <Typography variant="subtitle2" sx={{ color: "#fff", fontWeight: 600 }}>
            Take Profit
          </Typography>
          <Typography variant="caption" sx={{ color: "rgba(255, 255, 255, 0.6)" }}>
            Trigger by Change %
          </Typography>
        </Stack>

        <Stack spacing={2} sx={{ mb: 3 }}>
          {/* Input Row: Price, Dropdown, Percentage, Clear */}
          <Stack direction="row" spacing={1} alignItems="center">
            {/* Price Input */}
            <TextField
              size="small"
              type="number"
              value={takeProfitPrice}
              onChange={(e) => handleTakeProfitPriceChange(e.target.value)}
              placeholder="0.0"
              error={!!(takeProfitPrice && parseFloat(takeProfitPrice) <= (takeProfitTriggerType === "index" ? indexPrice : lastPrice))}
              sx={{
                flex: 1,
                "& .MuiOutlinedInput-root": {
                  color: "#fff",
                  backgroundColor: "rgba(0, 0, 0, 0.3)",
                  "& fieldset": {
                    borderColor: "rgba(255, 255, 255, 0.2)",
                  },
                  "&:hover fieldset": {
                    borderColor: "rgba(255, 255, 255, 0.3)",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "#00F5E0",
                  },
                  "&.Mui-error fieldset": {
                    borderColor: "#EF4444",
                  },
                },
              }}
            />

            {/* Dropdown: Index/Last */}
            <FormControl size="small" sx={{ minWidth: 100 }}>
              <Select
                value={takeProfitTriggerType}
                onChange={(e) =>
                  setTakeProfitTriggerType(e.target.value as "index" | "last")
                }
                sx={{
                  color: "#fff",
                  backgroundColor: "rgba(0, 0, 0, 0.3)",
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "rgba(255, 255, 255, 0.2)",
                  },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: "rgba(255, 255, 255, 0.3)",
                  },
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#00F5E0",
                  },
                }}
              >
                <MenuItem value="index">Index</MenuItem>
                <MenuItem value="last">Last</MenuItem>
              </Select>
            </FormControl>

            {/* Percentage Input */}
            <TextField
              size="small"
              type="number"
              value={takeProfitPercentage}
              onChange={(e) => setTakeProfitPercentage(e.target.value)}
              placeholder="0.0"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <Typography sx={{ color: "rgba(255, 255, 255, 0.6)" }}>
                      %
                    </Typography>
                  </InputAdornment>
                ),
              }}
              sx={{
                flex: 1,
                "& .MuiOutlinedInput-root": {
                  color: "#fff",
                  backgroundColor: "rgba(0, 0, 0, 0.3)",
                  "& fieldset": {
                    borderColor: "rgba(255, 255, 255, 0.2)",
                  },
                  "&:hover fieldset": {
                    borderColor: "rgba(255, 255, 255, 0.3)",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "#00F5E0",
                  },
                },
              }}
            />

            {/* Clear Button */}
            <IconButton
              onClick={handleClearTakeProfit}
              size="small"
              sx={{
                color: "rgba(255, 255, 255, 0.6)",
                "&:hover": {
                  color: "#fff",
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                },
              }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Stack>

          {/* Quick Percentage Buttons */}
          <Stack direction="row" spacing={1}>
            {tpPercentages.map((percentage) => (
              <Button
                key={percentage}
                onClick={() => handleTpPercentageSelect(percentage)}
                variant="outlined"
                size="small"
                sx={{
                  flex: 1,
                  fontSize: "0.75rem",
                  textTransform: "none",
                  color:
                    takeProfitPercentage === percentage.toString()
                      ? "#000"
                      : "rgba(255, 255, 255, 0.6)",
                  backgroundColor:
                    takeProfitPercentage === percentage.toString()
                      ? "#FF8C00"
                      : "transparent",
                  borderColor:
                    takeProfitPercentage === percentage.toString()
                      ? "#FF8C00"
                      : "rgba(255, 255, 255, 0.2)",
                  "&:hover": {
                    backgroundColor:
                      takeProfitPercentage === percentage.toString()
                        ? "#FF7700"
                        : "rgba(255, 255, 255, 0.05)",
                    borderColor:
                      takeProfitPercentage === percentage.toString()
                        ? "#FF7700"
                        : "rgba(255, 255, 255, 0.3)",
                  },
                }}
              >
                {percentage}%
              </Button>
            ))}
          </Stack>

          {/* Slider */}
          <Slider
            value={takeProfitPercentage ? parseFloat(takeProfitPercentage) : 0}
            onChange={(_, value) => setTakeProfitPercentage(value.toString())}
            min={0}
            max={100}
            step={0.1}
            sx={{
              color: "#22C55E",
              "& .MuiSlider-track": {
                backgroundColor: "#22C55E",
                border: "none",
              },
              "& .MuiSlider-rail": {
                backgroundColor: "rgba(255, 255, 255, 0.1)",
              },
              "& .MuiSlider-thumb": {
                backgroundColor: "#22C55E",
                border: "2px solid #fff",
                width: 16,
                height: 16,
              },
            }}
          />

          <Typography
            variant="caption"
            sx={{ color: "rgba(255, 255, 255, 0.5)" }}
          >
            When {takeProfitTriggerType === "index" ? "Index" : "Last"} Price reaches {takeProfitPrice || "-"}, it will trigger a Take Profit Market
            order to close this position. Estimated P&L is -.
          </Typography>
        </Stack>

        <Divider sx={{ my: 2, borderColor: "rgba(255, 255, 255, 0.1)" }} />

        {/* Stop Loss Section */}
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ mb: 1.5 }}
        >
          <Typography variant="subtitle2" sx={{ color: "#fff", fontWeight: 600 }}>
            Stop Loss
          </Typography>
          <Typography variant="caption" sx={{ color: "rgba(255, 255, 255, 0.6)" }}>
            Trigger by Change %
          </Typography>
        </Stack>

        <Stack spacing={2}>
          {/* Input Row: Price, Dropdown, Percentage, Clear */}
          <Stack direction="row" spacing={1} alignItems="center">
            {/* Price Input */}
            <TextField
              size="small"
              type="number"
              value={stopLossPrice}
              onChange={(e) => handleStopLossPriceChange(e.target.value)}
              placeholder="0.0"
              error={!!(stopLossPrice && parseFloat(stopLossPrice) >= (stopLossTriggerType === "index" ? indexPrice : lastPrice))}
              sx={{
                flex: 1,
                "& .MuiOutlinedInput-root": {
                  color: "#fff",
                  backgroundColor: "rgba(0, 0, 0, 0.3)",
                  "& fieldset": {
                    borderColor: "rgba(255, 255, 255, 0.2)",
                  },
                  "&:hover fieldset": {
                    borderColor: "rgba(255, 255, 255, 0.3)",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "#00F5E0",
                  },
                  "&.Mui-error fieldset": {
                    borderColor: "#EF4444",
                  },
                },
              }}
            />

            {/* Dropdown: Index/Last */}
            <FormControl size="small" sx={{ minWidth: 100 }}>
              <Select
                value={stopLossTriggerType}
                onChange={(e) =>
                  setStopLossTriggerType(e.target.value as "index" | "last")
                }
                sx={{
                  color: "#fff",
                  backgroundColor: "rgba(0, 0, 0, 0.3)",
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "rgba(255, 255, 255, 0.2)",
                  },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: "rgba(255, 255, 255, 0.3)",
                  },
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#00F5E0",
                  },
                }}
              >
                <MenuItem value="index">Index</MenuItem>
                <MenuItem value="last">Last</MenuItem>
              </Select>
            </FormControl>

            {/* Percentage Input */}
            <TextField
              size="small"
              type="number"
              value={stopLossPercentage}
              onChange={(e) => setStopLossPercentage(e.target.value)}
              placeholder="0.0"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <Typography sx={{ color: "rgba(255, 255, 255, 0.6)" }}>
                      %
                    </Typography>
                  </InputAdornment>
                ),
              }}
              sx={{
                flex: 1,
                "& .MuiOutlinedInput-root": {
                  color: "#fff",
                  backgroundColor: "rgba(0, 0, 0, 0.3)",
                  "& fieldset": {
                    borderColor: "rgba(255, 255, 255, 0.2)",
                  },
                  "&:hover fieldset": {
                    borderColor: "rgba(255, 255, 255, 0.3)",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "#00F5E0",
                  },
                },
              }}
            />

            {/* Clear Button */}
            <IconButton
              onClick={handleClearStopLoss}
              size="small"
              sx={{
                color: "rgba(255, 255, 255, 0.6)",
                "&:hover": {
                  color: "#fff",
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                },
              }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Stack>

          {/* Quick Percentage Buttons */}
          <Stack direction="row" spacing={1}>
            {slPercentages.map((percentage) => (
              <Button
                key={percentage}
                onClick={() => handleSlPercentageSelect(percentage)}
                variant="outlined"
                size="small"
                sx={{
                  flex: 1,
                  fontSize: "0.75rem",
                  textTransform: "none",
                  color:
                    stopLossPercentage === percentage.toString()
                      ? "#000"
                      : "rgba(255, 255, 255, 0.6)",
                  backgroundColor:
                    stopLossPercentage === percentage.toString()
                      ? "#FF8C00"
                      : "transparent",
                  borderColor:
                    stopLossPercentage === percentage.toString()
                      ? "#FF8C00"
                      : "rgba(255, 255, 255, 0.2)",
                  "&:hover": {
                    backgroundColor:
                      stopLossPercentage === percentage.toString()
                        ? "#FF7700"
                        : "rgba(255, 255, 255, 0.05)",
                    borderColor:
                      stopLossPercentage === percentage.toString()
                        ? "#FF7700"
                        : "rgba(255, 255, 255, 0.3)",
                  },
                }}
              >
                {percentage}%
              </Button>
            ))}
          </Stack>

          {/* Slider */}
          <Slider
            value={stopLossPercentage ? parseFloat(stopLossPercentage) : 0}
            onChange={(_, value) => setStopLossPercentage(value.toString())}
            min={0}
            max={100}
            step={0.1}
            sx={{
              color: "#EF4444",
              "& .MuiSlider-track": {
                backgroundColor: "#EF4444",
                border: "none",
              },
              "& .MuiSlider-rail": {
                backgroundColor: "rgba(255, 255, 255, 0.1)",
              },
              "& .MuiSlider-thumb": {
                backgroundColor: "#EF4444",
                border: "2px solid #fff",
                width: 16,
                height: 16,
              },
            }}
          />

          <Typography
            variant="caption"
            sx={{ color: "rgba(255, 255, 255, 0.5)" }}
          >
            When {stopLossTriggerType === "index" ? "Index" : "Last"} Price reaches {stopLossPrice || "-"}, it will trigger a Stop Loss Market order
            to close this position. Estimated P&L is -.
          </Typography>
        </Stack>
      </TabPanel>

      <TabPanel value={positionSide} index={1}>
        <Typography
          variant="body2"
          sx={{ color: "rgba(255, 255, 255, 0.7)", textAlign: "center", py: 4 }}
        >
          Short position TP/SL configuration (similar to Long)
        </Typography>
      </TabPanel>

      {/* Confirm Button */}
      <Button
        fullWidth
        onClick={handleConfirm}
        sx={{
          mt: 3,
          py: 1.5,
          fontSize: "1rem",
          fontWeight: 600,
          textTransform: "none",
          background: "#00F5E0",
          color: "#000",
          "&:hover": {
            background: "#00D4C0",
          },
        }}
      >
        Confirm
      </Button>
    </GenericModal>
  );
};

export default TpSlModal;
