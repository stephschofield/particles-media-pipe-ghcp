---
id: TASK-021
title: Implement depth-based particle scaling
status: In Progress
assignee:
  - '@copilot'
created_date: '2026-01-23 08:04'
updated_date: '2026-02-09 07:22'
labels:
  - particles
  - depth
dependencies:
  - TASK-009
  - TASK-004
  - TASK-006
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Use MediaPipe landmark z-values to scale particle formations based on distance from camera. Closer hands/face should appear larger (up to 1.8x), farther should appear smaller (down to 0.5x). Use exponential scaling curve for natural perspective feel.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Z-value extracted from each landmark
- [ ] #2 Exponential scaling: 0.5x (far) to 1.8x (close)
- [ ] #3 Scaling affects particle cluster size, not individual particle size
- [ ] #4 Smooth interpolation prevents jarring size changes
- [ ] #5 Different scaling for hands vs face (face less sensitive)
- [ ] #6 Feels natural like real perspective
<!-- AC:END -->
