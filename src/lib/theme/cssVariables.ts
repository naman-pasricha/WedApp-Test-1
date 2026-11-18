// Theme to CSS Variables generator
// Converts WeddingTheme JSON to CSS custom properties for runtime theming

import type { WeddingTheme } from './types';

export function themeToCSSVariables(theme: WeddingTheme): Record<string, string> {
  const vars: Record<string, string> = {};

  // Colors
  vars['--color-primary'] = theme.colors.primary;
  vars['--color-primary-foreground'] = theme.colors.primaryForeground;
  vars['--color-secondary'] = theme.colors.secondary;
  vars['--color-secondary-foreground'] = theme.colors.secondaryForeground;
  vars['--color-accent'] = theme.colors.accent;
  vars['--color-accent-foreground'] = theme.colors.accentForeground;
  vars['--color-background'] = theme.colors.background;
  vars['--color-surface'] = theme.colors.surface;
  vars['--color-surface-elevated'] = theme.colors.surfaceElevated;
  vars['--color-border'] = theme.colors.border;
  vars['--color-muted'] = theme.colors.muted;
  vars['--color-muted-foreground'] = theme.colors.mutedForeground;

  // Fonts
  vars['--font-heading'] = theme.fonts.heading;
  vars['--font-body'] = theme.fonts.body;
  vars['--font-accent'] = theme.fonts.accent ?? theme.fonts.heading;

  // Spacing
  theme.spacing.scale.forEach((value, index) => {
    vars[`--space-${index}`] = `${value * theme.spacing.base}px`;
  });

  // Radius
  vars['--radius-sm'] = theme.radius.sm;
  vars['--radius-md'] = theme.radius.md;
  vars['--radius-lg'] = theme.radius.lg;
  vars['--radius-full'] = theme.radius.full;

  // Shadows
  vars['--shadow-sm'] = theme.shadows.sm;
  vars['--shadow-md'] = theme.shadows.md;
  vars['--shadow-lg'] = theme.shadows.lg;
  vars['--shadow-xl'] = theme.shadows.xl;

  // Component themes - Card
  vars['--card-background'] = theme.components.card.background;
  vars['--card-border'] = theme.components.card.border;
  vars['--card-shadow'] = theme.components.card.shadow;
  vars['--card-padding'] = theme.components.card.padding;
  vars['--card-image-radius'] = theme.components.card.imageRadius ?? theme.radius.md;

  // Component themes - Button
  vars['--button-primary-bg'] = theme.components.button.primaryBackground;
  vars['--button-primary-fg'] = theme.components.button.primaryForeground;
  vars['--button-secondary-bg'] = theme.components.button.secondaryBackground;
  vars['--button-secondary-fg'] = theme.components.button.secondaryForeground;
  vars['--button-radius'] = theme.components.button.radius;
  vars['--button-padding'] = theme.components.button.padding;

  // Component themes - Bottom Nav
  vars['--bottom-nav-bg'] = theme.components.bottomNav.background;
  vars['--bottom-nav-border'] = theme.components.bottomNav.borderTop;
  vars['--bottom-nav-active'] = theme.components.bottomNav.activeColor;
  vars['--bottom-nav-inactive'] = theme.components.bottomNav.inactiveColor;
  vars['--bottom-nav-height'] = theme.components.bottomNav.height;
  vars['--camera-btn-size'] = theme.components.bottomNav.cameraButtonSize;

  // Component themes - Camera Button
  vars['--camera-btn-bg'] = theme.components.cameraButton.background;
  vars['--camera-btn-fg'] = theme.components.cameraButton.foreground;
  vars['--camera-btn-shadow'] = theme.components.cameraButton.shadow;
  vars['--camera-btn-border'] = theme.components.cameraButton.border;

  // Component themes - Event Card
  vars['--event-card-bg'] = theme.components.eventCard.background;
  vars['--event-card-border'] = theme.components.eventCard.border;
  vars['--event-card-shadow'] = theme.components.eventCard.shadow;
  vars['--event-card-image-radius'] = theme.components.eventCard.imageRadius;
  vars['--event-card-time-color'] = theme.components.eventCard.timeColor;
  vars['--event-card-accent-width'] = theme.components.eventCard.accentBarWidth;

  // Component themes - Announcement
  vars['--announcement-bg'] = theme.components.announcement.background;
  vars['--announcement-border'] = theme.components.announcement.border;
  vars['--announcement-shadow'] = theme.components.announcement.shadow;
  vars['--announcement-title-color'] = theme.components.announcement.titleColor;
  vars['--announcement-unread'] = theme.components.announcement.unreadIndicator;

  // Component themes - Photo Grid
  vars['--photo-grid-gap'] = theme.components.photoGrid.gap;
  vars['--photo-grid-columns'] = theme.components.photoGrid.columns.toString();
  vars['--photo-grid-item-radius'] = theme.components.photoGrid.itemRadius;
  vars['--photo-grid-overlay'] = theme.components.photoGrid.overlayBackground;

  // Component themes - Chat
  vars['--chat-bg'] = theme.components.chat.background;
  vars['--chat-bubble-bg'] = theme.components.chat.bubbleBackground;
  vars['--chat-bubble-fg'] = theme.components.chat.bubbleForeground;
  vars['--chat-own-bubble-bg'] = theme.components.chat.ownBubbleBackground;
  vars['--chat-own-bubble-fg'] = theme.components.chat.ownBubbleForeground;
  vars['--chat-broadcast-bg'] = theme.components.chat.broadcastBackground;
  vars['--chat-broadcast-fg'] = theme.components.chat.broadcastForeground;
  vars['--chat-input-bg'] = theme.components.chat.inputBackground;
  vars['--chat-border'] = theme.components.chat.border;

  // Component themes - Seating
  vars['--seating-table-bg'] = theme.components.seating.tableBackground;
  vars['--seating-table-border'] = theme.components.seating.tableBorder;
  vars['--seating-table-shadow'] = theme.components.seating.tableShadow;
  vars['--seating-seat-bg'] = theme.components.seating.seatBackground;
  vars['--seating-seat-fg'] = theme.components.seating.seatForeground;
  vars['--seating-current-highlight'] = theme.components.seating.currentGuestHighlight;

  // Component themes - Challenge
  vars['--challenge-bg'] = theme.components.challenge.background;
  vars['--challenge-border'] = theme.components.challenge.border;
  vars['--challenge-shadow'] = theme.components.challenge.shadow;
  vars['--challenge-completed-bg'] = theme.components.challenge.completedBackground;
  vars['--challenge-completed-fg'] = theme.components.challenge.completedForeground;
  vars['--challenge-points-color'] = theme.components.challenge.pointsColor;

  // Background patterns
  const patternOpacity = theme.backgroundPatternOpacity ?? 0.04;
  const primaryColor = theme.colors.primary;
  const secondaryColor = theme.colors.secondary;

  vars['--pattern-dots'] = `radial-gradient(${primaryColor}${Math.round(patternOpacity * 255).toString(16).padStart(2, '0')} 1px, transparent 1px)`;
  vars['--pattern-lines'] = `repeating-linear-gradient(45deg, ${primaryColor}${Math.round(patternOpacity * 255).toString(16).padStart(2, '0')}, ${primaryColor}${Math.round(patternOpacity * 255).toString(16).padStart(2, '0')} 1px, transparent 1px, transparent 20px)`;
  vars['--pattern-waves'] = `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 30 Q15 20 30 30 T60 30' stroke='${primaryColor.replace('#', '%23')}${Math.round(patternOpacity * 255).toString(16).padStart(2, '0')}' stroke-width='1' fill='none'/%3E%3C/svg%3E")`;
  vars['--pattern-floral'] = `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M40 10 Q30 20 40 30 Q50 20 40 10' stroke='${primaryColor.replace('#', '%23')}${Math.round(patternOpacity * 255).toString(16).padStart(2, '0')}' stroke-width='1' fill='none'/%3E%3C/svg%3E")`;
  vars['--pattern-geometric'] = `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0 L40 40 M40 0 L0 40' stroke='${primaryColor.replace('#', '%23')}${Math.round(patternOpacity * 255).toString(16).padStart(2, '0')}' stroke-width='0.5'/%3E%3C/svg%3E")`;

  // Hero style
  vars['--hero-style'] = theme.heroStyle;

  return vars;
}

export function applyThemeToDocument(theme: WeddingTheme): void {
  if (typeof document === 'undefined') return;

  const vars = themeToCSSVariables(theme);
  const root = document.documentElement;

  Object.entries(vars).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });

  // Set background pattern on body
  if (theme.backgroundPattern && theme.backgroundPattern !== 'none') {
    root.style.setProperty('--background-pattern', `var(--pattern-${theme.backgroundPattern})`);
  } else {
    root.style.setProperty('--background-pattern', 'none');
  }
}

export function createThemeStyleElement(theme: WeddingTheme, id = 'wedding-theme'): HTMLStyleElement | null {
  if (typeof document === 'undefined') {
    return null;
  }

  const vars = themeToCSSVariables(theme);
  let css = `:root {`;

  Object.entries(vars).forEach(([key, value]) => {
    css += `\n  ${key}: ${value};`;
  });

  css += `\n}`;

  // Background pattern
  if (theme.backgroundPattern && theme.backgroundPattern !== 'none') {
    css += `
body {
  background-image: var(--pattern-${theme.backgroundPattern});
  background-size: 60px 60px;
}`;
  }

  const style = document.createElement('style');
  style.id = id;
  style.textContent = css;

  return style;
}