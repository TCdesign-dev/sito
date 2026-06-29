# E2E Testing Infrastructure & Codebase Inspection Report

## 1. Observation

### 1.1 Environment Diagnostics
Running terminal checks on the workspace `/Users/tommasocostanza/Documents/antigravity/sharp-newton` yielded the following results:
* **Node.js**:
  Command: `node -v`
  Output: `v20.9.0`
* **Python 3**:
  Command: `python3 --version`
  Output: `Python 3.13.7`
* **Global npm packages**:
  Command: `npm list -g --depth=0`
  Output:
  ```
  /Users/tommasocostanza/.nvm/versions/node/v20.9.0/lib
  ├── corepack@0.20.0
  ├── firebase-tools@15.16.0
  └── npm@10.1.0
  ```
* **Local packages / Workspace structure**:
  - Running `npm list --depth=0` inside the workspace directory resolved to `/Users/tommasocostanza` (the parent home directory) with output:
    ```
    tommasocostanza@ /Users/tommasocostanza
    ├── @shadcn/ui@0.0.4
    ├── @types/react-dom@18.3.1
    ├── @types/react@18.3.12
    ├── @types/recharts@1.8.29
    ├── @vercel/analytics@1.2.2
    ├── chart.js@4.4.4
    ├── lucide-react@0.456.0
    ├── puppeteer@25.2.1
    ├── react-dom@18.3.1
    ├── react@18.3.1
    ├── recharts@2.13.3
    ├── three@0.165.0
    ├── typescript@5.6.3
    └── vite@5.3.1
    ```
  - Searching for `package.json` inside `/Users/tommasocostanza/Documents/antigravity/sharp-newton` returned **0 results**. There is no local `package.json` or `node_modules` directory in the project root.

### 1.2 Codebase Width Constraints
* **Limit 3D Viewport**: `main.js` lines 367-370:
  ```javascript
  if (window.innerWidth > 600) {
    initThreeJS(container, backBtn);
    renderGalaxy3D();
  }
  ```
* **Mobile list fallback reference**: `index.html` line 93:
  ```javascript
  loadSolarSystem('solar-system', 'space-bg', 'mobile-planet-list');
  ```
  However, search for ID `mobile-planet-list` in `index.html` returned **0 matches** (it is missing from the HTML).
* **Resize Event Handler**: `main.js` lines 479-484:
  ```javascript
  window.addEventListener('resize', () => {
    isMobile = window.innerWidth <= 768;
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  });
  ```

### 1.3 Event Listeners
* **Touch Event Listeners**: A search for `touch` in `main.js` returned **0 matches**. The only interaction event listeners registered in `main.js` are:
  - `backBtn.addEventListener('click', ...)` (line 407)
  - `closeBtn.addEventListener('click', ...)` (line 488)
  - `'labels-container'` click event listener (line 518)
  - `canvas.addEventListener('click', ...)` (line 525)
  - `canvas.addEventListener('mousemove', ...)` (line 536)

### 1.4 Camera Transitions
Transitions are handled via `TWEEN` animations in `main.js`:
* **Zoom Out (Intro)**: Lines 980-988:
  ```javascript
  new TWEEN.Tween(camera.position)
    .to({ x: 0, y: 400, z: 700 }, 2500)
    .easing(TWEEN.Easing.Cubic.InOut)
  ```
* **Back to Galaxy View**: Lines 466-470:
  ```javascript
  new TWEEN.Tween(camera.position)
    .to({ x: 0, y: 400, z: 700 }, 1500)
    .easing(TWEEN.Easing.Cubic.InOut)
  ```
* **Transition to Category System View**: Lines 629-633:
  ```javascript
  new TWEEN.Tween(camera.position)
    .to({ x: 0, y: 150, z: 350 }, 1500)
    .easing(TWEEN.Easing.Cubic.InOut)
  ```
* **Focus Moon (Mobile)**: Lines 686-694:
  ```javascript
  const targetPos = { 
    x: obj.position.x, 
    y: obj.position.y + 150, 
    z: obj.position.z + 300 
  };
  new TWEEN.Tween(camera.position)
    .to(targetPos, 800)
    .easing(TWEEN.Easing.Cubic.Out)
  ```
