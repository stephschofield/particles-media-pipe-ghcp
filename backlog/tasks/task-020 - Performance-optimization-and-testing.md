---
id: TASK-020
title: Performance optimization and testing
status: In Progress
assignee:
  - '@copilot'
created_date: '2026-01-23 07:52'
updated_date: '2026-02-09 07:37'
labels:
  - performance
  - testing
dependencies:
  - TASK-010
  - TASK-011
  - TASK-014
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Optimize the entire system for smooth 60fps performance with 15,000 particles. Profile and optimize bottlenecks in particle physics, rendering, and MediaPipe processing. Test across different devices.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Maintains 60fps with 15,000 particles
- [ ] #2 No frame drops during hand/face detection
- [ ] #3 Memory usage stays stable over time
- [ ] #4 Works on mid-range hardware
- [ ] #5 Profiling identifies no major bottlenecks
- [x] #6 GPU acceleration utilized where possible
- [ ] #7 ≤50ms total pipeline latency (camera to render)
- [ ] #8 60fps sustained with 15K particles
- [ ] #9 Zero stray particles verified via testing
- [ ] #10 Particle position error ≤5px from landmark
- [x] #11 LOD system reduces particles if frame time >14ms
- [x] #12 Web Worker considered but main thread preferred for MediaPipe
- [x] #13 Exponential smoothing (α=0.3) reduces landmark jitter
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Pre-allocate reusable noise object in ParticlePhysics.getOrganicNoise() to avoid per-particle allocation
2. Pre-allocate landmark arrays in LandmarkInterpolator for getHandLandmarks/getFaceLandmarks
3. Create FPS counter and performance utilities in src/core/performance.ts
4. Export performance utilities from particles/index.ts
5. Verify all useEffect cleanup patterns (event listeners, animation frames, timeouts)
6. Verify React component memoization (useCallback usage)
7. Check TypeScript errors
<!-- SECTION:PLAN:END -->
