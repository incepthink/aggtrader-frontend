// components/swap/SwapSettings.tsx
"use client";

import { SettingOutlined } from "@ant-design/icons";
import { Popover, Radio } from "antd";
import React from "react";

interface SwapSettingsProps {
  slippage: number;
  onSlippageChange: (e: any) => void;
}

export const SwapSettings: React.FC<SwapSettingsProps> = ({
  slippage,
  onSlippageChange,
}) => {
  const settings = (
    <>
      <div>Slippage Tolerance</div>
      <Radio.Group value={slippage} onChange={onSlippageChange}>
        <Radio.Button value={0.5}>0.5%</Radio.Button>
        <Radio.Button value={2.5}>2.5%</Radio.Button>
        <Radio.Button value={5}>5.0%</Radio.Button>
      </Radio.Group>
    </>
  );

  return (
    <Popover
      content={settings}
      title="Settings"
      trigger="click"
      placement="bottomRight"
    >
      <SettingOutlined className="text-white text-xl hover:rotate-90 transition duration-300 hover:text-[#00F5E0]" />
    </Popover>
  );
};
