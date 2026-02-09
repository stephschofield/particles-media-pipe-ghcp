---
id: TASK-021
title: Implement depth-based particle scaling
status: Done
assignee:
  - '@copilot'
created_date: '2026-01-23 08:04'
updated_date: '2026-02-09 07:25'
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
- [x] #1 Z-value extracted from each landmark
- [x] #2 Exponential scaling: 0.5x (far) to 1.8x (close)
- [x] #3 Scaling affects particle cluster size, not individual particle size
- [x] #4 Smooth interpolation prevents jarring size changes
- [x] #5 Different scaling for hands vs face (face less sensitive)
- [x] #6 Feels natural like real perspective
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Create DepthScaling.ts module with exponential scaling formula from UX spec
2. Update HandDistribution.ts - replace linear depth scaling with exponential (0.5x-1.8x)
3. Update FaceDistribution.ts - add depth-based spread scaling with reduced sensitivity
4. Alpha adjustment for depth perception (farther = slightly more transparent)
5. Verify TypeScript compiles with no errors
6. Test builds successfully
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Created DepthScaling.ts module with exponential scaling formula.
Updated HandDistribution.ts to use HAND_DEPTH_SCALING (0.5x-1.8x range).
Updated FaceDistribution.ts with FACE_DEPTH_SCALING (0.7x-1.4x reduced sensitivity).
Integrated depth-adjusted alpha calculation for farther = more transparent.
TypeScript compiles clean, build succeeds.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Implemented depth-based particle scaling using MediaPipe z-coordinates for natural perspective effect.

Changes:
- Created `src/core/particles/DepthScaling.ts` with exponential scaling formula per UX spec
- Hand particles scale 0.5x (far) to 1.8x (close) using `calculateDepthScale()`
- Face particles use reduced sensitivity: 0.7x (far) to 1.4x (close)
- Depth-adjusted alpha: farther particles slightly more transparent
- Smooth exponential curve prevents jarring size changes

Files modified:
- src/core/particles/DepthScaling.ts (new)
- src/core/particles/HandDistribution.ts
- src/core/particles/FaceDistribution.ts

Testing:
- TypeScript compiles with zero errors
- Next.js production build succeeds
<!-- SECTION:FINAL_SUMMARY:END -->
