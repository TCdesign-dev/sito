# Milestone 1 Exploration Handoff Report

## 1. Observation

### 1.1 `main.js` Load-time Restriction
In `/Users/tommasocostanza/Documents/antigravity/sharp-newton/main.js`, lines 367-370 check for width before initializing the 3D solar system:
```javascript
  if (window.innerWidth > 600) {
    initThreeJS(container, backBtn);
    renderGalaxy3D();
  }
```

### 1.2 `main.js` Resize Listener Crash
In `/Users/tommasocostanza/Documents/antigravity/sharp-newton/main.js`, lines 479-484 contain the `resize` listener without null/undefined guards:
```javascript
  window.addEventListener('resize', () => {
    isMobile = window.innerWidth <= 768;
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  });
```

### 1.3 `style.css` Height Definitions
In `/Users/tommasocostanza/Documents/antigravity/sharp-newton/style.css`, the heights for `.space-main` and `.solar-system` are defined as follows:
Lines 812-822:
```css
.space-main {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  height: calc(100vh - 160px);
  min-height: calc(100vh - 160px);
  padding: 2rem 0;
  overflow: hidden;
}
```
Lines 904-910:
```css
.solar-system {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  transition: opacity 0.5s ease;
}
```

### 1.4 `index.html` Missing Element and `main.js` Reference
In `/Users/tommasocostanza/Documents/antigravity/sharp-newton/index.html`, the script calls:
```javascript
    loadSolarSystem('solar-system', 'space-bg', 'mobile-planet-list');
```
But there is no element with `id="mobile-planet-list"` in the HTML body. 

In `main.js`, lines 327, 342, 350-362, the `mobile-planet-list` is expected to be present and is populated dynamically:
```javascript
  const mobileList = document.getElementById(mobileListId);
...
  if (mobileList) {
    const categories = Object.keys(orbitsMap);
    categories.forEach(cat => {
      orbitsMap[cat].forEach(p => {
        const pColor = PLANET_COLORS[p.color] || '#aaa';
        const href = p.page ? `project.html?id=${encodeURIComponent(p.id)}` : (p.link || '#');
        const isExternal = p.link && !p.page;

        const ml = document.createElement('a');
        ml.className = 'mobile-planet-card reveal';
        ml.href = href;
        if (isExternal) { ml.target = '_blank'; ml.rel = 'noopener noreferrer'; }
        ml.innerHTML = `
          <div class="mobile-planet-icon" style="--planet-color: ${pColor}"></div>
          <div class="mobile-planet-info">
            <span class="mobile-planet-name">${esc(p.name)}</span>
            <span class="mobile-planet-cat">${esc(cat)}</span>
          </div>
        `;
        mobileList.appendChild(ml);
      });
    });
    initScrollReveal();
  }
```

---

## 2. Logic Chain

1. **Restriction Removal**: By removing the conditional check `if (window.innerWidth > 600)` around `initThreeJS` and `renderGalaxy3D()`, the 3D solar system can be initialized on screens of all sizes, solving Milestone 1.1.
2. **Resize Crash**: If the window resizes or changes orientation on mobile, the `resize` listener executes. If `camera` or `renderer` are somehow uninitialized or cleared, accessing `camera.aspect` or calling `renderer.setSize` will throw a `TypeError`. Adding a guard `if (camera && renderer && container.clientHeight > 0)` prevents this crash, solving Milestone 1.2.
3. **Stable Height**: The use of `vh` in `.space-main` makes it sensitive to mobile address bar toggles (which resize the viewport and cause layout jumps). Using `svh` (Small Viewport Height) locks the height to the smallest possible layout space, eliminating layout jumps when scrolling, solving Milestone 1.3.
4. **Mobile Layout Adaptation**: On desktop, the 3D canvas is full screen. On mobile, we should stack the 3D canvas and the mobile fallback list vertically. This is achieved by changing `.space-main` to `height: auto; overflow: visible; flex-direction: column;` and `#solar-system` to `position: relative; height: 60svh;` under a `@media (max-width: 768px)` media query.
5. **Missing DOM Element**: Adding `<div id="mobile-planet-list" class="mobile-planet-list"></div>` inside `index.html` matches the JavaScript reference and allows cards of class `mobile-planet-card` to be rendered in the DOM, solving Milestone 1.4.

