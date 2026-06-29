# E2E Test Suite Status: READY

This project is now equipped with a comprehensive Playwright-based E2E test suite running on a local Python web server (`http.server` on port 8000).

## Feature Coverage Checklist

- [x] **Feature 1: Intro Sequence & Liveness**
  - Verify intro screen overlay is mounted on initial load
  - Verify user name displays in title
  - Verify query parameter `skipIntro=true` bypasses intro screen immediately
  - Verify copyright year is populated automatically in footer
- [x] **Feature 2: 3D Solar System View**
  - Verify WebGL canvas renders on desktop viewport
  - Verify labels container holds dynamic HTML elements
  - Verify star field background is present
  - Verify category planet labels are displayed
- [x] **Feature 3: Planet/System Navigation**
  - Verify entering system view hides home layout biography
  - Verify galaxy back button displays and transitions user back to galaxy view
  - Verify biography is restored upon returning to galaxy view
  - Verify project moon labels are rendered in category system view
- [x] **Feature 4: Moon Selection & Bottom Sheet**
  - Verify clicking moon on desktop triggers correct redirection (internal page vs external link)
  - Verify clicking moon on mobile displays mobile bottom sheet popup
  - Verify mobile popup renders correct title, description, and link
  - Verify orbit controls touch inputs do not conflict with clicking
- [x] **Feature 5: Mobile UI & Interactions**
  - Verify Three.js initialization behaves properly with respect to screen width <= 600px
  - Verify mobile category title behaves correctly on moon selection and close
  - Verify closing the mobile popup unfreezes orbit and restores camera positioning

## Test Suite Inventory

| Tier | Name | Target Coverage | Total Tests | Status |
|:---:|---|---|:---:|:---:|
| **Tier 1** | Feature Coverage | ≥5 tests per feature | 25 | READY |
| **Tier 2** | Boundary & Corner Cases | Boundary values, input parameters, lock state | 25 | READY |
| **Tier 3** | Cross-Feature Combinations | Pairwise feature interaction scenarios | 5 | READY |
| **Tier 4** | Real-World Application Scenarios | Comprehensive multi-step journeys & resize checks | 5 | READY |

### Total Tests: 60

## Execution Command

To execute the test suite:
```bash
npx playwright test
```
