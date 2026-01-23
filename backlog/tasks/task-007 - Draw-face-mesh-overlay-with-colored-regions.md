---
id: TASK-007
title: Draw face mesh overlay with colored regions
status: In Progress
assignee:
  - '@copilot'
created_date: '2026-01-23 07:49'
updated_date: '2026-01-23 16:16'
labels:
  - visualization
  - canvas
dependencies:
  - TASK-003
  - TASK-006
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Render a mesh overlay on the camera preview showing face landmarks with colored outlines for different facial regions: teal for eyes, pink for lips, and cyan for face oval contour.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Eye regions outlined in teal color
- [ ] #2 Lip regions outlined in pink color
- [ ] #3 Face oval contour drawn in cyan
- [ ] #4 Mesh lines connect appropriate landmark pairs
- [ ] #5 Overlay properly scales to 256x144 preview
- [ ] #6 Depth-enhanced rendering for nose, cheeks, eye sockets
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Define face mesh connections for eyes, lips, face oval in types.ts
2. Create FaceMesh component with canvas overlay
3. Draw teal eye outlines
4. Draw pink lip outlines
5. Draw cyan face contour
6. Add depth-based scaling for nose/cheeks/eye sockets
7. Integrate into CameraPreview
<!-- SECTION:PLAN:END -->