---

## 3. Caveats

* CSS layout adjustments for mobile assume that standard scroll behavior is desired. If the orchestrator prefers a non-scrollable overlay view for the list, an alternative position: fixed bottom sheet structure can be implemented instead.
* Testing has not been run directly as this is a read-only investigation.

---

## 4. Conclusion

We propose the following multi-file fix strategy:

### 4.1 Changes to `main.js`
- Remove the `window.innerWidth > 600` wrapper in `loadSolarSystem`:
  ```javascript
  // Before
  if (window.innerWidth > 600) {
    initThreeJS(container, backBtn);
    renderGalaxy3D();
  }

  // After
  initThreeJS(container, backBtn);
  renderGalaxy3D();
  ```
- Secure the `resize` event handler inside `initThreeJS`:
  ```javascript
  // Before
  window.addEventListener('resize', () => {
    isMobile = window.innerWidth <= 768;
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  });

  // After
  window.addEventListener('resize', () => {
    isMobile = window.innerWidth <= 768;
    if (camera && renderer && container.clientHeight > 0) {
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    }
  });
  ```

### 4.2 Changes to `style.css`
- Update `.space-main` with stable viewport units:
  ```css
  .space-main {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 1;
    height: calc(100svh - 160px);
    min-height: calc(100svh - 160px);
    padding: 2rem 0;
    overflow: hidden;
  }
  ```
- Add responsive styles for mobile stack view, including styling for the `#mobile-planet-list` and `.mobile-planet-card`:
  ```css
  @media (max-width: 768px) {
    .space-main {
      flex-direction: column;
      height: auto;
      min-height: auto;
      overflow: visible;
      padding-bottom: 4rem;
    }
    
    .solar-system {
      position: relative;
      height: 60svh;
      width: 100%;
    }

    #mobile-planet-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      width: 100%;
      padding: 1.5rem var(--page-pad);
      z-index: 10;
      position: relative;
    }

    .mobile-planet-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      padding: 1rem;
      border-radius: 12px;
      text-decoration: none;
      color: #fff;
      transition: background 0.2s, transform 0.2s;
    }

    .mobile-planet-card:hover {
      background: rgba(255, 255, 255, 0.1);
      transform: translateY(-2px);
    }

    .mobile-planet-icon {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background-color: var(--planet-color, #aaa);
      box-shadow: 0 0 10px var(--planet-color, #aaa);
    }

    .mobile-planet-info {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .mobile-planet-name {
      font-size: 1rem;
      font-weight: 600;
    }

    .mobile-planet-cat {
      font-size: 0.8rem;
      color: #aaa;
    }
  }

  @media (min-width: 769px) {
    #mobile-planet-list {
      display: none;
    }
  }
  ```

### 4.3 Changes to `index.html`
- Insert `#mobile-planet-list` inside `<main class="space-main">`:
  ```html
    <main class="space-main">
      <button id="galaxy-back-btn" class="galaxy-back-btn" aria-label="Back to Galaxy">
        Galaxy
      </button>
      <div id="mobile-category-title" class="mobile-category-title"></div>
      <div class="solar-system" id="solar-system"></div>
      
      <!-- Added element -->
      <div id="mobile-planet-list" class="mobile-planet-list"></div>

      <div id="mobile-moon-popup" class="mobile-moon-popup">
        ...
      </div>
    </main>
  ```

---

## 5. Verification Method

### 5.1 Verification Commands & Invalidation
- **E2E Playwright Run**: When implemented, run the E2E test commands:
  ```bash
  npx playwright test
  ```
  *(Tests should pass for mobile viewport sizes <= 600px without console errors).*
- **Manual Verification**: 
  - Open developer tools, emulate dynamic viewport resize (e.g. rotating an iPad/iPhone device mode). Ensure no TypeErrors appear in the console.
  - Verify that `#mobile-planet-list` contains elements matching `.mobile-planet-card` classes on mobile layout.
