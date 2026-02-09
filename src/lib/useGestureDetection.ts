/**
 * useGestureDetection Hook
 * React hook for detecting fist gestures and triggering theme cycling
 */

'use client';

import { useRef, useEffect, useSyncExternalStore } from 'react';
import type { TrackingResult } from './types';
import {
  processFistGesture,
  INITIAL_FIST_STATE,
  type FistGestureState,
  type FistDetectionConfig,
} from './gestures';
import { cycleTheme, type ColorTheme } from '@/core/themes';

/**
 * Configuration for the gesture detection hook
 */
export interface UseGestureDetectionConfig {
  /** Cooldown period between theme cycles (ms) */
  cooldownMs: number;
  /** Duration of visual feedback (ms) */
  feedbackDurationMs: number;
  /** Fist detection configuration */
  fistConfig?: FistDetectionConfig;
  /** Callback when theme changes */
  onThemeChange?: (theme: ColorTheme) => void;
  /** Enable/disable gesture detection */
  enabled?: boolean;
}

const DEFAULT_CONFIG: UseGestureDetectionConfig = {
  cooldownMs: 500,
  feedbackDurationMs: 400,
  enabled: true,
};

/**
 * Return type for useGestureDetection hook
 */
export interface GestureDetectionState {
  /** Is a fist currently detected */
  isFistDetected: boolean;
  /** Visual feedback active (brief flash on theme change) */
  showFeedback: boolean;
  /** Current theme after changes */
  currentTheme: ColorTheme | null;
  /** Whether detection is in cooldown */
  inCooldown: boolean;
}

// Store for fist detection state - allows external subscription
let fistDetectionStore = {
  isFist: false,
  showFeedback: false,
  inCooldown: false,
  lastTheme: null as ColorTheme | null,
  listeners: new Set<() => void>(),
};

function getSnapshot() {
  return fistDetectionStore;
}

function subscribe(callback: () => void) {
  fistDetectionStore.listeners.add(callback);
  return () => fistDetectionStore.listeners.delete(callback);
}

function updateStore(updates: Partial<typeof fistDetectionStore>) {
  fistDetectionStore = { ...fistDetectionStore, ...updates };
  fistDetectionStore.listeners.forEach((l) => l());
}

/**
 * Hook for detecting fist gestures and cycling themes
 * 
 * @param trackingResult - Current hand tracking result
 * @param config - Configuration options
 * @returns Gesture detection state
 */
export function useGestureDetection(
  trackingResult: TrackingResult | null,
  config: Partial<UseGestureDetectionConfig> = {}
): GestureDetectionState {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const { cooldownMs, feedbackDurationMs, fistConfig, onThemeChange, enabled } = mergedConfig;

  // Subscribe to external store for fist detection state
  const store = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  // Refs for tracking gesture state machine
  const fistStateRef = useRef<FistGestureState>(INITIAL_FIST_STATE);
  const lastCycleTimeRef = useRef(0);
  const feedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cooldownTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onThemeChangeRef = useRef(onThemeChange);
  
  // Keep callback ref updated
  useEffect(() => {
    onThemeChangeRef.current = onThemeChange;
  }, [onThemeChange]);

  // Clear timeouts on unmount
  useEffect(() => {
    return () => {
      if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
      if (cooldownTimeoutRef.current) clearTimeout(cooldownTimeoutRef.current);
    };
  }, []);

  // Process tracking result for gestures
  useEffect(() => {
    // No hands - reset fist state
    if (!enabled || !trackingResult || trackingResult.hands.length === 0) {
      if (fistStateRef.current.isFist) {
        fistStateRef.current = INITIAL_FIST_STATE;
        updateStore({ isFist: false });
      }
      return;
    }

    const now = performance.now();
    
    // Process fist gesture
    const { state, released } = processFistGesture(
      trackingResult.hands,
      fistStateRef.current,
      now,
      fistConfig
    );
    
    // Update ref and store if fist state changed
    const prevFist = fistStateRef.current.isFist;
    fistStateRef.current = state;
    
    if (state.isFist !== prevFist) {
      updateStore({ isFist: state.isFist });
    }

    // Handle fist release - cycle theme
    if (released && !store.inCooldown) {
      // Check cooldown
      const timeSinceLastCycle = now - lastCycleTimeRef.current;
      if (timeSinceLastCycle < cooldownMs) {
        return;
      }

      // Cycle theme
      const newTheme = cycleTheme();
      lastCycleTimeRef.current = now;
      
      // Trigger callback
      onThemeChangeRef.current?.(newTheme);

      // Update store with new state
      updateStore({
        showFeedback: true,
        inCooldown: true,
        lastTheme: newTheme,
      });

      // Clear previous timeouts
      if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
      if (cooldownTimeoutRef.current) clearTimeout(cooldownTimeoutRef.current);

      // Hide feedback after duration
      feedbackTimeoutRef.current = setTimeout(() => {
        updateStore({ showFeedback: false });
      }, feedbackDurationMs);

      // Reset cooldown after period
      cooldownTimeoutRef.current = setTimeout(() => {
        updateStore({ inCooldown: false });
      }, cooldownMs);
    }
  }, [trackingResult, enabled, cooldownMs, feedbackDurationMs, fistConfig, store.inCooldown]);

  return {
    isFistDetected: store.isFist,
    showFeedback: store.showFeedback,
    currentTheme: store.lastTheme,
    inCooldown: store.inCooldown,
  };
}
