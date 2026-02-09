---
id: TASK-016
title: Build mode toggle buttons in top left
status: In Progress
assignee:
  - '@copilot'
created_date: '2026-01-23 07:51'
updated_date: '2026-02-09 07:12'
labels:
  - ui
  - controls
dependencies:
  - TASK-001
  - TASK-015
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Create Attract Mode toggle button in top left with glassmorphism styling. Button shows current mode with teal accent (#14B8A6) when active. Below it, add Hide Camera toggle button. Both buttons have subtle glass effect with blur backdrop.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Toggle buttons positioned in top left
- [ ] #2 Clear visual distinction between Attract and Repel
- [ ] #3 Active mode highlighted with accent color
- [ ] #4 Hover and click states for buttons
- [ ] #5 Buttons don't obstruct main content
- [ ] #6 Accessible with proper ARIA labels
- [ ] #7 Attract Mode button positioned top left
- [ ] #8 Glassmorphism style: rgba(255,255,255,0.05) bg, blur(10px)
- [ ] #9 Teal accent (#14B8A6) for active state
- [ ] #10 Hide Camera button below Attract Mode
- [ ] #11 Icon + text labels (magnet icon for attract)
- [ ] #12 Hover and click states with smooth transitions
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Create ModeToggle.tsx client component with Attract/Repel buttons
2. Apply glassmorphism styling per UX spec (blur, semi-transparent bg)
3. Use teal (#14B8A6) for Attract active state, orange (#F97316) for Repel
4. Add ARIA labels for accessibility (aria-pressed, aria-label, role=group)
5. Export from components barrel
6. Integrate into page.tsx CanvasView with state management
7. Connect to ParticleCanvas physicsMode prop
<!-- SECTION:PLAN:END -->
