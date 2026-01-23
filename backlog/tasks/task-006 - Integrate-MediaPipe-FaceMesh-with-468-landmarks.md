---
id: TASK-006
title: Integrate MediaPipe FaceMesh with 468 landmarks
status: In Progress
assignee:
  - '@copilot'
created_date: '2026-01-23 07:49'
updated_date: '2026-01-23 16:01'
labels:
  - mediapipe
  - tracking
dependencies:
  - TASK-001
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Set up MediaPipe FaceMesh solution with all 468 face landmarks and refined features enabled. Expose landmark data including depth information for nose, cheekbones, and eye sockets.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 MediaPipe FaceMesh SDK installed and configured
- [ ] #2 All 468 face landmarks tracked
- [ ] #3 Refined landmarks enabled for eyes and lips
- [ ] #4 Depth data available for facial features
- [ ] #5 Landmark data exposed via React context or hook
- [ ] #6 Real-time performance maintained with hand tracking
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Add FaceLandmarks types to types.ts
2. Update HandTrackingProvider to include FaceLandmarker
3. Run face detection in parallel with hand detection
4. Configure with refineLandmarks for eyes/lips
5. Update status indicator to show face detection
6. Verify 60 FPS with both hand + face tracking
<!-- SECTION:PLAN:END -->
