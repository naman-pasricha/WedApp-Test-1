// Theme presets for quick selection in host dashboard
// Each preset is a partial theme that merges with defaults

import type { WeddingTheme, PartialWeddingTheme } from './types';
import { defaultTheme } from './types';

export interface ThemePreset {
  name: string;
  description: string;
  preview: string;
  theme: PartialWeddingTheme;
}

export type ThemePresets = Record<string, ThemePreset>;

export const themePresets: ThemePresets = {
  'classic-romance': {
    name: 'Classic Romance',
    description: 'Warm terracotta and cream with elegant serif headings',
    preview: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=400&q=80',
    theme: {
      colors: {
        primary: '#C4785E',
        primaryForeground: '#FFFFFF',
        secondary: '#E8D5C4',
        secondaryForeground: '#3D3D3D',
        accent: '#D4A574',
        accentForeground: '#FFFFFF',
        background: '#FFF8F3',
        surface: '#FFFFFF',
        surfaceElevated: '#FFFFFF',
        border: '#E8D5C4',
        muted: '#F5EDE5',
        mutedForeground: '#8B7D6B',
      },
      fonts: {
        heading: '"Playfair Display", Georgia, serif',
        body: '"DM Sans", -apple-system, BlinkMacSystemFont, sans-serif',
        accent: '"Great Vibes", cursive',
      },
      backgroundPattern: 'dots',
      backgroundPatternOpacity: 0.04,
      heroStyle: 'gradient',
    },
  },
  'modern-minimal': {
    name: 'Modern Minimal',
    description: 'Clean black and white with refined typography',
    preview: 'https://images.unsplash.com/photo-1606800052052-a08af7148866?w=400&q=80',
    theme: {
      colors: {
        primary: '#1A1A1A',
        primaryForeground: '#FFFFFF',
        secondary: '#F5F5F5',
        secondaryForeground: '#1A1A1A',
        accent: '#C4785E',
        accentForeground: '#FFFFFF',
        background: '#FFFFFF',
        surface: '#FFFFFF',
        surfaceElevated: '#FAFAFA',
        border: '#E5E5E5',
        muted: '#F5F5F5',
        mutedForeground: '#737373',
      },
      fonts: {
        heading: '"DM Sans", -apple-system, BlinkMacSystemFont, sans-serif',
        body: '"DM Sans", -apple-system, BlinkMacSystemFont, sans-serif',
        accent: '"Playfair Display", Georgia, serif',
      },
      backgroundPattern: 'none',
      heroStyle: 'split',
      radius: {
        sm: '4px',
        md: '8px',
        lg: '12px',
        full: '9999px',
      },
    },
  },
  'rustic-garden': {
    name: 'Rustic Garden',
    description: 'Earthy sage greens with floral accents',
    preview: 'https://images.unsplash.com/photo-1465495976277-4387d4b0f4c6?w=400&q=80',
    theme: {
      colors: {
        primary: '#6B8E5C',
        primaryForeground: '#FFFFFF',
        secondary: '#E8F0E3',
        secondaryForeground: '#2D3D24',
        accent: '#D4A574',
        accentForeground: '#FFFFFF',
        background: '#FAFDF8',
        surface: '#FFFFFF',
        surfaceElevated: '#FFFFFF',
        border: '#D4E4C9',
        muted: '#F0F7EB',
        mutedForeground: '#6B8E5C',
      },
      fonts: {
        heading: '"Playfair Display", Georgia, serif',
        body: '"DM Sans", -apple-system, BlinkMacSystemFont, sans-serif',
        accent: '"Great Vibes", cursive',
      },
      backgroundPattern: 'dots',
      backgroundPatternOpacity: 0.03,
      heroStyle: 'illustration',
    },
  },
  'bollywood-glam': {
    name: 'Bollywood Glam',
    description: 'Rich gold and ivory with dramatic flair',
    preview: 'https://images.unsplash.com/photo-1583939003579-783e7e8b3d8b?w=400&q=80',
    theme: {
      colors: {
        primary: '#B8860B',
        primaryForeground: '#FFFFFF',
        secondary: '#FFF8DC',
        secondaryForeground: '#3D3D3D',
        accent: '#E6B800',
        accentForeground: '#FFFFFF',
        background: '#FFFEF7',
        surface: '#FFFFFF',
        surfaceElevated: '#FFFFFF',
        border: '#FFD700',
        muted: '#FFF8DC',
        mutedForeground: '#B8860B',
      },
      fonts: {
        heading: '"Playfair Display", Georgia, serif',
        body: '"DM Sans", -apple-system, BlinkMacSystemFont, sans-serif',
        accent: '"Great Vibes", cursive',
      },
      backgroundPattern: 'geometric',
      backgroundPatternOpacity: 0.05,
      heroStyle: 'gradient',
    },
  },
  'ocean-breeze': {
    name: 'Ocean Breeze',
    description: 'Soft blues and sandy neutrals for beach weddings',
    preview: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=80',
    theme: {
      colors: {
        primary: '#3A7CA5',
        primaryForeground: '#FFFFFF',
        secondary: '#E8F1F8',
        secondaryForeground: '#1B3A4B',
        accent: '#E8B87D',
        accentForeground: '#FFFFFF',
        background: '#FAFCFD',
        surface: '#FFFFFF',
        surfaceElevated: '#FFFFFF',
        border: '#D1E8F0',
        muted: '#F0F7FA',
        mutedForeground: '#5A8B9E',
      },
      fonts: {
        heading: '"Playfair Display", Georgia, serif',
        body: '"DM Sans", -apple-system, BlinkMacSystemFont, sans-serif',
        accent: '"Great Vibes", cursive',
      },
      backgroundPattern: 'waves',
      backgroundPatternOpacity: 0.03,
      heroStyle: 'image',
    },
  },
  'vintage-lace': {
    name: 'Vintage Lace',
    description: 'Dusty rose and antique ivory with delicate details',
    preview: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=400&q=80',
    theme: {
      colors: {
        primary: '#B88491',
        primaryForeground: '#FFFFFF',
        secondary: '#F5E6EA',
        secondaryForeground: '#4A343D',
        accent: '#D4A574',
        accentForeground: '#FFFFFF',
        background: '#FDF8F9',
        surface: '#FFFFFF',
        surfaceElevated: '#FFFFFF',
        border: '#E8D5DC',
        muted: '#F5E6EA',
        mutedForeground: '#9E7B85',
      },
      fonts: {
        heading: '"Playfair Display", Georgia, serif',
        body: '"DM Sans", -apple-system, BlinkMacSystemFont, sans-serif',
        accent: '"Great Vibes", cursive',
      },
      backgroundPattern: 'floral',
      backgroundPatternOpacity: 0.04,
      heroStyle: 'gradient',
    },
  },
  'midnight-elegance': {
    name: 'Midnight Elegance',
    description: 'Deep navy and champagne for evening affairs',
    preview: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=400&q=80',
    theme: {
      colors: {
        primary: '#1B2A4A',
        primaryForeground: '#FFFFFF',
        secondary: '#F0EDE5',
        secondaryForeground: '#1B2A4A',
        accent: '#C9A876',
        accentForeground: '#1B2A4A',
        background: '#0F1A2E',
        surface: '#1B2A4A',
        surfaceElevated: '#243B5E',
        border: '#C9A876',
        muted: '#1B2A4A',
        mutedForeground: '#A89B8A',
      },
      fonts: {
        heading: '"Playfair Display", Georgia, serif',
        body: '"DM Sans", -apple-system, BlinkMacSystemFont, sans-serif',
        accent: '"Great Vibes", cursive',
      },
      backgroundPattern: 'geometric',
      backgroundPatternOpacity: 0.02,
      heroStyle: 'split',
    },
  },
};

