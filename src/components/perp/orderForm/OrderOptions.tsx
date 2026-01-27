"use client";

import { Box, FormControlLabel, Checkbox, Stack, Typography, IconButton } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import { usePerpStore } from "@/store/perpStore";

const checkboxSx = {
  color: "rgba(255, 255, 255, 0.3)",
  "&.Mui-checked": {
    color: "#00F5E0",
  },
  "& .MuiSvgIcon-root": {
    fontSize: 18,
  },
};

const labelSx = {
  "& .MuiFormControlLabel-label": {
    fontSize: "0.8rem",
    color: "rgba(255, 255, 255, 0.7)",
  },
};

const formatPrice = (price: string): string => {
  if (!price) return "-";
  const num = parseFloat(price);
  if (isNaN(num)) return "-";
  return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
};

const OrderOptions = () => {
  const activeOrderType = usePerpStore((s) => s.activeOrderType);
  const reduceOnly = usePerpStore((s) => s.reduceOnly);
  const postOnly = usePerpStore((s) => s.postOnly);
  const tpSlEnabled = usePerpStore((s) => s.tpSlEnabled);
  const quantity = usePerpStore((s) => s.quantity);
  const setReduceOnly = usePerpStore((s) => s.setReduceOnly);
  const setPostOnly = usePerpStore((s) => s.setPostOnly);
  const setTpSlEnabled = usePerpStore((s) => s.setTpSlEnabled);
  const openTpSlModal = usePerpStore((s) => s.openTpSlModal);
  const clearAllTpSl = usePerpStore((s) => s.clearAllTpSl);

  // Configured TP/SL values
  const longTakeProfitPrice = usePerpStore((s) => s.longTakeProfitPrice);
  const longStopLossPrice = usePerpStore((s) => s.longStopLossPrice);
  const shortTakeProfitPrice = usePerpStore((s) => s.shortTakeProfitPrice);
  const shortStopLossPrice = usePerpStore((s) => s.shortStopLossPrice);

  const hasLongTpSl = longTakeProfitPrice || longStopLossPrice;
  const hasShortTpSl = shortTakeProfitPrice || shortStopLossPrice;

  const handleTpSlChange = (checked: boolean) => {
    if (checked) {
      if (!quantity || parseFloat(quantity) === 0) {
        alert("Please enter quantity first");
        return;
      }
      openTpSlModal();
      setTpSlEnabled(true);
    } else {
      setTpSlEnabled(false);
      clearAllTpSl();
    }
  };

  const handleEditTpSl = () => {
    openTpSlModal();
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 0 }}>
      <FormControlLabel
        control={
          <Checkbox
            checked={reduceOnly}
            onChange={(e) => setReduceOnly(e.target.checked)}
            sx={checkboxSx}
          />
        }
        label="Reduce-Only"
        sx={labelSx}
      />
      {/* Post-Only - Only for Limit and Stop Limit Orders */}
      {(activeOrderType === "limit" || activeOrderType === "stopLimit") && (
        <FormControlLabel
          control={
            <Checkbox
              checked={postOnly}
              onChange={(e) => setPostOnly(e.target.checked)}
              sx={checkboxSx}
            />
          }
          label="Post-Only"
          sx={labelSx}
        />
      )}
      <FormControlLabel
        control={
          <Checkbox
            checked={tpSlEnabled}
            onChange={(e) => handleTpSlChange(e.target.checked)}
            sx={checkboxSx}
          />
        }
        label="TP/SL"
        sx={labelSx}
      />

      {/* TP/SL Configuration Display */}
      {tpSlEnabled && hasLongTpSl && (
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ pl: 1, pr: 0.5, py: 0.5 }}
        >
          <Typography
            variant="body2"
            sx={{ color: "#22C55E", fontWeight: 500 }}
          >
            Long
          </Typography>
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <Typography variant="body2" sx={{ color: "#fff" }}>
              {formatPrice(longTakeProfitPrice)}
              <Typography component="span" sx={{ color: "rgba(255,255,255,0.5)" }}>
                {" / "}
              </Typography>
              <Typography component="span" sx={{ color: "#EF4444" }}>
                {formatPrice(longStopLossPrice)}
              </Typography>
            </Typography>
            <IconButton
              size="small"
              onClick={handleEditTpSl}
              sx={{
                color: "rgba(255,255,255,0.6)",
                p: 0.25,
                "&:hover": { color: "#00F5E0" },
              }}
            >
              <EditIcon sx={{ fontSize: 14 }} />
            </IconButton>
          </Stack>
        </Stack>
      )}

      {tpSlEnabled && hasShortTpSl && (
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ pl: 1, pr: 0.5, py: 0.5 }}
        >
          <Typography
            variant="body2"
            sx={{ color: "#EF4444", fontWeight: 500 }}
          >
            Short
          </Typography>
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <Typography variant="body2" sx={{ color: "#fff" }}>
              {formatPrice(shortTakeProfitPrice)}
              <Typography component="span" sx={{ color: "rgba(255,255,255,0.5)" }}>
                {" / "}
              </Typography>
              <Typography component="span" sx={{ color: "#EF4444" }}>
                {formatPrice(shortStopLossPrice)}
              </Typography>
            </Typography>
            <IconButton
              size="small"
              onClick={handleEditTpSl}
              sx={{
                color: "rgba(255,255,255,0.6)",
                p: 0.25,
                "&:hover": { color: "#00F5E0" },
              }}
            >
              <EditIcon sx={{ fontSize: 14 }} />
            </IconButton>
          </Stack>
        </Stack>
      )}
    </Box>
  );
};

export default OrderOptions;
