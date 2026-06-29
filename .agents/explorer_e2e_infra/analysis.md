# Detailed E2E Infrastructure Analysis Report

This report outlines the structural implementation of the five core features specified in `TEST_INFRA.md` based on an investigation of `index.html`, `main.js`, `style.css`, and `projects/projects.json`.

---

## 1. Feature 1: Intro Sequence & Liveness

### Elements Involved
- **Intro Screen Overlay**: `#intro-screen` containing `<h1 class="intro-title">Tommaso Costanza</h1>`. In CSS, it is set to `position: fixed; inset: 0; z-index: 9999; background: var(--bg);`.
- **Intro Title Text**: `.intro-title` with styling for fade and zoom animation (`introReveal`).
- **Instructions Overlay**: `#solar-instructions` containing instruction text. In CSS, it has `position: absolute; bottom: 12%; opacity: 0; transition: opacity 1s ease; z-index: 1000;`.
- **Space Header/Bio**: `#space-header` (the navigation bar and bio description). It has classes `space-header page-wrap initially-hidden` that hide it by setting `opacity: 0` and `transform: translateY(-20px)`.
- **Copyright Year Footer Element**: `<span class="copyright-year"></span>` in `index.html`.

### How Intro is Dismissed
1. **DOMContentLoaded Initiation**: On initial load, a `DOMContentLoaded` event listener fires in `main.js` (lines 954–1013).
2. **Query Parameter Bypass Check**: The code retrieves the query parameter `skipIntro`.
   - `const skipIntro = new URLSearchParams(window.location.search).get('skipIntro') === 'true';`
3. **Sequence with Intro (Default)**:
   - Sets `window.isTransitioning = true` to lock user input.
   - **T = 2400ms**: `document.body.classList.add('loaded')` is called. CSS transitions `#intro-screen` to `opacity: 0` and `visibility: hidden`.
   - **T = 3200ms** (2400ms + 800ms): `#intro-screen` is removed from the DOM using `intro.remove()` to prevent click obstruction. The instructions `#solar-instructions` fade in via `.classList.add('visible')`.
   - **T = 6700ms** (3200ms + 3500ms): Instructions fade out (`instructions.classList.remove('visible')`). Camera zoom-out begins via TWEEN, moving the camera position from `(0, 200, 400)` to `(0, 400, 700)` over 2500ms.
   - **T = 9200ms** (6700ms + 2500ms): Transition complete. `window.isTransitioning` is set to `false`. `#space-header` is revealed by adding `.classList.add('reveal-header')` (triggering CSS opacity and translate transforms).
4. **Sequence with `skipIntro=true`**:
   - `loaded` class is added to `body` immediately.
   - `window.isTransitioning` set to `false`.
   - `#space-header` gets `reveal-header` class immediately.
   - `#intro-screen` and `#solar-instructions` are removed from the DOM immediately.
   - Camera position is set to `(0, 400, 700)` via a polling `setInterval` checking for camera initialization.

### Selectors
- Intro screen: `#intro-screen`
- Intro title: `.intro-title`
- Instructions overlay: `#solar-instructions`
- Space Header: `#space-header`
- Header reveal status class: `.reveal-header`
- Copyright Year: `.copyright-year`

---

## 2. Feature 2: 3D Solar System View

### Elements Involved
- **Outer System Container**: `<div class="solar-system" id="solar-system">` in `index.html`.
- **Dynamic Elements Appended** (via `initThreeJS` in `main.js` lines 374–385):
  - **WebGL Canvas**: `<canvas id="webgl-canvas"></canvas>` where the 3D scene is rendered.
  - **Labels Container**: `<div id="labels-container"></div>` which acts as a 2D HTML overlay.
  - **Desktop Moon Hover Tooltip**: `<div id="moon-popup" class="moon-popup">` containing image, title, and description.

### Dimensions & Setup
- **WebGL Renderer**: Bounds canvas to parent client dimensions.
  ```javascript
  renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  ```
- **Responsive Resizing**: Camera aspect ratio updates dynamically on window resizing (lines 479–484):
  ```javascript
  window.addEventListener('resize', () => {
    isMobile = window.innerWidth <= 768;
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  });
  ```

### Labels
- Created dynamically as `<div class="webgl-label">` (for category planets) or `<div class="webgl-label webgl-label--moon">` (for project moons).
- Positioned in 2D space inside `#labels-container` by projecting the 3D position vector onto the camera viewpoint (`animate()` loop lines 910–945):
  ```javascript
  const pos = p.mesh.position.clone();
  pos.y += (p.radius === 0) ? 55 : 20; 
  pos.project(camera);
  ```