export function mergeTheme(preset: Partial<WeddingTheme>, base: WeddingTheme = defaultTheme): WeddingTheme {
  return {
    colors: { ...base.colors, ...preset.colors },
    fonts: { ...base.fonts, ...preset.fonts },
    spacing: { ...base.spacing, ...preset.spacing },
    radius: { ...base.radius, ...preset.radius },
    shadows: { ...base.shadows, ...preset.shadows },
    components: {
      card: { ...base.components.card, ...preset.components?.card },
      button: { ...base.components.button, ...preset.components?.button },
      bottomNav: { ...base.components.bottomNav, ...preset.components?.bottomNav },
      cameraButton: { ...base.components.cameraButton, ...preset.components?.cameraButton },
      eventCard: { ...base.components.eventCard, ...preset.components?.eventCard },
      announcement: { ...base.components.announcement, ...preset.components?.announcement },
      photoGrid: { ...base.components.photoGrid, ...preset.components?.photoGrid },
      chat: { ...base.components.chat, ...preset.components?.chat },
      seating: { ...base.components.seating, ...preset.components?.seating },
      challenge: { ...base.components.challenge, ...preset.components?.challenge },
    },
    backgroundPattern: preset.backgroundPattern ?? base.backgroundPattern,
    backgroundPatternOpacity: preset.backgroundPatternOpacity ?? base.backgroundPatternOpacity,
    heroStyle: preset.heroStyle ?? base.heroStyle,
  };
}

export function getPresetKeys(): string[] {
  return Object.keys(themePresets);
}

export function getPreset(key: string) {
  return themePresets[key as keyof typeof themePresets];
}