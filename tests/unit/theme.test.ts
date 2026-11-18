// Theme system unit tests
import { describe, it, expect } from 'vitest';
import { defaultTheme } from '@/lib/theme/types';
import { themeToCSSVariables, applyThemeToDocument } from '@/lib/theme/cssVariables';
import { themePresets, mergeTheme, getPresetKeys } from '@/lib/theme/presets';

describe('Theme System', () => {
  describe('defaultTheme', () => {
    it('has all required color tokens', () => {
      expect(defaultTheme.colors).toHaveProperty('primary');
      expect(defaultTheme.colors).toHaveProperty('primaryForeground');
      expect(defaultTheme.colors).toHaveProperty('secondary');
      expect(defaultTheme.colors).toHaveProperty('secondaryForeground');
      expect(defaultTheme.colors).toHaveProperty('accent');
      expect(defaultTheme.colors).toHaveProperty('accentForeground');
      expect(defaultTheme.colors).toHaveProperty('background');
      expect(defaultTheme.colors).toHaveProperty('surface');
      expect(defaultTheme.colors).toHaveProperty('surfaceElevated');
      expect(defaultTheme.colors).toHaveProperty('border');
      expect(defaultTheme.colors).toHaveProperty('muted');
      expect(defaultTheme.colors).toHaveProperty('mutedForeground');
    });

    it('has all required font tokens', () => {
      expect(defaultTheme.fonts).toHaveProperty('heading');
      expect(defaultTheme.fonts).toHaveProperty('body');
      expect(defaultTheme.fonts).toHaveProperty('accent');
    });

    it('has all required spacing tokens', () => {
      expect(defaultTheme.spacing).toHaveProperty('base');
      expect(defaultTheme.spacing).toHaveProperty('scale');
      expect(Array.isArray(defaultTheme.spacing.scale)).toBe(true);
    });

    it('has all required radius tokens', () => {
      expect(defaultTheme.radius).toHaveProperty('sm');
      expect(defaultTheme.radius).toHaveProperty('md');
      expect(defaultTheme.radius).toHaveProperty('lg');
      expect(defaultTheme.radius).toHaveProperty('full');
    });

    it('has all required shadow tokens', () => {
      expect(defaultTheme.shadows).toHaveProperty('sm');
      expect(defaultTheme.shadows).toHaveProperty('md');
      expect(defaultTheme.shadows).toHaveProperty('lg');
      expect(defaultTheme.shadows).toHaveProperty('xl');
    });

    it('has all component themes', () => {
      const components = defaultTheme.components;
      expect(components).toHaveProperty('card');
      expect(components).toHaveProperty('button');
      expect(components).toHaveProperty('bottomNav');
      expect(components).toHaveProperty('cameraButton');
      expect(components).toHaveProperty('eventCard');
      expect(components).toHaveProperty('announcement');
      expect(components).toHaveProperty('photoGrid');
      expect(components).toHaveProperty('chat');
      expect(components).toHaveProperty('seating');
      expect(components).toHaveProperty('challenge');
    });
  });

  describe('mergeTheme', () => {
    it('merges partial theme with defaults', () => {
      const custom = {
        colors: {
          primary: '#FF0000',
        },
      };
      const merged = mergeTheme(custom as any, defaultTheme);

      expect(merged.colors.primary).toBe('#FF0000');
      expect(merged.colors.secondary).toBe(defaultTheme.colors.secondary);
    });

    it('deep merges nested objects', () => {
      const custom = {
        components: {
          button: {
            primaryBackground: '#CUSTOM',
          },
        },
      };
      const merged = mergeTheme(custom as any, defaultTheme);

      expect(merged.components.button.primaryBackground).toBe('#CUSTOM');
      expect(merged.components.button.primaryForeground).toBe(defaultTheme.components.button.primaryForeground);
    });

    it('handles array replacement', () => {
      const custom = {
        spacing: {
          scale: [0, 2, 4, 6],
        },
      };
      const merged = mergeTheme(custom as any, defaultTheme);

      expect(merged.spacing.scale).toEqual([0, 2, 4, 6]);
    });
  });

  describe('themeToCSSVariables', () => {
    it('generates CSS variables for all color tokens', () => {
      const vars = themeToCSSVariables(defaultTheme);

      expect(vars).toHaveProperty('--color-primary');
      expect(vars).toHaveProperty('--color-primary-foreground');
      expect(vars).toHaveProperty('--color-background');
      expect(vars).toHaveProperty('--color-surface');
    });

    it('generates CSS variables for fonts', () => {
      const vars = themeToCSSVariables(defaultTheme);

      expect(vars).toHaveProperty('--font-heading');
      expect(vars).toHaveProperty('--font-body');
      expect(vars).toHaveProperty('--font-accent');
    });

    it('generates CSS variables for spacing scale', () => {
      const vars = themeToCSSVariables(defaultTheme);

      expect(vars).toHaveProperty('--space-0');
      expect(vars).toHaveProperty('--space-1');
      expect(vars).toHaveProperty('--space-4');
    });

    it('generates component-specific variables', () => {
      const vars = themeToCSSVariables(defaultTheme);

      expect(vars).toHaveProperty('--card-background');
      expect(vars).toHaveProperty('--button-primary-bg');
      expect(vars).toHaveProperty('--bottom-nav-bg');
      expect(vars).toHaveProperty('--camera-btn-bg');
    });

    it('generates background pattern variables', () => {
      const vars = themeToCSSVariables(defaultTheme);

      expect(vars).toHaveProperty('--pattern-dots');
      expect(vars).toHaveProperty('--pattern-lines');
    });
  });

  describe('themePresets', () => {
    it('has all expected presets', () => {
      const keys = getPresetKeys();
      expect(keys).toContain('classic-romance');
      expect(keys).toContain('modern-minimal');
      expect(keys).toContain('rustic-garden');
      expect(keys).toContain('bollywood-glam');
      expect(keys).toContain('ocean-breeze');
      expect(keys).toContain('vintage-lace');
      expect(keys).toContain('midnight-elegance');
    });

    it('each preset has required properties', () => {
      const keys = getPresetKeys();
      keys.forEach(key => {
        const preset = themePresets[key];
        expect(preset).toHaveProperty('name');
        expect(preset).toHaveProperty('description');
        expect(preset).toHaveProperty('preview');
        expect(preset).toHaveProperty('theme');
      });
    });
  });

  describe('mergePresetTheme', () => {
    it('applies preset correctly', () => {
      const result = mergeTheme(themePresets['modern-minimal'].theme as any, defaultTheme);

      expect(result.colors.primary).toBe('#1A1A1A');
      expect(result.backgroundPattern).toBe('none');
      expect(result.heroStyle).toBe('split');
    });
  });
});