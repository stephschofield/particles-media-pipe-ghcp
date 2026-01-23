---
id: TASK-004
title: Integrate MediaPipe hand tracking with 21 landmarks
status: In Progress
assignee:
  - '@copilot'
created_date: '2026-01-23 07:49'
updated_date: '2026-01-23 15:30'
labels:
  - mediapipe
  - tracking
dependencies:
  - TASK-001
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Set up MediaPipe Hands solution to detect up to 2 hands with all 21 landmarks per hand. Expose landmark data for use by both the skeleton overlay and particle system.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 MediaPipe Hands SDK installed and configured
- [ ] #2 Detects up to 2 hands simultaneously
- [ ] #3 All 21 landmarks per hand are tracked
- [ ] #4 Landmark data exposed via React context or hook
- [ ] #5 Graceful handling when no hands detected
- [ ] #6 Real-time performance at 60 FPS
<!-- AC:END -->
