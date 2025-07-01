import GlowBox from "@/components/common/ui/GlowBox";
import ChartSpot from "@/components/spot/ChartSpot";
import OneInchSwap from "@/components/spot/OneInchSwap";
import TokenBalancesCard from "@/components/spot/TokenBalancesCard";
import TokenSelect from "@/components/spot/TokenSelect";
import { Box, Container, Stack } from "@mui/material";
import React from "react";

const page = () => {
  return (
    <Container maxWidth="xl">
      <Stack spacing={2}>
        <Box>
          <TokenSelect />
        </Box>
        <Stack direction={"row"} spacing={2} alignItems={"stretch"}>
          <Box sx={{ flex: 2 }}>
            <GlowBox
              sx={{
                height: "100%",
                position: "relative",
                backgroundImage:
                  "radial-gradient(circle, rgba(255,255,255,0.2) 1px, transparent 1px)",
                backgroundSize: "30px 30px",
              }}
            >
              <ChartSpot />
            </GlowBox>
          </Box>
          <Box sx={{ flex: 1 }}>
            <GlowBox sx={{ height: "100%" }}>
              <OneInchSwap />
            </GlowBox>
          </Box>
        </Stack>
        <Box>
          <GlowBox>
            <TokenBalancesCard />
          </GlowBox>
        </Box>
      </Stack>
    </Container>
  );
};

export default page;