* **Close Moon Sheet**: Lines 504-508:
  ```javascript
  const returnPos = isMobile ? { x: 0, y: 250, z: 500 } : { x: 0, y: 150, z: 350 };
  new TWEEN.Tween(camera.position)
    .to(returnPos, 800)
    .easing(TWEEN.Easing.Cubic.Out)
  ```
* **Unused Helper function**: Lines 868-877 defines a standalone `transitionCamera(tx, ty, tz, onComplete)` function that is never called.

---

## 2. Logic Chain

1. **Environment State**: Because Node (v20.9.0) and Python 3 (3.13.7) are present globally, we can use a Node-based E2E framework (like Playwright or Puppeteer) and use Python's built-in `http.server` module to serve the static site.
2. **Missing package.json**: The absence of a local `package.json` in the workspace root implies that E2E packages must be installed as devDependencies, requiring initialization of a local package manager configuration.
3. **Load-Time Width Limit Bug**:
   - The 3D viewport `initThreeJS()` only runs if `window.innerWidth > 600` on load.
   - The `resize` listener unconditionally reads `camera.aspect` and calls `renderer.setSize`.
   - *Therefore*, if the site is loaded on a mobile screen <= 600px wide, `camera` and `renderer` will be `undefined`. If the user rotates their screen or resizes the viewport to > 600px, the resize listener will run and crash with a `TypeError: Cannot read properties of undefined (reading 'aspect')`.
4. **Missing HTML Elements**:
   - The JavaScript expects a `#mobile-planet-list` element (passed into `loadSolarSystem()`) to append mobile listing cards to, but this element does not exist in `index.html`.
   - *Therefore*, mobile fallback views do not show the list, leaving the mobile screen blank apart from the header/footer.
5. **No Touch Handling**:
   - The complete absence of `touchstart` or pointer events means mobile interactions rely entirely on emulated mouse click event triggers, causing interaction delay and input conflicts with OrbitControls' drag/zoom touch events.
6. **E2E Strategy**:
   - Since WebGL scenes are canvas-based, they are difficult to query using selector queries.
   - However, the codebase syncs labels (`#labels-container .webgl-label`) to 3D positions in the DOM.
   - *Therefore*, E2E tests can interact with the scene directly by selecting and clicking these `.webgl-label` nodes.

---

## 3. Caveats
* We did not run npm installations directly on the user's home path to avoid side-effects in `/Users/tommasocostanza`.
* We assume the project will run on port `8000` via python's `http.server` but port `8000` could be occupied, in which case a fallback port might be needed in configuration.

---

## 4. Conclusion
* We propose using **Playwright** for E2E testing because it supports automated local server startup/shutdown (via `webServer`), native viewport scaling, and accurate touch emulation out of the box.
* We have generated a proposed `playwright.config.js` and a comprehensive `proposed_e2e.spec.js` file covering Tiers 1-4.
* Key bugs to fix before/during testing:
  - Add checking to prevent `resize` crashes if `camera` or `renderer` are undefined.
  - Implement a mobile navigation list element (`#mobile-planet-list`) in `index.html`.
  - Add explicit touch events to differentiate tapping from dragging/zooming on mobile devices.

---

## 5. Verification Method

### 5.1 Verification Commands
To initialize and execute E2E testing, follow these steps:
1. Initialize a `package.json` in the root:
   ```bash
   npm init -y
   ```
2. Install Playwright:
   ```bash
   npm install --save-dev @playwright/test
   npx playwright install chromium
   ```
3. Copy our proposed configurations:
   ```bash
   cp .agents/explorer_e2e_infra_1/proposed_playwright.config.js playwright.config.js
   mkdir -p tests/e2e
   cp .agents/explorer_e2e_infra_1/proposed_e2e.spec.js tests/e2e/e2e.spec.js
   ```
4. Run the test suite:
   ```bash
   npx playwright test
   ```

### 5.2 Invalidation Conditions
- If Python3 is blocked or cannot run `python3 -m http.server 8000`, the Playwright webServer start will fail.
- If the canvas does not project labels correctly, E2E locator actions on `.webgl-label` will timeout.