- If the coordinate lies behind the camera (`pos.z >= 1`), the label is hidden. Otherwise, it is shown (`.classList.add('visible')`) and translated:
  ```javascript
  p.labelEl.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px)`;
  ```

---

## 3. Feature 3: Planet/System Navigation

### Elements & Selectors
- **Planets (Category Nodes)**: Spheres generated dynamically per project category (first tag in `projects.json`).
  - Raycaster target: `mesh.userData = { isCategory: true, category: cat };`
  - HTML Label selector: `#labels-container .webgl-label:not(.webgl-label--moon)` (contains text matching category names like "Design", "Web", "Typography").
- **Navigation Controls**: Back button: `#galaxy-back-btn`.

### Clicking Behavior & Flow
1. **Transition from Galaxy to System View**:
   - Triggered by clicking a category label or raycasting click on the planet sphere.
   - Sets `window.isTransitioning = true` to lock interaction.
   - Hides `#space-header` biography wrap (`.hero-bio-wrap`).
   - Sets `currentView = category_name`.
   - Displays back button by adding `.visible` class to `#galaxy-back-btn`.
   - Halts all orbit animations (planet speed becomes `0`).
   - Fades out / scales down all other planets and the Sun to `(0, 0, 0)` scale over 1000ms using TWEEN.
   - Moves the selected planet to center (`radius = 0`) and scales it up to `3x` over 1500ms.
   - Animates camera position to `{ x: 0, y: 150, z: 350 }` and controls target to `{ x: 0, y: 0, z: 0 }` over 1500ms.
   - **Upon Camera Completion**:
     - Scene is cleared using `clearScene()`.
     - Category System View is built via `renderSystem3D(category)`.
       - Renders a large central planet (`centerMesh.userData.isSun = true`) representing the category.
       - Renders smaller project moons orbiting the central planet.
     - Moons scale up from `(0,0,0)` to `(1,1,1)` over 1000ms with elastic easing.
     - Sets `window.isTransitioning = false` to restore interaction.
2. **Transition back from System to Galaxy View**:
   - Triggered by clicking `#galaxy-back-btn`.
   - Sets `window.isTransitioning = true` and `currentView = 'galaxy'`.
   - Removes `.visible` from `#galaxy-back-btn`.
   - Re-displays biography wrap (`.hero-bio-wrap`).
   - Resets and clears the scene, then calls `renderGalaxy3D()`.
   - Animates the active planet back to its orbit radius and scale `(1, 1, 1)` from the center.
   - Scales the Sun and other planets back up from `(0,0,0)` to `(1,1,1)` over 1500ms.
   - Animates camera position back to `{ x: 0, y: 400, z: 700 }` and controls target back to `{ x: 0, y: 0, z: 0 }` over 1500ms.
   - Sets `window.isTransitioning = false` upon completion.

---

## 4. Feature 4: Moon Selection & Bottom Sheet

### Elements & Selectors
- **Moons (Project Nodes)**: Orbiting spheres generated in System View.
  - Raycaster target: `mesh.userData = { isMoon: true, project: project_data };`
  - HTML Label selector: `#labels-container .webgl-label.webgl-label--moon` (displays project names like "Compact Security Camera", "Creative Minds Archive").
- **Mobile Bottom Sheet popup**: `#mobile-moon-popup` containing:
  - Close button: `#mobile-close-btn`
  - Preview image: `#mobile-moon-img`
  - Title: `#mobile-moon-title`
  - Description: `#mobile-moon-desc`
  - Project link button: `#mobile-explore-btn`
- **Mobile Category Header Text**: `#mobile-category-title`

### Selection & Transition Behavior
- **Desktop Device (`isMobile` is false)**:
  - Hovering a moon displays `#moon-popup` dynamically positioned at projected screen coordinates.
  - Clicking a moon redirects the browser directly to `project.html?id=<project-id>` or opens external URLs in a new tab.
