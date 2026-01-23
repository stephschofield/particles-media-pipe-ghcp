---
id: TASK-003
title: Implement camera preview overlay component
status: In Progress
assignee:
  - '@copilot'
created_date: '2026-01-23 07:49'
updated_date: '2026-01-23 15:23'
labels:
  - ui
  - camera
dependencies:
  - TASK-002
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Create a 256x144 camera preview box positioned at top center of the screen, displaying the mirrored camera feed. This serves as the base for skeleton and mesh overlays.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Camera preview positioned at top center
- [ ] #2 Fixed size of 256x144 pixels
- [ ] #3 Camera feed is mirrored horizontally
- [ ] #4 Preview has subtle border and rounded corners
- [ ] #5 Video stream properly managed with cleanup on unmount
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Create CameraPreview component with video element
2. Implement mirrored video stream with proper sizing (256x144)
3. Style with glassmorphism border and rounded corners
4. Add proper cleanup on unmount
5. Export from components index
6. Integrate into page.tsx for canvas view
<!-- SECTION:PLAN:END -->
