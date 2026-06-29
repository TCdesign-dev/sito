# Detailed Analysis: Mouse and Touch Interactions (Swipe and Tap)

This analysis reports on the current state of mouse and touch interactions in the project, identifies the causes of false-positive clicks during swiping/dragging/scrolling, and provides a detailed strategy and patch to resolve these conflicts.

---

## 1. Current Implementation of Interactions

The interaction logic is centralized in `main.js`. The key mouse and touch interaction components are:

### 1.1 OrbitControls (Camera Drag/Swipe and Zoom)
* **File & Line**: `main.js:395` (inside `initThreeJS()`)
* **Code**:
  ```javascript
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.maxDistance = 1500;
  controls.minDistance = 100;
  ```
* **Mechanism**: Binds pointer down, move, up, and wheel listeners on `renderer.domElement` (the 3D canvas) to rotate, zoom, or pan the camera.

### 1.2 Raycaster Click Listener (3D Canvas Click)
* **File & Line**: `main.js:525–534`
* **Code**:
  ```javascript
  canvas.addEventListener('click', (e) => {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children);
    if (intersects.length > 0) {
      handleObjectClick(intersects[0].object);
    }
  });
  ```
* **Mechanism**: Captures clicks on the canvas, projects screen coordinates into 3D, and selects the intersected category planet or project moon.

### 1.3 Label Element Click Listener (2D HTML Overlay Clicks)
* **File & Line**: `main.js:518–523`
* **Code**:
  ```javascript
  document.getElementById('labels-container').addEventListener('click', (e) => {
    if (e.target.classList.contains('webgl-label')) {
      const objData = planetsData.find(p => p.labelEl === e.target);
      if (objData) handleObjectClick(objData.mesh);
    }
  });
  ```
* **Mechanism**: Binds a click listener on the parent container `#labels-container`. By using event delegation, it handles clicks on `.webgl-label` elements and calls `handleObjectClick`.

### 1.4 Mouse Hover Tooltip (Desktop Hover)
* **File & Line**: `main.js:536–575`
* **Mechanism**: Listens to mouse movements over the canvas. If on mobile, it immediately closes hover popups and exits. Otherwise, it tracks which object is hovered to display details and freeze moon orbital motion.

---

## 2. Accidental Click (False-Positive) Conflict Analysis

The root cause of false-positives (accidental clicks on planets or moons while dragging, zooming, or swiping) is that **both OrbitControls navigation and selection click handlers listen to the same interaction lifecycle without coordinating**.

1. **Standard Click Lifecycle**: A browser `click` event is fired when a pointer (mouse or touch) goes down and comes back up on the same element.
2. **OrbitControls Drag/Swipe**: When dragging to rotate the camera, the user performs `pointerdown -> pointermove -> pointerup` on the canvas. Because both down and up occur on the canvas, the browser fires a `click` event.
3. **Raycast on Mouseup**: The `click` event listener on `canvas` reads the release position (`e.clientX` / `e.clientY`) and raycasts. If a planet or moon is underneath the pointer *where the user released their drag*, the click is registered, triggering navigation or displaying the mobile popup.
4. **Scrolling / Panning Accidental Selection**: On mobile devices, swiping is also used to scroll the page. When the user scrolls over the 3D canvas (which is styled to take 60% of the viewport height), their finger touches down, drags, and releases on the canvas. If the release coordinate matches a planet/moon, it triggers a false-positive click.

---

## 3. Baseline E2E Test Suite Status

A run of the baseline E2E test suite was initiated using `npx playwright test`. 

### 3.1 Test Findings and Failures
Several tests in `tier1` (and subsequent tiers) fail due to **timeouts (30000ms exceeded)** during `.click()` actions on category planets or moons.
* **Verbatim Error (from Playwright logs)**:
  ```
  Error: locator.click: Test timeout of 30000ms exceeded.
  Call log:
    - waiting for locator('#labels-container .webgl-label:not(.webgl-label--moon)').first()
      - locator resolved to <div class="webgl-label visible">Design</div>
    - attempting click action
      2 × waiting for element to be visible, enabled and stable
        - element is not stable
      - retrying click action
  ```
