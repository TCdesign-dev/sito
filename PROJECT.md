# Project: Mobile 3D Solar System Portfolio Optimization

## Architecture
- `index.html`: Main page containing the DOM structure, header (bio), footer, instructions, canvas container, mobile close/back button, and mobile bottom sheet popup.
- `main.js`: Three.js setup, galaxy rendering (`renderGalaxy3D`), system rendering (`renderSystem3D`), camera/controls setup, event listeners for mouse/touch clicks, and DOM element positioning/animations.
- `style.css`: Visual styling, reset, layout wraps, intro screen, and mobile styles (including `.mobile-moon-popup` and `.solar-system` sizing).

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | E2E Testing Track | Build test infra & write Tier 1-4 test cases | None | DONE (Conv: 90a58b1d-a572-4974-8a9f-1ff2c3d4b884) |
| 2 | Milestone 1: Mobile Canvas Resizing | Enable 3D on mobile; fix resize/address bar height glitches | None | DONE (Conv: 5da104d2-ba88-4ad4-bc8e-df9d8b811050) |
| 3 | Milestone 2: Touch Interactions | Differentiate swipe from tap; prevent accidental zoom | M2 | IN_PROGRESS (Conv: 5b17b226-96da-4739-b5f2-800701dd2166) |
| 4 | Milestone 3: Camera Framing & UI | Position camera to keep selected planet/moon visible above bottom-sheet | M3 | PLANNED |
| 5 | Milestone 4: Final E2E Pass & Hardening | Pass all E2E tests, run Tier 5 adversarial hardening | M1, M4 | PLANNED |

## Interface Contracts
- Mobile Canvas: The container `#solar-system` must be sized appropriately using viewport units (`svh`/`dvh`) or JavaScript window calculations.
- Event Delegation: The interaction event listeners on `#webgl-canvas` and `#labels-container` must correctly handle touch inputs without conflicting with OrbitControls.
- Bottom Sheet co-existence: The selected item's 3D coordinates projected to screen coordinates must remain above the top border of `#mobile-moon-popup` when the sheet is open.

## Code Layout
- Project Root:
  - `index.html` — main page HTML
  - `main.js` — Three.js and portfolio logic
  - `style.css` — global stylesheet
  - `projects/` — contains projects JSON and images
  - `assets/` — textures and assets
  - `.agents/` — agent metadata and handoffs
