---
id: TASK-011
title: Implement face particle distribution with tight clustering
status: Done
assignee:
  - '@copilot'
created_date: '2026-01-23 07:50'
updated_date: '2026-02-09 06:05'
labels:
  - particles
  - face
dependencies:
  - TASK-009
  - TASK-006
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Configure particle distribution for face with very tight 1-2px clustering for dense mesh effect. Face uses pink/magenta palette (#EC4899). Boost depth on nose (forward), cheekbones (forward), and eye sockets (recessed). 4,000-6,000 particles for recognizable facial structure.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Face particles clustered at 1-2px spread
- [x] #2 Nose particles pushed forward with depth boost
- [x] #3 Cheekbone particles show prominence
- [x] #4 Eye socket particles recessed for depth
- [x] #5 Dense mesh effect creates recognizable face shape
- [x] #6 468 landmarks properly weighted for distribution
- [x] #7 Face colored pink/magenta (#EC4899)
- [x] #8 Ultra-tight 1-2px clustering across all 468 landmarks
- [x] #9 Nose landmarks pushed forward with depth boost
- [x] #10 Cheekbone landmarks show prominence
- [x] #11 Eye socket landmarks recessed for depth
- [x] #12 4,000-6,000 particles for dense face mesh
- [x] #13 Creates recognizable facial features (eyes, nose, lips visible)
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Create FaceDistribution.ts with face landmark categories (nose, cheekbones, eyes, lips, contour)
2. Implement depth boost for nose (+Z), cheekbones (+Z slight), eye sockets (-Z recessed)
3. Configure 1-2px tight clustering for all landmarks
4. Allocate ~12 particles per landmark (468 × 12 ≈ 5,616 total)
5. Export from particles/index.ts
6. Integrate with ParticlePool.updateFaceTargets to use new distribution
7. Verify TypeScript compiles cleanly
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
- Created FaceDistribution.ts with zone-specific categories: Nose, Cheekbone, EyeSocket, Lips, Contour, General
- Implemented depth boost system: nose 1.3x forward, cheekbones 1.15x forward, eye sockets 0.85x recessed
- Configured ultra-tight 1-2px clustering across all 468 landmarks
- Zone-specific particle counts: 14/landmark for nose, 12 for most zones, 11 for contour
- Total face particles: 5,664 (within 4,000-6,000 spec)
- Integrated with ParticlePool.updateFaceTargets() using new calculateFaceParticleSpread()
- Exported all functions from particles/index.ts
- TypeScript compiles cleanly
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Implemented face particle distribution with tight clustering for dense mesh effect.

Changes:
- Added src/core/particles/FaceDistribution.ts with zone-specific distribution:
  - 6 facial regions: Nose, Cheekbone, EyeSocket, Lips, Contour, General
  - Ultra-tight 1-2px clustering across all 468 landmarks
  - Depth boost: nose 1.3x forward, cheekbones 1.15x forward, eye sockets 0.85x recessed
  - Zone-specific particle counts (11-14 per landmark → 5,664 total)
- Updated ParticlePool.ts:
  - createBindings() uses getFaceParticlesPerLandmark() for zone-aware allocation
  - updateFaceTargets() uses calculateFaceParticleSpread() with depth boost
  - Face color set to pink/magenta #EC4899 via FACE_COLOR constant
- Exported all new functions in particles/index.ts

Validation:
- Face particles: 5,664 (spec: 4,000-6,000) ✓
- Hand particles: 990 per hand (spec: 800-1,200) ✓
- TypeScript compiles without errors
<!-- SECTION:FINAL_SUMMARY:END -->
