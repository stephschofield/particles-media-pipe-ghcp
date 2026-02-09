'use client';

/**
 * ModeToggle - Attract/Repel physics mode toggle buttons
 * Positioned top-left with glassmorphism styling
 */

import { useCallback } from 'react';

export type PhysicsModeType = 'attract' | 'repel';

export interface ModeToggleProps {
  /** Current physics mode */
  mode: PhysicsModeType;
  /** Callback when mode changes */
  onModeChange: (mode: PhysicsModeType) => void;
}

/**
 * Mode toggle buttons for switching between Attract and Repel physics modes
 * Uses glassmorphism styling with teal accent for active Attract mode
 * and orange accent for active Repel mode
 */
export function ModeToggle({ mode, onModeChange }: ModeToggleProps) {
  const handleAttractClick = useCallback(() => {
    onModeChange('attract');
  }, [onModeChange]);

  const handleRepelClick = useCallback(() => {
    onModeChange('repel');
  }, [onModeChange]);

  const isAttract = mode === 'attract';
  const isRepel = mode === 'repel';

  return (
    <div
      className="absolute left-4 top-4 z-[100] flex flex-col gap-2"
      role="group"
      aria-label="Particle physics mode selection"
    >
      {/* Attract Mode Button */}
      <button
        type="button"
        onClick={handleAttractClick}
        aria-pressed={isAttract}
        aria-label={`Attract mode${isAttract ? ', currently active' : ''}`}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all duration-150 ease-out"
        style={{
          width: 140,
          height: 40,
          borderRadius: 20,
          background: isAttract
            ? 'rgba(20, 184, 166, 0.15)'
            : 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: isAttract
            ? '1px solid rgba(20, 184, 166, 0.4)'
            : '1px solid rgba(255, 255, 255, 0.1)',
          color: isAttract ? '#14B8A6' : 'rgba(255, 255, 255, 0.7)',
          boxShadow: isAttract
            ? '0 0 20px rgba(20, 184, 166, 0.2)'
            : 'none',
        }}
      >
        <span
          className="text-lg"
          aria-hidden="true"
          style={{
            filter: isAttract ? 'drop-shadow(0 0 4px rgba(20, 184, 166, 0.5))' : 'none',
          }}
        >
          ◉
        </span>
        <span>Attract</span>
      </button>

      {/* Repel Mode Button */}
      <button
        type="button"
        onClick={handleRepelClick}
        aria-pressed={isRepel}
        aria-label={`Repel mode${isRepel ? ', currently active' : ''}`}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all duration-150 ease-out"
        style={{
          width: 140,
          height: 40,
          borderRadius: 20,
          background: isRepel
            ? 'rgba(249, 115, 22, 0.15)'
            : 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: isRepel
            ? '1px solid rgba(249, 115, 22, 0.4)'
            : '1px solid rgba(255, 255, 255, 0.1)',
          color: isRepel ? '#F97316' : 'rgba(255, 255, 255, 0.7)',
          boxShadow: isRepel
            ? '0 0 20px rgba(249, 115, 22, 0.2)'
            : 'none',
        }}
      >
        <span
          className="text-lg"
          aria-hidden="true"
          style={{
            filter: isRepel ? 'drop-shadow(0 0 4px rgba(249, 115, 22, 0.5))' : 'none',
          }}
        >
          ○
        </span>
        <span>Repel</span>
      </button>
    </div>
  );
}
