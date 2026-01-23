---
id: TASK-025
title: Verify camera preview overlay positioning and sizing
status: To Do
assignee: []
created_date: '2026-01-23 15:32'
labels:
  - testing
  - ui
  - ux
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Test that camera preview appears at top center with exact dimensions (256×144px) and displays hand skeleton and face mesh overlays correctly
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Camera preview is positioned at horizontal center of top edge
- [ ] #2 Preview dimensions measure exactly 256×144 pixels
- [ ] #3 Hand skeleton (21 landmarks with connecting lines) renders in green over preview
- [ ] #4 Face mesh (468 landmarks) renders with colored regions over preview
- [ ] #5 Overlays update in real-time synchronized with camera feed
<!-- AC:END -->
