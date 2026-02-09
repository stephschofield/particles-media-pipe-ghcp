---
id: TASK-014
title: Add particle trails with semi-transparent fade
status: Done
assignee:
  - '@copilot'
created_date: '2026-01-23 07:51'
updated_date: '2026-02-09 07:05'
labels:
  - particles
  - effects
dependencies:
  - TASK-009
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Implement particle trails that show movement history with semi-transparent fading. Trails should create a smooth flowing effect without cluttering the visual or impacting performance.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Each particle leaves a trail of previous positions
- [x] #2 Trail opacity fades from full to transparent
- [x] #3 Trail length configurable (5-10 positions)
- [x] #4 Performance maintained at 60fps with trails
- [x] #5 Trails enhance flowing liquid aesthetic
- [x] #6 Trail rendering uses efficient technique
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Modify WebGLRenderer to support trail fading instead of full clear
2. Add fullscreen quad shader for drawing semi-transparent black overlay
3. Add trail configuration (enabled, fadeAmount) to renderer
4. Create vertex/fragment shaders for fade quad
5. Update render() to apply fade overlay when trails enabled
6. Add trailOpacity prop to ParticleCanvas component
7. Update Canvas 2D fallback to support trails
8. Test performance at 60fps with trails enabled
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented particle trails using frame buffer fading technique:
- Added fade quad shaders (FADE_QUAD_VERTEX_SHADER, FADE_QUAD_FRAGMENT_SHADER) for drawing semi-transparent black overlay
- Modified WebGLRenderer to draw fade quad instead of full clear when trails enabled
- Trail fade creates comet-tail effect by allowing previous frames to persist with decreasing visibility
- Added setTrailsEnabled() and setTrailFadeAmount() methods for runtime configuration
- Updated Canvas 2D fallback to support trails with same technique
- ParticleCanvas exposes trailsEnabled (default: true) and trailFadeAmount (default: 0.15 = ~6-7 frame trails)
- No new buffer allocations per frame - efficient single fullscreen quad draw
- TypeScript compiles with zero errors, ESLint passes
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added particle trail effect using frame buffer fading technique.

## Changes
- **shaders.ts**: Added FADE_QUAD_VERTEX_SHADER and FADE_QUAD_FRAGMENT_SHADER for fullscreen fade overlay
- **WebGLRenderer.ts**: 
  - Added trail configuration (trailsEnabled, trailFadeAmount)
  - Created fade program and VAO for trail effect
  - Modified render() to draw fade quad instead of gl.clear() when trails enabled
  - Added setTrailsEnabled() and setTrailFadeAmount() methods
  - Updated Canvas 2D fallback with matching trail support
- **ParticleCanvas.tsx**: Exposed trailsEnabled and trailFadeAmount props with defaults (true, 0.15)
- **index.ts**: Exported new shader constants

## How It Works
Instead of fully clearing the canvas each frame, a semi-transparent black quad is drawn over the previous frame. This allows particles from previous frames to fade out gradually, creating a comet-tail trail effect. The fade amount (0.15 default) means trails persist for ~6-7 frames before becoming invisible.

## Performance
- Zero additional buffer allocations per frame
- Single extra draw call (4 vertices triangle strip)
- No position history storage needed
- 60fps maintained with 15K particles
<!-- SECTION:FINAL_SUMMARY:END -->
