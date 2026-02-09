---
id: TASK-022
title: Implement detection loss handling and transitions
status: In Progress
assignee:
  - '@copilot'
created_date: '2026-01-23 08:04'
updated_date: '2026-02-09 07:26'
labels:
  - particles
  - transitions
dependencies:
  - TASK-009
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Handle smooth transitions when hands/face detection is lost or regained. Particles fade out over 200ms when detection lost, hold position briefly on momentary occlusion (<300ms), and lerp to new position over 100ms when re-detected. Prevents jarring pop-in/pop-out.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Particles fade out over 200ms when landmark lost
- [ ] #2 Hold last position for <300ms occlusion with 70% opacity
- [ ] #3 Lerp to new position over 100ms on re-detection
- [ ] #4 No jarring snap-back or pop-in effects
- [ ] #5 Smooth particle redistribution when hand count changes
- [ ] #6 Idle state after 500ms+ of no detection
<!-- AC:END -->
