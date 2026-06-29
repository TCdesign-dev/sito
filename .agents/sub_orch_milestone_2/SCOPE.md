# Scope: Milestone 2: Fluid Touch Interactions (Swipe and Tap)

## Architecture
- Touch inputs are captured on the canvas (`#webgl-canvas`) or the wrapper container.
- OrbitControls handles rotation/pan/zoom on mouse/touch.
- When touch interaction occurs, we need to differentiate swipe (camera movement) from tap (planet/moon selection).
- A threshold (time-based and/or distance-based) should be used: if touch moves less than a small distance threshold and is released within a short time threshold, it is a tap. Otherwise, it is a swipe/drag.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Explore touch interactions | Investigate how OrbitControls, touch start/end, pointer/touch events, and raycasting are implemented | None | DONE |
| 2 | Implementation | Implement distance/time threshold differentiation between swiping and tapping, preventing false-positive clicks/zooms | M1 | IN_PROGRESS |
| 3 | Verification | Review changes using Reviewers, run Playwright E2E tests using Challengers | M2 | PLANNED |
| 4 | Audit | Run Forensic Auditor to ensure clean implementation with zero hardcoding | M3 | PLANNED |
