// Theme system types - Full component theming per wedding

export interface ThemeColors {
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  accent: string;
  accentForeground: string;
  background: string;
  surface: string;
  surfaceElevated: string;
  border: string;
  muted: string;
  mutedForeground: string;
}

export interface ThemeFonts {
  heading: string;
  body: string;
  accent?: string;
}

export interface ThemeSpacing {
  base: number;
  scale: number[];
}

export interface ThemeRadius {
  sm: string;
  md: string;
  lg: string;
  full: string;
}

export interface ThemeShadows {
  sm: string;
  md: string;
  lg: string;
  xl: string;
}

export interface CardTheme {
  background: string;
  border: string;
  shadow: string;
  padding: string;
  imageRadius?: string;
}

export interface ButtonTheme {
  primaryBackground: string;
  primaryForeground: string;
  secondaryBackground: string;
  secondaryForeground: string;
  radius: string;
  padding: string;
}

export interface BottomNavTheme {
  background: string;
  borderTop: string;
  activeColor: string;
  inactiveColor: string;
  height: string;
  cameraButtonSize: string;
}

export interface CameraButtonTheme {
  background: string;
  foreground: string;
  shadow: string;
  border: string;
}

export interface EventCardTheme {
  background: string;
  border: string;
  shadow: string;
  imageRadius: string;
  timeColor: string;
  accentBarWidth: string;
}

export interface AnnouncementTheme {
  background: string;
  border: string;
  shadow: string;
  titleColor: string;
  unreadIndicator: string;
}

export interface PhotoGridTheme {
  gap: string;
  columns: number;
  itemRadius: string;
  overlayBackground: string;
}

export interface ChatTheme {
  background: string;
  bubbleBackground: string;
  bubbleForeground: string;
  ownBubbleBackground: string;
  ownBubbleForeground: string;
  broadcastBackground: string;
  broadcastForeground: string;
  inputBackground: string;
  border: string;
}

export interface SeatingTheme {
  tableBackground: string;
  tableBorder: string;
  tableShadow: string;
  seatBackground: string;
  seatForeground: string;
  currentGuestHighlight: string;
}

export interface ChallengeTheme {
  background: string;
  border: string;
  shadow: string;
  completedBackground: string;
  completedForeground: string;
  pointsColor: string;
}

export interface ComponentThemes {
  card: CardTheme;
  button: ButtonTheme;
  bottomNav: BottomNavTheme;
  cameraButton: CameraButtonTheme;
  eventCard: EventCardTheme;
  announcement: AnnouncementTheme;
  photoGrid: PhotoGridTheme;
  chat: ChatTheme;
  seating: SeatingTheme;
  challenge: ChallengeTheme;
}

export type BackgroundPattern = 'none' | 'dots' | 'lines' | 'waves' | 'floral' | 'geometric' | 'leaves';
export type HeroStyle = 'gradient' | 'image' | 'illustration' | 'split';

export interface WeddingTheme {
  colors: ThemeColors;
  fonts: ThemeFonts;
  spacing: ThemeSpacing;
  radius: ThemeRadius;
  shadows: ThemeShadows;
  components: ComponentThemes;
  backgroundPattern?: BackgroundPattern;
  backgroundPatternOpacity?: number;
  heroStyle: HeroStyle;
}

export type PartialWeddingTheme = Partial<WeddingTheme>;

