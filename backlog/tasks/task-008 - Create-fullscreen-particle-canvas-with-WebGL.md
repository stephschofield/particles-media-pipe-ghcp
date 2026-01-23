---
id: TASK-008
title: Create fullscreen particle canvas with WebGL
status: In Progress
assignee:
  - '@copilot'
created_date: '2026-01-23 07:50'
updated_date: '2026-01-23 16:29'
labels:
  - particles
  - canvas
dependencies:
  - TASK-001
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Build a fullscreen WebGL 2 canvas optimized for 15K particle instanced rendering. Set up the render loop with requestAnimationFrame targeting 60fps. Use interleaved Float32Array (7 floats per particle: x,y,z,size,r,g,b) for cache-friendly GPU uploads. Single draw call architecture.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Fullscreen canvas covers entire viewport
- [ ] #2 Canvas resizes properly on window resize
- [ ] #3 WebGL context initialized with fallback to Canvas 2D
- [ ] #4 Render loop runs at 60fps using requestAnimationFrame
- [ ] #5 Particle buffer can handle 15,000 particles
- [ ] #6 Canvas layered behind camera preview
- [ ] #7 WebGL 2 context with instancing extension
- [ ] #8 Interleaved Float32Array buffer (7 floats/particle = 420KB)
- [ ] #9 Single draw call renders all 15K particles
- [ ] #10 Fullscreen canvas with proper resize handling
- [ ] #11 60fps render loop with frame time monitoring
- [ ] #12 Fallback detection for WebGL 2 unavailable
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Create ParticleCanvas component with WebGL 2 context
2. Set up fullscreen canvas with viewport matching
3. Initialize interleaved Float32Array buffer (7 floats × 15K)
4. Create vertex/fragment shaders for instanced rendering
5. Set up requestAnimationFrame render loop at 60 FPS
6. Add window resize handler
7. Implement WebGL 2 fallback detection
8. Integrate into page.tsx behind camera preview
<!-- SECTION:PLAN:END -->
