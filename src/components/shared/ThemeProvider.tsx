'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { WeddingTheme } from '@/lib/theme/types';
import { defaultTheme } from '@/lib/theme/types';
import { applyThemeToDocument } from '@/lib/theme/cssVariables';

interface ThemeContextType {
  theme: WeddingTheme;
  isLoading: boolean;
  weddingSlug: string;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

interface ThemeProviderProps {
  children: ReactNode;
  initialTheme?: WeddingTheme;
  weddingSlug: string;
}

export function ThemeProvider({ children, initialTheme = defaultTheme, weddingSlug }: ThemeProviderProps) {
  const [theme, setTheme] = useState<WeddingTheme>(initialTheme);
  const [isLoading, setIsLoading] = useState(!initialTheme);

  useEffect(() => {
    if (!initialTheme) {
      // Fetch theme from server
      fetch(`/api/weddings/${weddingSlug}/theme`)
        .then((res) => res.json())
        .then((data) => {
          if (data.theme) {
            setTheme(data.theme);
          }
        })
        .catch(() => {
          // Use default theme on error
        })
        .finally(() => setIsLoading(false));
    }
  }, [initialTheme, weddingSlug]);

  // Apply theme to document when it changes
  useEffect(() => {
    applyThemeToDocument(theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, isLoading, weddingSlug }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export function useThemeVariables() {
  const { theme } = useTheme();
  return theme;
}