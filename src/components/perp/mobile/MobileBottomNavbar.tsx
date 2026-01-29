'use client';

import { Box, Typography } from '@mui/material';
import { useRouter, usePathname } from 'next/navigation';
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';

interface NavItem {
  label: string;
  icon: React.ReactNode;
  path: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Wallet',
    icon: <AccountBalanceWalletOutlinedIcon sx={{ fontSize: 24 }} />,
    path: '/perp/wallet',
  },
  {
    label: 'Trade',
    icon: <SwapHorizIcon sx={{ fontSize: 24 }} />,
    path: '/perp',
  },
];

export default function MobileBottomNavbar() {
  const router = useRouter();
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === '/perp') {
      return pathname === '/perp' || pathname === '/perp/mobile-trade';
    }
    return pathname.startsWith(path);
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        backgroundColor: '#050C19',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        py: 1,
        px: 2,
        zIndex: 1000,
      }}
    >
      {NAV_ITEMS.map((item) => {
        const active = isActive(item.path);
        return (
          <Box
            key={item.label}
            onClick={() => router.push(item.path)}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 0.5,
              cursor: 'pointer',
              flex: 1,
              py: 0.5,
              color: active ? '#fff' : 'rgba(255, 255, 255, 0.5)',
              transition: 'color 0.2s ease',
              '&:hover': {
                color: '#fff',
              },
            }}
          >
            <Box
              sx={{
                color: active ? '#00F5E0' : 'inherit',
              }}
            >
              {item.icon}
            </Box>
            <Typography
              sx={{
                fontSize: '0.7rem',
                fontWeight: active ? 600 : 400,
                color: active ? '#fff' : 'inherit',
              }}
            >
              {item.label}
            </Typography>
            {active && (
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  width: '40px',
                  height: '2px',
                  backgroundColor: '#00F5E0',
                  borderRadius: '2px 2px 0 0',
                }}
              />
            )}
          </Box>
        );
      })}
    </Box>
  );
}
