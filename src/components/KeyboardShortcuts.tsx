'use client';

/**
 * KeyboardShortcuts - Displays available keyboard shortcuts
 * Positioned bottom-right with glassmorphism styling
 */

import { useState, useCallback } from 'react';

export interface KeyboardShortcutsProps {
  /** Whether to show the panel */
  visible?: boolean;
}

interface ShortcutItem {
  key: string;
  description: string;
}

const SHORTCUTS: ShortcutItem[] = [
  { key: 'SPACE', description: 'Toggle mode' },
  { key: 'V', description: 'Cycle theme' },
];

/**
 * Keyboard shortcuts panel showing available controls
 * Uses glassmorphism styling matching ModeToggle
 */
export function KeyboardShortcuts({ visible = true }: KeyboardShortcutsProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  const handleDismiss = useCallback(() => {
    setIsDismissed(true);
  }, []);

  if (!visible || isDismissed) {
    return null;
  }

  return (
    <div
      className="absolute bottom-4 right-4 z-[100]"
      role="region"
      aria-label="Keyboard shortcuts"
    >
      <div
        className="relative px-3 py-2"
        style={{
          borderRadius: 12,
          background: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
        }}
      >
        {/* Dismiss button */}
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full transition-colors hover:bg-white/10"
          style={{
            background: 'rgba(0, 0, 0, 0.6)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
          aria-label="Dismiss keyboard shortcuts panel"
        >
          <span className="text-xs text-white/60" aria-hidden="true">×</span>
        </button>

        {/* Shortcuts list */}
        <div className="flex flex-col gap-1">
          {SHORTCUTS.map((shortcut) => (
            <div
              key={shortcut.key}
              className="flex items-center gap-2 text-xs"
            >
              <kbd
                className="rounded px-1.5 py-0.5 font-mono text-[10px] font-medium"
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: 'rgba(255, 255, 255, 0.8)',
                }}
              >
                {shortcut.key}
              </kbd>
              <span className="text-white/50">{shortcut.description}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
