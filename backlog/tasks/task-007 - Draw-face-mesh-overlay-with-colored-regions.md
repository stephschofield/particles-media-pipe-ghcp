---
id: TASK-007
title: Draw face mesh overlay with colored regions
status: In Progress
assignee:
  - '@copilot'
created_date: '2026-01-23 07:49'
updated_date: '2026-02-09 05:47'
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
- [x] #1 Eye regions outlined in teal color
- [x] #2 Lip regions outlined in pink color
- [x] #3 Face oval contour drawn in cyan
- [x] #4 Mesh lines connect appropriate landmark pairs
- [x] #5 Overlay properly scales to 256x144 preview
- [x] #6 Depth-enhanced rendering for nose, cheeks, eye sockets
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

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
- Reviewed existing FaceMesh.tsx which already had most functionality implemented
- Enhanced depth-enhanced rendering to include eye sockets (landmarks 130, 226, 359, 446, 133, 362)
- Added nose bridge points (6, 168) for better depth representation
- Organized depth points by region with appropriate colors (teal for eye sockets, cyan for nose/cheeks)
- Verified build succeeds without errors
<!-- SECTION:NOTES:END -->
