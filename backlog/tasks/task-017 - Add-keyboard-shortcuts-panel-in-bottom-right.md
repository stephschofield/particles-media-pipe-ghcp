---
id: TASK-017
title: Add keyboard shortcuts panel in bottom right
status: In Progress
assignee:
  - '@copilot'
created_date: '2026-01-23 07:51'
updated_date: '2026-02-09 07:15'
labels:
  - ui
  - help
dependencies:
  - TASK-001
priority: low
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Display a keyboard shortcuts panel in the bottom right corner showing available controls: SPACE for mode toggle and V for camera toggle. Panel should be subtle but readable.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Panel positioned in bottom right corner
- [x] #2 Shows SPACE = toggle mode shortcut
- [x] #3 Shows V = toggle camera shortcut
- [x] #4 Subtle styling that doesn't distract
- [x] #5 Text readable on any background
- [x] #6 Panel can be dismissed or hidden
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Create KeyboardShortcuts.tsx component with glassmorphism styling
2. Position bottom-right with absolute positioning
3. Show SPACE and V shortcuts with subtle styling
4. Add dismiss functionality (X button or click)
5. Export from components index
6. Add to CanvasView in page.tsx
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Created KeyboardShortcuts.tsx with glassmorphism styling matching ModeToggle.
Positioned bottom-right using absolute positioning.
Shows SPACE for toggle mode, V for cycle theme.
Includes dismiss X button to hide panel.
Exported from components index and added to CanvasView.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added keyboard shortcuts panel in bottom-right corner of canvas view.

Changes:
- Created src/components/KeyboardShortcuts.tsx with glassmorphism styling
- Shows SPACE (toggle mode) and V (cycle theme) shortcuts
- Panel is dismissible via X button
- Subtle styling with backdrop blur and semi-transparent background
- Exported from components/index.ts
- Integrated into page.tsx CanvasView

Styling matches existing UI elements (ModeToggle, FPS indicator).
Zero TypeScript errors.
<!-- SECTION:FINAL_SUMMARY:END -->
