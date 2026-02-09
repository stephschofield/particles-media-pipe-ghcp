'use client';

/**
 * StatusIndicator - Displays detection status in top-right corner
 * Shows what's being tracked (hands, face) with colored indicator
 */

import { useState, useEffect, useRef, useMemo } from 'react';
import type { TrackingResult } from '@/lib/types';

export interface StatusIndicatorProps {
  /** Current tracking result */
  trackingResult: TrackingResult | null;
  /** Whether MediaPipe is loading */
  isLoading: boolean;
  /** Error message if any */
  error: string | null;
}

type DetectionState = 'loading' | 'detecting' | 'partial' | 'none';

/**
 * Status indicator showing real-time detection state
 * - Green dot when detecting hands and/or face
 * - Yellow dot for partial detection (1 hand only)
 * - Gray when nothing detected (after 2s delay)
 */
export function StatusIndicator({
  trackingResult,
  isLoading,
  error,
}: StatusIndicatorProps) {
  const [promptTimerComplete, setPromptTimerComplete] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Compute detection info from tracking result
  const { detectionState, handCount, hasFace, isDetecting } = useMemo(() => {
    if (isLoading) {
      return { detectionState: 'loading' as DetectionState, handCount: 0, hasFace: false, isDetecting: false };
    }
    if (!trackingResult) {
      return { detectionState: 'none' as DetectionState, handCount: 0, hasFace: false, isDetecting: false };
    }
    
    const hands = trackingResult.hands.length;
    const face = trackingResult.face !== null;
    
    if (hands === 0 && !face) {
      return { detectionState: 'none' as DetectionState, handCount: hands, hasFace: face, isDetecting: false };
    }
    if (hands === 1 && !face) {
      return { detectionState: 'partial' as DetectionState, handCount: hands, hasFace: face, isDetecting: true };
    }
    return { detectionState: 'detecting' as DetectionState, handCount: hands, hasFace: face, isDetecting: true };
  }, [isLoading, trackingResult]);

  // Handle 2-second delay for "Show your hands" prompt
  // When not detecting, start timer; when detecting, clear timer and hide prompt
  useEffect(() => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (isDetecting) {
      // Detection active - we don't start the timer
      // The computed showPrompt will be false because isDetecting is true
      return;
    }
    
    // When not detecting, start 2s timer to show prompt
    if (!isLoading && !error) {
      timeoutRef.current = setTimeout(() => {
        setPromptTimerComplete(true);
        timeoutRef.current = null;
      }, 2000);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isDetecting, isLoading, error]);

  // Compute showPrompt from timer state and detection state
  const showPrompt = promptTimerComplete && !isDetecting && !isLoading && !error;

  // Format status text
  const statusText = useMemo((): string => {
    if (isLoading) return 'Loading...';
    if (error) return `Error: ${error}`;
    
    const parts: string[] = [];
    
    if (handCount === 1) parts.push('1 hand');
    else if (handCount === 2) parts.push('2 hands');
    
    if (hasFace) parts.push('face');
    
    if (parts.length === 0) {
      return showPrompt ? 'Show your hands' : '';
    }
    
    return `${parts.join(' + ')} detected`;
  }, [isLoading, error, handCount, hasFace, showPrompt]);

  // Get indicator color based on state
  const indicatorColor = useMemo((): string => {
    switch (detectionState) {
      case 'loading':
        return '#71717A'; // Gray
      case 'detecting':
        return '#22C55E'; // Green
      case 'partial':
        return '#EAB308'; // Yellow
      case 'none':
      default:
        return '#71717A'; // Gray
    }
  }, [detectionState]);

  // Get text color based on state
  const textColor = useMemo((): string => {
    switch (detectionState) {
      case 'detecting':
        return '#22C55E'; // Green
      case 'partial':
        return '#EAB308'; // Yellow
      default:
        return '#71717A'; // Gray
    }
  }, [detectionState]);

  // Don't render if no status to show
  if (!statusText && !isLoading) {
    return null;
  }

  return (
    <div
      className="absolute right-4 top-4 z-[100]"
      role="status"
      aria-live="polite"
      aria-label="Detection status"
    >
      <div
        className="flex items-center gap-2 px-4 py-2 transition-all duration-300"
        style={{
          borderRadius: 20,
          background: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
        }}
      >
        {/* Status indicator dot */}
        <span
          className="transition-colors duration-300"
          style={{
            display: 'inline-block',
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: indicatorColor,
            boxShadow: isDetecting
              ? `0 0 8px ${indicatorColor}`
              : 'none',
          }}
          aria-hidden="true"
        />
        
        {/* Status text */}
        <p
          className="font-mono text-sm transition-colors duration-300"
          style={{ color: textColor }}
        >
          {statusText}
        </p>
      </div>
    </div>
  );
}
