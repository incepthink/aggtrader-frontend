'use client';

import { useMediaQuery } from '@mui/material';

/**
 * Global responsive breakpoint for all /perp/* pages
 * Desktop: >= 1280px
 * Mobile: < 1280px
 */
export const PERP_DESKTOP_BREAKPOINT = 1280;

/**
 * Hook to determine if the current viewport is mobile for perp pages
 * Uses a single breakpoint at 1280px
 *
 * @returns {boolean} true if viewport width < 1280px
 */
export function usePerpMobile(): boolean {
  const isMobile = useMediaQuery(`(max-width: ${PERP_DESKTOP_BREAKPOINT - 1}px)`);
  return isMobile;
}

/**
 * Hook to determine if the current viewport is desktop for perp pages
 * Uses a single breakpoint at 1280px
 *
 * @returns {boolean} true if viewport width >= 1280px
 */
export function usePerpDesktop(): boolean {
  const isDesktop = useMediaQuery(`(min-width: ${PERP_DESKTOP_BREAKPOINT}px)`);
  return isDesktop;
}

/**
 * Hook that returns both mobile and desktop states for perp pages
 *
 * @returns {{ isMobile: boolean, isDesktop: boolean }}
 */
export function usePerpResponsive(): { isMobile: boolean; isDesktop: boolean } {
  const isMobile = usePerpMobile();
  const isDesktop = usePerpDesktop();
  return { isMobile, isDesktop };
}