// Default theme - Warm, elegant, illustrated aesthetic
export const defaultTheme: WeddingTheme = {
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
  spacing: {
    base: 4,
    scale: [0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24],
  },
  radius: {
    sm: '8px',
    md: '16px',
    lg: '24px',
    full: '9999px',
  },
  shadows: {
    sm: '0 1px 2px rgba(0,0,0,0.05)',
    md: '0 4px 12px rgba(0,0,0,0.08)',
    lg: '0 12px 24px rgba(0,0,0,0.1)',
    xl: '0 20px 40px rgba(0,0,0,0.12)',
  },
  components: {
    card: {
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      shadow: 'var(--shadow-md)',
      padding: 'var(--space-6)',
      imageRadius: 'var(--radius-md)',
    },
    button: {
      primaryBackground: 'var(--color-primary)',
      primaryForeground: 'var(--color-primary-foreground)',
      secondaryBackground: 'var(--color-secondary)',
      secondaryForeground: 'var(--color-secondary-foreground)',
      radius: 'var(--radius-full)',
      padding: 'var(--space-3) var(--space-6)',
    },
    bottomNav: {
      background: 'var(--color-surface-elevated)',
      borderTop: '1px solid var(--color-border)',
      activeColor: 'var(--color-primary)',
      inactiveColor: 'var(--color-muted-foreground)',
      height: '88px',
      cameraButtonSize: '64px',
    },
    cameraButton: {
      background: 'var(--color-primary)',
      foreground: 'var(--color-primary-foreground)',
      shadow: 'var(--shadow-lg)',
      border: '4px solid var(--color-background)',
    },
    eventCard: {
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      shadow: 'var(--shadow-md)',
      imageRadius: 'var(--radius-lg)',
      timeColor: 'var(--color-primary)',
      accentBarWidth: '4px',
    },
    announcement: {
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      shadow: 'var(--shadow-sm)',
      titleColor: 'var(--color-primary)',
      unreadIndicator: 'var(--color-accent)',
    },
    photoGrid: {
      gap: 'var(--space-3)',
      columns: 2,
      itemRadius: 'var(--radius-md)',
      overlayBackground: 'rgba(0,0,0,0.4)',
    },
    chat: {
      background: 'var(--color-background)',
      bubbleBackground: 'var(--color-surface)',
      bubbleForeground: 'var(--color-primary-foreground)',
      ownBubbleBackground: 'var(--color-primary)',
      ownBubbleForeground: 'var(--color-primary-foreground)',
      broadcastBackground: 'var(--color-accent)',
      broadcastForeground: 'var(--color-accent-foreground)',
      inputBackground: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
    },
    seating: {
      tableBackground: 'var(--color-surface)',
      tableBorder: '1px solid var(--color-border)',
      tableShadow: 'var(--shadow-md)',
      seatBackground: 'var(--color-muted)',
      seatForeground: 'var(--color-muted-foreground)',
      currentGuestHighlight: 'var(--color-primary)',
    },
    challenge: {
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      shadow: 'var(--shadow-md)',
      completedBackground: 'var(--color-primary)',
      completedForeground: 'var(--color-primary-foreground)',
      pointsColor: 'var(--color-accent)',
    },
  },
  backgroundPattern: 'dots',
  backgroundPatternOpacity: 0.04,
  heroStyle: 'gradient',
};

// Theme presets for quick selection
export const themePresets: Record<string, Partial<WeddingTheme>> = {
  'classic-romance': {
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
    backgroundPattern: 'floral',
    heroStyle: 'gradient',
  },
  'modern-minimal': {
    colors: {
      primary: '#2D2D2D',
      primaryForeground: '#FFFFFF',
      secondary: '#F5F5F5',
      secondaryForeground: '#2D2D2D',
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
  'rustic-garden': {
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
    backgroundPattern: 'leaves',
    heroStyle: 'illustration',
  },
  'bollywood-glam': {
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
    heroStyle: 'gradient',
  },
};

/**
 * Deep merge a partial theme with a base theme
 * Recursively merges nested objects, preserving structure
 */
export function mergeTheme<T extends Record<string, any>>(
  partial: Partial<T>,
  base: T
): T {
  const result = { ...base };

  for (const key of Object.keys(partial) as Array<keyof T>) {
    const partialValue = partial[key];
    const baseValue = base[key];

    if (
      partialValue !== null &&
      typeof partialValue === 'object' &&
      !Array.isArray(partialValue) &&
      baseValue !== null &&
      typeof baseValue === 'object' &&
      !Array.isArray(baseValue)
    ) {
      // Recursively merge nested objects
      (result as any)[key] = mergeTheme(
        partialValue as Record<string, any>,
        baseValue as Record<string, any>
      );
    } else if (partialValue !== undefined) {
      // Replace primitives and arrays
      (result as any)[key] = partialValue;
    }
  }

  return result;
}