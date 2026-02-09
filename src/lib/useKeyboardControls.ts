'use client';

/**
 * useKeyboardControls - Global keyboard shortcuts for particle system
 * SPACE: Toggle between Attract/Repel physics mode
 * V: Cycle to next color theme
 */

import { useEffect, useCallback } from 'react';
import { cycleTheme } from '@/core/themes';
import type { PhysicsModeType } from '@/components';

export interface UseKeyboardControlsOptions {
  /** Current physics mode */
  physicsMode: PhysicsModeType;
  /** Callback to toggle physics mode */
  onToggleMode: () => void;
  /** Callback when theme cycles (optional, for UI feedback) */
  onThemeCycle?: () => void;
  /** Whether keyboard controls are enabled */
  enabled?: boolean;
}

/**
 * Hook for global keyboard controls
 * 
 * - SPACE: Toggle physics mode (prevents default to avoid scroll)
 * - V: Cycle color theme
 * 
 * Ignores events when focus is in text input fields.
 */
export function useKeyboardControls({
  onToggleMode,
  onThemeCycle,
  enabled = true,
}: UseKeyboardControlsOptions): void {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    // Skip if focus is in an input field
    const target = event.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable
    ) {
      return;
    }

    switch (event.key) {
      case ' ': // SPACE key
        event.preventDefault(); // Prevent page scroll
        onToggleMode();
        break;
      
      case 'v':
      case 'V':
        cycleTheme();
        onThemeCycle?.();
        break;
    }
  }, [enabled, onToggleMode, onThemeCycle]);

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, handleKeyDown]);
}
