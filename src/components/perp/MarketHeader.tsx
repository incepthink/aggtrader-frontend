'use client';

import { Box, Typography, Stack } from '@mui/material';
import { KumaTicker } from '@kumabid/kuma-sdk';
import { useEffect, useState } from 'react';

interface MarketHeaderProps {
  tickerData: KumaTicker | null;
  isConnected: boolean;
}

export default function MarketHeader({ tickerData, isConnected }: MarketHeaderProps) {
  const [countdown, setCountdown] = useState<string>('--:--:--');

  // Calculate countdown to next funding time
  useEffect(() => {
    if (!tickerData?.nextFundingTime) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const timeLeft = tickerData.nextFundingTime - now;

      if (timeLeft <= 0) {
        setCountdown('00:00:00');
        return;
      }

      const hours = Math.floor(timeLeft / (1000 * 60 * 60));
      const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

      setCountdown(
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [tickerData?.nextFundingTime]);

  const formatPrice = (price: string | null | undefined): string => {
    if (!price) return '--';
    const num = parseFloat(price);
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatVolume = (volume: string | undefined): string => {
    if (!volume) return '--';
    const num = parseFloat(volume);
    if (num >= 1_000_000) {
      return `$${(num / 1_000_000).toFixed(2)}M`;
    }
    if (num >= 1_000) {
      return `$${(num / 1_000).toFixed(2)}K`;
    }
    return `$${num.toFixed(2)}`;
  };

  const formatPercentage = (percent: string | null | undefined): string => {
    if (!percent) return '--';
    const num = parseFloat(percent);
    return `${num >= 0 ? '+' : ''}${num.toFixed(2)}%`;
  };

  const getChangeColor = (percent: string | null | undefined): string => {
    if (!percent) return '#999';
    const num = parseFloat(percent);
    return num >= 0 ? '#00F5E0' : '#FF4444';
  };

  return (
    <Box
      sx={{
        padding: '16px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        flexWrap: 'wrap',
      }}
    >
      {/* Market Symbol */}
      <Stack direction="row" alignItems="center" spacing={1}>
        <Typography
          variant="h6"
          sx={{
            color: '#fff',
            fontWeight: 600,
            fontSize: '18px',
          }}
        >
          {tickerData?.market || 'BTC-USD'}
        </Typography>
        <Box
          sx={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: isConnected ? '#00F5E0' : '#666',
          }}
        />
      </Stack>

      {/* Price */}
      <Stack spacing={0.5}>
        <Typography
          variant="caption"
          sx={{
            color: '#999',
            fontSize: '11px',
            textTransform: 'uppercase',
          }}
        >
          Price
        </Typography>
        <Typography
          variant="body1"
          sx={{
            color: '#fff',
            fontWeight: 600,
            fontSize: '16px',
          }}
        >
          {formatPrice(tickerData?.close)}
        </Typography>
      </Stack>

      {/* Index Price */}
      <Stack spacing={0.5}>
        <Typography
          variant="caption"
          sx={{
            color: '#999',
            fontSize: '11px',
            textTransform: 'uppercase',
          }}
        >
          Index
        </Typography>
        <Typography
          variant="body1"
          sx={{
            color: '#fff',
            fontWeight: 600,
            fontSize: '16px',
          }}
        >
          {formatPrice(tickerData?.indexPrice)}
        </Typography>
      </Stack>

      {/* 24h Change */}
      <Stack spacing={0.5}>
        <Typography
          variant="caption"
          sx={{
            color: '#999',
            fontSize: '11px',
            textTransform: 'uppercase',
          }}
        >
          24h Change
        </Typography>
        <Typography
          variant="body1"
          sx={{
            color: getChangeColor(tickerData?.percentChange),
            fontWeight: 600,
            fontSize: '16px',
          }}
        >
          {formatPercentage(tickerData?.percentChange)}
        </Typography>
      </Stack>

      {/* Funding / Countdown */}
      <Stack spacing={0.5}>
        <Typography
          variant="caption"
          sx={{
            color: '#999',
            fontSize: '11px',
            textTransform: 'uppercase',
          }}
        >
          Funding / Countdown
        </Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography
            variant="body1"
            sx={{
              color: getChangeColor(tickerData?.currentFundingRate),
              fontWeight: 600,
              fontSize: '14px',
            }}
          >
            {tickerData?.currentFundingRate
              ? `${(parseFloat(tickerData.currentFundingRate) * 100).toFixed(4)}%`
              : '--'}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: '#00F5E0',
              fontSize: '14px',
            }}
          >
            / {countdown}
          </Typography>
        </Stack>
      </Stack>

      {/* Open Interest */}
      <Stack spacing={0.5}>
        <Typography
          variant="caption"
          sx={{
            color: '#999',
            fontSize: '11px',
            textTransform: 'uppercase',
          }}
        >
          Open Interest
        </Typography>
        <Typography
          variant="body1"
          sx={{
            color: '#fff',
            fontWeight: 600,
            fontSize: '16px',
          }}
        >
          {formatVolume(tickerData?.openInterest)}
        </Typography>
      </Stack>

      {/* 24h Volume */}
      <Stack spacing={0.5}>
        <Typography
          variant="caption"
          sx={{
            color: '#999',
            fontSize: '11px',
            textTransform: 'uppercase',
          }}
        >
          24h Volume
        </Typography>
        <Typography
          variant="body1"
          sx={{
            color: '#fff',
            fontWeight: 600,
            fontSize: '16px',
          }}
        >
          {formatVolume(tickerData?.quoteVolume)}
        </Typography>
      </Stack>
    </Box>
  );
}
