# Context Notes

- WebGL 3D Solar System portfolio.
- Code uses Three.js (r128), OrbitControls, and Tween.js.
- Currently, `window.innerWidth > 600` prevents running Three.js on mobile screens.
- We need to:
  1. Remove this restriction and enable 3D rendering on mobile.
  2. Implement proper resizing and address bar glitch handling.
  3. Differentiate between dragging/swiping and tapping on a planet/moon on touch devices.
  4. Correct the camera framing when a planet/moon is selected on mobile so it is visible above the bottom sheet.
