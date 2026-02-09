/**
 * Color Themes for Particle System
 * 5 distinct themes with cycling support
 */

import type { ParticleColors } from './particles/types';

/**
 * Theme names for identification
 */
export type ThemeName = 'rainbow' | 'fire' | 'ocean' | 'galaxy' | 'matrix';

/**
 * Color theme definition
 */
export interface ColorTheme {
  readonly name: ThemeName;
  readonly displayName: string;
  readonly colors: ParticleColors;
}

/**
 * Helper to convert hex color to normalized RGB (0-1 range)
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    return { r: 1, g: 1, b: 1 };
  }
  return {
    r: parseInt(result[1], 16) / 255,
    g: parseInt(result[2], 16) / 255,
    b: parseInt(result[3], 16) / 255,
  };
}

/**
 * Rainbow Theme - Full spectrum colors
 * Left hand: red-orange, Right hand: green-cyan, Face: violet-purple
 */
export const RAINBOW_THEME: ColorTheme = {
  name: 'rainbow',
  displayName: 'Rainbow',
  colors: {
    leftHand: hexToRgb('#EF4444'),   // Red
    rightHand: hexToRgb('#22C55E'),  // Green
    face: hexToRgb('#8B5CF6'),       // Violet
  },
};

/**
 * Fire Theme - Red, orange, yellow gradients
 * Warm, fiery colors across all body parts
 */
export const FIRE_THEME: ColorTheme = {
  name: 'fire',
  displayName: 'Fire',
  colors: {
    leftHand: hexToRgb('#DC2626'),   // Red-600
    rightHand: hexToRgb('#EA580C'),  // Orange-600
    face: hexToRgb('#F59E0B'),       // Amber-500
  },
};

/**
 * Ocean Theme - Blue, teal, white colors
 * Cool, aquatic vibes with depth
 */
export const OCEAN_THEME: ColorTheme = {
  name: 'ocean',
  displayName: 'Ocean',
  colors: {
    leftHand: hexToRgb('#0EA5E9'),   // Sky-500
    rightHand: hexToRgb('#14B8A6'),  // Teal-500
    face: hexToRgb('#7DD3FC'),       // Sky-300 (lighter)
  },
};

/**
 * Galaxy Theme - Purple, pink, starfield effect
 * Cosmic vibes with ethereal colors
 */
export const GALAXY_THEME: ColorTheme = {
  name: 'galaxy',
  displayName: 'Galaxy',
  colors: {
    leftHand: hexToRgb('#A855F7'),   // Purple-500
    rightHand: hexToRgb('#E879F9'),  // Fuchsia-400
    face: hexToRgb('#C084FC'),       // Purple-400
  },
};

/**
 * Matrix Theme - Green digital rain aesthetic
 * Classic green-on-black cyberpunk look
 */
export const MATRIX_THEME: ColorTheme = {
  name: 'matrix',
  displayName: 'Matrix',
  colors: {
    leftHand: hexToRgb('#22C55E'),   // Green-500
    rightHand: hexToRgb('#4ADE80'),  // Green-400
    face: hexToRgb('#86EFAC'),       // Green-300
  },
};

/**
 * All available themes in order
 */
export const THEMES: readonly ColorTheme[] = [
  RAINBOW_THEME,
  FIRE_THEME,
  OCEAN_THEME,
  GALAXY_THEME,
  MATRIX_THEME,
] as const;

/**
 * Theme count for cycling
 */
export const THEME_COUNT = THEMES.length;

/**
 * ThemeManager - Manages theme state and cycling
 * Singleton pattern for global theme access
 */
export class ThemeManager {
  private currentIndex = 0;
  private listeners: Set<(theme: ColorTheme) => void> = new Set();

  /**
   * Get current theme
   */
  getCurrentTheme(): ColorTheme {
    return THEMES[this.currentIndex];
  }

  /**
   * Get current theme index
   */
  getCurrentIndex(): number {
    return this.currentIndex;
  }

  /**
   * Get current theme name
   */
  getCurrentThemeName(): ThemeName {
    return THEMES[this.currentIndex].name;
  }

  /**
   * Cycle to next theme
   * @returns The new current theme
   */
  cycleTheme(): ColorTheme {
    this.currentIndex = (this.currentIndex + 1) % THEME_COUNT;
    const theme = THEMES[this.currentIndex];
    this.notifyListeners(theme);
    return theme;
  }

  /**
   * Set theme by name
   * @returns true if theme was found and set
   */
  setTheme(name: ThemeName): boolean {
    const index = THEMES.findIndex((t) => t.name === name);
    if (index === -1) return false;
    
    this.currentIndex = index;
    this.notifyListeners(THEMES[index]);
    return true;
  }

  /**
   * Set theme by index
   * @returns true if index was valid
   */
  setThemeByIndex(index: number): boolean {
    if (index < 0 || index >= THEME_COUNT) return false;
    
    this.currentIndex = index;
    this.notifyListeners(THEMES[index]);
    return true;
  }

  /**
   * Subscribe to theme changes
   * @returns Unsubscribe function
   */
  subscribe(callback: (theme: ColorTheme) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Notify all listeners of theme change
   */
  private notifyListeners(theme: ColorTheme): void {
    for (const listener of this.listeners) {
      listener(theme);
    }
  }

  /**
   * Reset to first theme
   */
  reset(): void {
    this.currentIndex = 0;
    this.notifyListeners(THEMES[0]);
  }
}

/**
 * Global theme manager instance
 */
export const themeManager = new ThemeManager();

/**
 * Convenience function to get current theme
 */
export function getCurrentTheme(): ColorTheme {
  return themeManager.getCurrentTheme();
}

/**
 * Convenience function to cycle theme
 */
export function cycleTheme(): ColorTheme {
  return themeManager.cycleTheme();
}

/**
 * Get theme by name
 */
export function getThemeByName(name: ThemeName): ColorTheme | undefined {
  return THEMES.find((t) => t.name === name);
}