* **Rationale**: In `main.js`, category planets and moons orbit continuously (`p.angle += p.speed` inside `animate()`), and their projected 2D coordinates are dynamically applied to the label style transforms (`p.labelEl.style.transform = translate(...)`) on every animation frame (60fps). Because the elements are constantly moving, Playwright's actionability checks determine that the elements are "not stable" and wait for them to stop moving. Since they never stop, Playwright times out.
* **Resolution for Tests**: This is a known E2E test design issue. Clicking animating elements in Playwright requires bypassing stability checks using the `{ force: true }` parameter:
  ```javascript
  await categoryLabel.click({ force: true });
  ```
  *Note: Since this task is read-only, no changes are made to the tests.*

---

## 4. Proposed Strategy for Fluid Touch Interactions (Swipe vs Tap)

To separate swipe/drag gestures from intentional taps, we must filter out `click` events that follow drag/swipe motions.

### 4.1 Recommended Solution: Unified Delta-Distance & Time Thresholds
We track pointer coords on `pointerdown` and compare them on `click`. This handles mouse and touch inputs uniformly and does not interfere with OrbitControls.

1. **Pointer Down Registry**: Capture the screen position (`clientX`, `clientY`) and timestamp (`Date.now()`) when the user starts touching/clicking.
2. **Click Guard**: When the `click` event fires, calculate:
   * **Distance delta**: `distance = Math.sqrt(dx^2 + dy^2)`
   * **Duration**: `duration = now - startTime`
3. **Threshold Filters**:
   * If `distance > TAP_DISTANCE_THRESHOLD` (e.g., 8px), it was a drag/swipe gesture. Discard click.
   * If `duration > TAP_TIME_THRESHOLD` (e.g., 300ms), it was a long press or drag. Discard click.
4. **Keyboard Accessibility Guard**: Ensure that keyboard clicks (triggered by Tab + Enter/Space) are not blocked. A keyboard click has `e.detail === 0`, so we can bypass threshold checks if `e.detail === 0`.

---

## 5. Proposed Code Modifications

The proposed changes to `main.js` are described below.

### 5.1 Global Interaction Variables
Add variables at the top of the Solar System config section in `main.js` (around line 316):
```javascript
// Tap vs Drag differentiation variables
let pointerStartX = 0;
let pointerStartY = 0;
let pointerStartTime = 0;
const TAP_DISTANCE_THRESHOLD = 8; // Max movement in pixels for a valid tap
const TAP_TIME_THRESHOLD = 300;   // Max duration in ms for a valid tap

/** Helper to verify if a click event is a valid tap or a keyboard activation */
function isRecentTap(e) {
  if (e.detail === 0) return true; // Keep keyboard selection accessible
  const dx = e.clientX - pointerStartX;
  const dy = e.clientY - pointerStartY;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const duration = Date.now() - pointerStartTime;
  return distance < TAP_DISTANCE_THRESHOLD && duration < TAP_TIME_THRESHOLD;
}
```

### 5.2 Event Listeners Update
Update event bindings in `initThreeJS` (around line 517):
1. **Pointerdown Capture**: Add a listener to the container wrapper (`container`) to register start coords for both the canvas and labels.
2. **Apply Guards**: Check `isRecentTap(e)` in the click listeners.

```javascript
  // Pointerdown registry for the wrapper container
  container.addEventListener('pointerdown', (e) => {
    pointerStartX = e.clientX;
    pointerStartY = e.clientY;
    pointerStartTime = Date.now();
  });

  // Events
  document.getElementById('labels-container').addEventListener('click', (e) => {
    if (!isRecentTap(e)) return; // Filter out drag releases
    if (e.target.classList.contains('webgl-label')) {
      const objData = planetsData.find(p => p.labelEl === e.target);
      if (objData) handleObjectClick(objData.mesh);
    }
  });

  canvas.addEventListener('click', (e) => {
    if (!isRecentTap(e)) return; // Filter out drag releases
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children);
    if (intersects.length > 0) {
      handleObjectClick(intersects[0].object);
    }
  });
```
