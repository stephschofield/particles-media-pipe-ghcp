---
id: TASK-017
title: Add keyboard shortcuts panel in bottom right
status: In Progress
assignee:
  - '@copilot'
created_date: '2026-01-23 07:51'
updated_date: '2026-02-09 07:14'
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
- [ ] #1 Panel positioned in bottom right corner
- [ ] #2 Shows SPACE = toggle mode shortcut
- [ ] #3 Shows V = toggle camera shortcut
- [ ] #4 Subtle styling that doesn't distract
- [ ] #5 Text readable on any background
- [ ] #6 Panel can be dismissed or hidden
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
