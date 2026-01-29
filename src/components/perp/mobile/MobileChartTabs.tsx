'use client';

import { Box, Typography } from '@mui/material';
import { useState } from 'react';

type TabType = 'chart' | 'depth' | 'orderbook' | 'trades';

interface MobileChartTabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const TABS: { id: TabType; label: string }[] = [
  { id: 'chart', label: 'Chart' },
  { id: 'depth', label: 'Depth' },
  { id: 'orderbook', label: 'Order Book' },
  { id: 'trades', label: 'Trades' },
];

export default function MobileChartTabs({ activeTab, onTabChange }: MobileChartTabsProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        backgroundColor: 'transparent',
      }}
    >
      {TABS.map((tab) => (
        <Box
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          sx={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            py: 1.5,
            cursor: 'pointer',
            position: 'relative',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
            },
          }}
        >
          <Typography
            sx={{
              fontSize: '0.8rem',
              fontWeight: activeTab === tab.id ? 600 : 400,
              color: activeTab === tab.id ? '#fff' : 'rgba(255, 255, 255, 0.5)',
              transition: 'color 0.2s ease',
            }}
          >
            {tab.label}
          </Typography>
          {activeTab === tab.id && (
            <Box
              sx={{
                position: 'absolute',
                bottom: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                width: '60%',
                height: '2px',
                backgroundColor: '#00F5E0',
              }}
            />
          )}
        </Box>
      ))}
    </Box>
  );
}
