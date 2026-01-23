---
id: TASK-004
title: Integrate MediaPipe hand tracking with 21 landmarks
status: Done
assignee:
  - '@copilot'
created_date: '2026-01-23 07:49'
updated_date: '2026-01-23 15:41'
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
- [x] #1 MediaPipe Hands SDK installed and configured
- [x] #2 Detects up to 2 hands simultaneously
- [x] #3 All 21 landmarks per hand are tracked
- [x] #4 Landmark data exposed via React context or hook
- [x] #5 Graceful handling when no hands detected
- [x] #6 Real-time performance at 60 FPS
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Install @mediapipe/tasks-vision package
2. Create HandTracker class with WebAssembly/GPU delegate
3. Build useHandTracking hook exposing landmarks
4. Create HandTrackingProvider context for app-wide access
5. Configure for 60 FPS with VIDEO running mode
6. Handle no-detection state gracefully
7. Test performance and verify 60 FPS
<!-- SECTION:PLAN:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Integrated MediaPipe hand tracking with 60 FPS performance using @mediapipe/tasks-vision.

Changes:
- Added @mediapipe/tasks-vision package
- Created src/lib/types.ts with Landmark types and HAND_CONNECTIONS
- Created HandTrackingProvider with GPU delegate for 60 FPS
- useHandTracking hook exposes result, isLoading, error states
- requestAnimationFrame loop for smooth detection
- CameraPreview now triggers tracking on video load
- Status indicator shows detection state in top-right

Key technical decisions:
- GPU delegate for WebGL acceleration
- VIDEO running mode for streaming frames
- Handedness flipped to match mirrored video
- Graceful no-detection state with user prompt
<!-- SECTION:FINAL_SUMMARY:END -->
