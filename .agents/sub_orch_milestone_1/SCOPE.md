# Scope: Milestone 1: Mobile Canvas Resizing and Stability

## Architecture
- `index.html`: Main HTML file. Needs `#mobile-planet-list` added to match JS reference.
- `main.js`: Main JS file. Needs:
  - Removal of `window.innerWidth > 600` check for initializing the 3D solar system.
  - Safe initialization check or proper order in the resize handler so that it doesn't crash on undefined `camera` or `renderer` on mobile.
- `style.css`: Stylesheet. Sizing for `#solar-system` and `.space-main` using dvh/svh to avoid address bar jumps on mobile.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Enable 3D on Mobile | Remove `window.innerWidth > 600` restriction in `main.js` | None | DONE |
| 2 | Fix Resize Crash | Protect resize listener in `main.js` from TypeErrors when `camera`/`renderer` are uninitialized | None | DONE |
| 3 | Stable Canvas Height | Use `svh`/`dvh` or CSS variables for `#solar-system` and `.space-main` | None | DONE |
| 4 | Fix Mobile Planet List DOM | Add `#mobile-planet-list` element to `index.html` | None | DONE |

## Interface Contracts
- The Three.js canvas must render on screens <= 600px wide.
- Resizing the window on mobile must not throw any console TypeErrors.
- The height of `#solar-system` and `.space-main` must remain stable on mobile when the address bar is toggled (hidden/shown), avoiding layout jumps.
- `#mobile-planet-list` must exist in the DOM.