- **Mobile Device (`isMobile` is true / width <= 768px)**:
  - Clicking a moon label or raycasting click on the sphere triggers the mobile detail transition.
  - Sets `window.isTransitioning = true`.
  - Sets `window.hoveredMoon = clicked_moon_mesh` to freeze orbital motion in the render loop.
  - Populates bottom sheet content:
    - Sets `#mobile-moon-title` text to `project.name`.
    - Sets `#mobile-moon-desc` text to `project.description`.
    - Sets `#mobile-moon-img` `src` to `project.preview` (hides image element if missing).
    - Sets `#mobile-explore-btn` `href` to detail URL (with appropriate target).
  - Displays category header `#mobile-category-title` at the top (adds class `.visible`).
  - Scales the central category planet down to `(0,0,0)` scale over 500ms.
  - Focuses camera: pans camera position to `{ x: moon.x, y: moon.y + 150, z: moon.z + 300 }` and targets `{ x: moon.x, y: moon.y - 60, z: moon.z }` over 800ms.
  - **Upon Camera Completion**:
    - Slides the bottom sheet up from the bottom by adding class `.visible` to `#mobile-moon-popup`.
    - Sets `window.isTransitioning = false`.

---

## 5. Feature 5: Mobile UI & Interactions

### Mobile Close / Back Buttons
- **Bottom Sheet Close**: `#mobile-close-btn` inside `#mobile-moon-popup`.
- **System View Back**: `#galaxy-back-btn` (shared between desktop and mobile).
- **Clicking `#mobile-close-btn`**:
  - Checks if `window.isTransitioning` is true, returns.
  - Locks transitions: `window.isTransitioning = true`.
  - Slides down and hides `#mobile-moon-popup` by removing class `.visible`.
  - Hides `#mobile-category-title` by removing class `.visible`.
  - Unfreezes moon orbit: `window.hoveredMoon = null`.
  - Scales the central category planet back up to `(1,1,1)` scale over 500ms.
  - Restores camera: pans camera position back to category system view camera position (mobile portrait: `{ x: 0, y: 250, z: 500 }`, mobile landscape/tablet: `{ x: 0, y: 150, z: 350 }`) and targets `{ x: 0, y: 0, z: 0 }` over 800ms.
  - Sets `window.isTransitioning = false` upon completion.

### Responsive Layout Details & Architectural Limits
1. **Screen Width Limit (Width <= 600px)**:
   - On load, if screen width is `<= 600px`, `initThreeJS()` is NOT called. The WebGL 3D Canvas does not run.
   - The logic attempts to render a fallback project listing inside the element `#mobile-planet-list`.
   - **Bug**: `#mobile-planet-list` is completely missing from `index.html`. As a result, users loading the site on devices `<= 600px` see an empty space below the bio section.
2. **Dynamic Resize / Orientation Crash**:
   - If the site is loaded on a width `<= 600px`, `camera` and `renderer` remain undefined.
   - If the user resizes the screen or rotates their device to a width `> 600px`, the `resize` listener fires and attempts to execute:
     `camera.aspect = ...`
     This throws a `TypeError: Cannot read properties of undefined (reading 'aspect')` and crashes the execution.
3. **Address Bar Height Glitch**:
   - The viewport container is sized with `.space-main { height: calc(100vh - 160px); }`.
   - On mobile browsers, `100vh` ignores browser address bars, causing sizing glitches and content overflow.
4. **Touch Input Conflict**:
   - The codebase has zero `touch` handlers (no `touchstart`, `touchend`, etc.) registered.
   - Selecting elements relies on simulated `click` events mapped by the browser on tap, which frequently conflicts with Three.js `OrbitControls` touch drag/zoom inputs.

---

## 6. Recommended Playwright Test Design

To thoroughly test this infrastructure, tests should target different viewports (Desktop vs Mobile) and handle transitions using structured waiting strategies.

### Recommended Selectors
- **Intro Screen**: `#intro-screen`
- **Instructions**: `#solar-instructions`
- **Copyright Year**: `.copyright-year`
- **Biographical Wrap**: `.hero-bio-wrap`
- **WebGL Canvas**: `#webgl-canvas`
- **Category Planet Labels**: `#labels-container .webgl-label:not(.webgl-label--moon)`
- **Project Moon Labels**: `#labels-container .webgl-label--moon`
- **Galaxy Back Button**: `#galaxy-back-btn`
- **Mobile Bottom Sheet**: `#mobile-moon-popup`
- **Mobile Close Button**: `#mobile-close-btn`
- **Mobile Explore Button**: `#mobile-explore-btn`
- **Mobile Category Header**: `#mobile-category-title`

