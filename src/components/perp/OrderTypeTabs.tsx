'use client';

import { Tabs, Tab } from '@mui/material';
import { usePerpStore } from '@/store/perpStore';

const OrderTypeTabs = () => {
  const activeOrderType = usePerpStore((s) => s.activeOrderType);
  const setActiveOrderType = usePerpStore((s) => s.setActiveOrderType);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: string) => {
    setActiveOrderType(newValue as "market" | "limit" | "stopMarket");
  };

  return (
    <Tabs
      value={activeOrderType}
      onChange={handleTabChange}
      sx={{
        minHeight: '36px',
        '& .MuiTabs-indicator': {
          backgroundColor: '#00F5E0',
          height: '2px',
        },
        '& .MuiTab-root': {
          minHeight: '36px',
          minWidth: 'auto',
          px: 2,
          py: 0.5,
          fontSize: '0.875rem',
          fontWeight: 500,
          textTransform: 'none',
          color: 'rgba(255, 255, 255, 0.6)',
          '&.Mui-selected': {
            color: '#00F5E0',
          },
          '&.Mui-disabled': {
            color: 'rgba(255, 255, 255, 0.3)',
          },
        },
      }}
    >
      <Tab label="Market" value="market" />
      <Tab label="Limit" value="limit" disabled />
      <Tab label="Stop Market" value="stopMarket" disabled />
    </Tabs>
  );
};

export default OrderTypeTabs;
