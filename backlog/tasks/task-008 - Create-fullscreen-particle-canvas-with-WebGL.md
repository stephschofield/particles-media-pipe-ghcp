---
id: TASK-008
title: Create fullscreen particle canvas with WebGL
status: To Do
assignee: []
created_date: '2026-01-23 07:50'
updated_date: '2026-01-23 07:52'
labels:
  - particles
  - canvas
dependencies:
  - TASK-001
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Build a fullscreen canvas component using WebGL or Canvas 2D for rendering 8,000 to 15,000 particles efficiently. Set up the rendering loop with requestAnimationFrame for smooth 60fps animation.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Fullscreen canvas covers entire viewport
- [ ] #2 Canvas resizes properly on window resize
- [ ] #3 WebGL context initialized with fallback to Canvas 2D
- [ ] #4 Render loop runs at 60fps using requestAnimationFrame
- [ ] #5 Particle buffer can handle 15,000 particles
- [ ] #6 Canvas layered behind camera preview
<!-- AC:END -->