### Recommended Waiting Strategies
- **Intro Dismissal**: Use `expect(locator).not.toBeAttached({ timeout: 10000 })` to ensure the intro screen is completely deleted from the DOM.
- **Label Visibility**: Use `expect(locator).toBeVisible({ timeout: 5000 })` to wait for TWEEN camera transitions to complete and projected labels to display on the overlay.
- **URL Navigation**: Use `page.waitForURL(/\/project\.html\?id=/)` after clicking a moon to wait for route redirection.
- **Mobile Bottom Sheet Slide**: Use `expect(locator).toHaveClass(/visible/, { timeout: 2000 })` to wait for CSS slide-up transition.

### Playwright Spec Outline

```javascript
const { test, expect } = require('@playwright/test');

test.describe('WebGL Portfolio E2E Suite', () => {
  
  test('Feature 1: Intro sequence transitions and dismisses correctly', async ({ page }) => {
    await page.goto('/');
    const intro = page.locator('#intro-screen');
    const instructions = page.locator('#solar-instructions');
    const header = page.locator('#space-header');
    
    // Initial state
    await expect(intro).toBeAttached();
    
    // After intro finishes and instructions display
    await expect(intro).not.toBeAttached({ timeout: 10000 });
    await expect(instructions).toHaveClass(/visible/);
    
    // After instructions dismiss and header displays
    await expect(instructions).not.toHaveClass(/visible/, { timeout: 6000 });
    await expect(header).toHaveClass(/reveal-header/, { timeout: 4000 });
  });

  test('Feature 2 & 3: Desktop Planet navigation and canvas load', async ({ page }) => {
    // skipIntro skips timeout delays
    await page.goto('/?skipIntro=true');
    
    // Verify WebGL Canvas loads
    const canvas = page.locator('#webgl-canvas');
    await expect(canvas).toBeVisible();
    
    // Click category planet label
    const categoryLabel = page.locator('#labels-container .webgl-label').first();
    await expect(categoryLabel).toBeVisible();
    const categoryName = await categoryLabel.textContent();
    await categoryLabel.click();
    
    // Verify back button fades in
    const backBtn = page.locator('#galaxy-back-btn');
    await expect(backBtn).toHaveClass(/visible/);
    
    // Click back button to return to galaxy
    await backBtn.click();
    await expect(backBtn).not.toHaveClass(/visible/);
    await expect(categoryLabel).toBeVisible();
  });

  test('Feature 4 & 5: Mobile bottom sheet behavior and closing', async ({ page }) => {
    // Set mobile-like viewport that initializes ThreeJS (> 600px width, <= 768px width)
    await page.setViewportSize({ width: 700, height: 800 });
    await page.goto('/?skipIntro=true');

    // Click Category
    const categoryLabel = page.locator('#labels-container .webgl-label').first();
    await categoryLabel.click();

    // Wait for project moon label and click it
    const moonLabel = page.locator('#labels-container .webgl-label--moon').first();
    await expect(moonLabel).toBeVisible();
    await moonLabel.click();

    // Verify bottom sheet slides up
    const bottomSheet = page.locator('#mobile-moon-popup');
    await expect(bottomSheet).toHaveClass(/visible/);
    await expect(page.locator('#mobile-moon-title')).not.toBeEmpty();

    // Click close button
    const closeBtn = page.locator('#mobile-close-btn');
    await closeBtn.click();

    // Verify bottom sheet dismissed
    await expect(bottomSheet).not.toHaveClass(/visible/);
  });
});
```

---

## 7. Serving the Directory with Python's `http.server`

### Commands and Options
Python’s built-in `http.server` module provides a simple, single-threaded HTTP server suitable for serving static directory assets during E2E testing:

1. **Standard Invocations**:
   - To serve from the current directory on default port `8000`:
     ```bash
     python3 -m http.server 8000
     ```
   - To serve a specific workspace path on a custom port (supported since Python 3.7):
     ```bash
     python3 -m http.server --directory /Users/tommasocostanza/Documents/antigravity/sharp-newton 8000
     ```
2. **Behavioral Characteristics**:
   - Maps URL request paths directly to the files on the filesystem.
   - Binds by default to `0.0.0.0` (all available interfaces), which resolves to `localhost` and `127.0.0.1`.
   - Supports correct MIME content-types headers (e.g. `text/html` for `.html`, `text/css` for `.css`, `application/javascript` for `.js`, and `image/webp` for preview images).
3. **Playwright Integration**:
   - The Playwright config runs the server in the background and shuts it down automatically when tests finish.
   - Example configuration in `playwright.config.js`:
     ```javascript
     webServer: {
       command: 'python3 -m http.server 8000',
       port: 8000,
       reuseExistingServer: !process.env.CI,
       timeout: 10000,
     }
     ```
