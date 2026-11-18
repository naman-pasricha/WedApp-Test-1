// Theme utility functions - Server-side theme fetching and merging
import { createServerClient } from '@/lib/supabase/server';
import { defaultTheme, type WeddingTheme, mergeTheme } from './types';

/**
 * Fetch wedding theme from database and merge with defaults
 * This runs on the server and returns a fully resolved theme object
 */
export async function getWeddingTheme(slug: string): Promise<WeddingTheme> {
  const supabase = createServerClient();

  const { data: wedding } = await supabase
    .rpc('get_wedding_by_slug', { p_slug: slug })
    .single();

  if (!wedding || !wedding.theme) {
    return defaultTheme;
  }

  // Merge stored theme with defaults
  return mergeTheme(wedding.theme as Partial<WeddingTheme>, defaultTheme);
}

/**
 * Get theme CSS variables as a string for inline styles
 */
export function themeToInlineStyles(theme: WeddingTheme): React.CSSProperties {
  const spacing = theme.spacing;
  const base = spacing.base;

  return {
    '--color-primary': theme.colors.primary,
    '--color-primary-foreground': theme.colors.primaryForeground,
    '--color-secondary': theme.colors.secondary,
    '--color-secondary-foreground': theme.colors.secondaryForeground,
    '--color-accent': theme.colors.accent,
    '--color-accent-foreground': theme.colors.accentForeground,
    '--color-background': theme.colors.background,
    '--color-surface': theme.colors.surface,
    '--color-surface-elevated': theme.colors.surfaceElevated,
    '--color-border': theme.colors.border,
    '--color-muted': theme.colors.muted,
    '--color-muted-foreground': theme.colors.mutedForeground,
    '--font-heading': theme.fonts.heading,
    '--font-body': theme.fonts.body,
    '--font-accent': theme.fonts.accent,
    '--radius-sm': theme.radius.sm,
    '--radius-md': theme.radius.md,
    '--radius-lg': theme.radius.lg,
    '--radius-full': theme.radius.full,
    '--shadow-sm': theme.shadows.sm,
    '--shadow-md': theme.shadows.md,
    '--shadow-lg': theme.shadows.lg,
    '--shadow-xl': theme.shadows.xl,
    '--space-0': `${spacing.scale[0] * base}px`,
    '--space-1': `${spacing.scale[1] * base}px`,
    '--space-2': `${spacing.scale[2] * base}px`,
    '--space-3': `${spacing.scale[3] * base}px`,
    '--space-4': `${spacing.scale[4] * base}px`,
    '--space-5': `${spacing.scale[5] * base}px`,
    '--space-6': `${spacing.scale[6] * base}px`,
    '--space-8': `${spacing.scale[7] * base}px`,
    '--space-10': `${spacing.scale[8] * base}px`,
    '--space-12': `${spacing.scale[9] * base}px`,
    '--space-16': `${spacing.scale[10] * base}px`,
    '--space-20': `${spacing.scale[11] * base}px`,
    '--space-24': `${spacing.scale[12] * base}px`,
    '--bottom-nav-height': theme.components.bottomNav.height,
    '--bottom-nav-bg': theme.components.bottomNav.background,
    '--bottom-nav-border': theme.components.bottomNav.borderTop,
    '--bottom-nav-active': theme.components.bottomNav.activeColor,
    '--bottom-nav-inactive': theme.components.bottomNav.inactiveColor,
    '--camera-btn-bg': theme.components.cameraButton.background,
    '--camera-btn-fg': theme.components.cameraButton.foreground,
    '--camera-btn-shadow': theme.components.cameraButton.shadow,
    '--camera-btn-border': theme.components.cameraButton.border,
    '--photo-grid-gap': theme.components.photoGrid.gap,
    '--photo-grid-columns': theme.components.photoGrid.columns.toString(),
    '--photo-grid-item-radius': theme.components.photoGrid.itemRadius,
    '--photo-grid-overlay-bg': theme.components.photoGrid.overlayBackground,
  } as React.CSSProperties;
}

/**
 * Generate a unique theme key for caching
 */
export function getThemeCacheKey(slug: string): string {
  return `theme:${slug}`;
}