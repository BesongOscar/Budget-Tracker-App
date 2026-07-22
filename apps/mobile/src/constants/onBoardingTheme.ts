/**
 * theme.ts
 * Centralized design tokens. Airbnb-inspired palette (Rausch red primary,
 * neutral grays, generous radius). Any screen that needs brand colors,
 * spacing, or radius should import from here — never hardcode hex values
 * or magic numbers directly in component styles.
 */

export const colors = {
  primary: '#FF385C',      // Airbnb "Rausch" red — active states, CTAs
  primaryPressed: '#E31C5F',
  textPrimary: '#222222',
  textSecondary: '#717171',
  track: '#DDDDDD',        // inactive progress segment
  background: '#FFFFFF',
  white: '#FFFFFF',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 40,
};

export const radius = {
  sm: 4,
  md: 8,
  lg: 14,
  pill: 999,
};

export const typography = {
  title: {
    fontSize: 26,
    fontWeight: '700' as const,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 23,
  },
  button: {
    fontSize: 17,
    fontWeight: '600' as const,
  },
  link: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
};

// Progress segment geometry — used by the onboarding pagination component.
export const progressSegment = {
  trackWidth: 32,
  trackHeight: 4,
  gap: 4,
};