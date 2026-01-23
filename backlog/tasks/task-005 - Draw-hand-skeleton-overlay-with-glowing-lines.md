---
id: TASK-005
title: Draw hand skeleton overlay with glowing lines
status: To Do
assignee: []
created_date: '2026-01-23 07:49'
labels:
  - visualization
  - canvas
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Render a skeleton overlay on the camera preview showing hand bones. Use cyan for one hand and pink for the other, with glowing line effects between joints. Draw larger dots at fingertips and wrist positions.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Skeleton lines connect correct joint pairs
- [ ] #2 Cyan glow for left hand, pink glow for right hand
- [ ] #3 Larger dots rendered at 5 fingertips per hand
- [ ] #4 Larger dot at wrist landmark
- [ ] #5 Lines have glow effect using canvas shadow or blur
- [ ] #6 Overlay properly scales to 256x144 preview
<!-- AC:END -->
