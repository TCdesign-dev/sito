const { test, expect } = require('@playwright/test');

// External-link project (page: false + link) picked from the live data;
// the tests that need one skip themselves when none exists.
const projects = require('../../projects/projects.json');
const extSample = projects.find(
  p => p.link && !p.page && p.category && p.category.toLowerCase() !== 'explorations'
);

test.describe('Tier 2: Boundary & Corner Cases', () => {

  // ==========================================
  // FEATURE 1: Intro Sequence & Liveness (5 tests)
  // ==========================================

  test('F1-2-1: skipIntro with invalid parameter does not skip intro', async ({ page }) => {
    await page.goto('/?skipIntro=invalid');
    const intro = page.locator('#intro-screen');
    await expect(intro).toBeAttached();
  });

  test('F1-2-2: skipIntro with empty parameter does not skip intro', async ({ page }) => {
    await page.goto('/?skipIntro=');
    const intro = page.locator('#intro-screen');
    await expect(intro).toBeAttached();
  });

  test('F1-2-3: Intro overlay element #intro-screen is fully removed from DOM', async ({ page }) => {
    await page.goto('/?skipIntro=true');
    const intro = page.locator('#intro-screen');
    await expect(intro).not.toBeAttached();
  });

  test('F1-2-4: Instructions disappear after transition duration', async ({ page }) => {
    await page.goto('/');
    const instructions = page.locator('#solar-instructions');
    // At T = 3200ms, instructions appear. At T = 6700ms, instructions fade out.
    await expect(instructions).toHaveClass(/visible/, { timeout: 10000 });
    await expect(instructions).not.toHaveClass(/visible/, { timeout: 10000 });
  });

  test('F1-2-5: Body has loaded class after intro completes', async ({ page }) => {
    await page.goto('/?skipIntro=true');
    const body = page.locator('body');
    await expect(body).toHaveClass(/loaded/);
  });

  // ==========================================
  // FEATURE 2: 3D Solar System View (5 tests)
  // ==========================================

  test('F2-2-1: Canvas handles resize updates', async ({ page }) => {
    await page.goto('/?skipIntro=true');
    const canvas = page.locator('#webgl-canvas');
    await expect(canvas).toBeVisible();
    await page.setViewportSize({ width: 800, height: 600 });
    await expect(canvas).toBeVisible();
  });

  test('F2-2-2: OrbitControls target defaults to center', async ({ page }) => {
    await page.goto('/?skipIntro=true');
    const targetX = await page.evaluate(() => typeof controls !== 'undefined' ? controls.target.x : null);
    expect(targetX).toBe(0);
  });

  test('F2-2-3: Scene contains light elements', async ({ page }) => {
    await page.goto('/?skipIntro=true');
    const lightCount = await page.evaluate(() => {
      if (typeof scene === 'undefined') return 0;
      return scene.children.filter(c => c.isAmbientLight || c.isPointLight).length;
    });
    expect(lightCount).toBeGreaterThan(0);
  });

  test('F2-2-4: WebGL context is initialized correctly', async ({ page }) => {
    await page.goto('/?skipIntro=true');
    const hasGL = await page.evaluate(() => {
      const canvas = document.getElementById('webgl-canvas');
      if (!canvas) return false;
      return !!canvas.getContext('webgl') || !!canvas.getContext('webgl2');
    });
    expect(hasGL).toBe(true);
  });

  test('F2-2-5: Labels are updated with translation style on render loop', async ({ page }) => {
    await page.goto('/?skipIntro=true');
    const firstLabel = page.locator('#labels-container .webgl-label:not(.webgl-label--moon)').first();
    await expect(firstLabel).toBeVisible();
    const styleAttr = await firstLabel.getAttribute('style');
    expect(styleAttr).toContain('transform');
  });

  // ==========================================
  // FEATURE 3: Planet/System Navigation (5 tests)
  // ==========================================

  test('F3-2-1: Category click is ignored when isTransitioning is true', async ({ page }) => {
    await page.goto('/?skipIntro=true');
    await page.evaluate(() => { window.isTransitioning = true; });
    const categoryLabel = page.locator('#labels-container .webgl-label:not(.webgl-label--moon)').first();
    await expect(categoryLabel).toBeVisible();
    await categoryLabel.evaluate(el => el.click());
    const backBtn = page.locator('#galaxy-back-btn');
    await expect(backBtn).not.toHaveClass(/visible/);
  });

  test('F3-2-2: Back button click is ignored when isTransitioning is true', async ({ page }) => {
    await page.goto('/?skipIntro=true');
    const categoryLabel = page.locator('#labels-container .webgl-label:not(.webgl-label--moon)').first();
    await categoryLabel.evaluate(el => el.click());
    const backBtn = page.locator('#galaxy-back-btn');
    await expect(backBtn).toHaveClass(/visible/);
    
    await page.evaluate(() => { window.isTransitioning = true; });
    await backBtn.click();
    await expect(backBtn).toHaveClass(/visible/);
  });

  test('F3-2-3: Clicking outside elements on 3D canvas does not trigger navigation', async ({ page }) => {
    await page.goto('/?skipIntro=true');
    const canvas = page.locator('#webgl-canvas');
    await canvas.click({ position: { x: 5, y: 5 } });
    const backBtn = page.locator('#galaxy-back-btn');
    await expect(backBtn).not.toHaveClass(/visible/);
  });

  test('F3-2-4: Rapid back button click does not corrupt navigation state', async ({ page }) => {
    await page.goto('/?skipIntro=true');
    const categoryLabel = page.locator('#labels-container .webgl-label:not(.webgl-label--moon)').first();
    await categoryLabel.evaluate(el => el.click());
    const backBtn = page.locator('#galaxy-back-btn');
    await expect(backBtn).toHaveClass(/visible/);
    
    await backBtn.dblclick();
    await expect(backBtn).not.toHaveClass(/visible/);
  });

  test('F3-2-5: Selected planet transitions to center and scales up', async ({ page }) => {
    await page.goto('/?skipIntro=true');
    const categoryLabel = page.locator('#labels-container .webgl-label:not(.webgl-label--moon)').first();
    const text = await categoryLabel.textContent();
    await categoryLabel.evaluate(el => el.click());
    
    const centerLabel = page.locator('#labels-container .webgl-label:not(.webgl-label--moon)').first();
    await expect(centerLabel).toContainText(text || '');
  });

  // ==========================================
  // FEATURE 4: Moon Selection & Bottom Sheet (5 tests)
  // ==========================================

  test('F4-2-1: Desktop click navigates differently based on project.page', async ({ page }) => {
    test.skip(!extSample, 'No external-link (page: false) project in projects.json');
    await page.goto('/?skipIntro=true');
    const catLabel = page.locator(`#labels-container .webgl-label:has-text("${extSample.category}")`);
    await expect(catLabel).toBeVisible();
    await catLabel.evaluate(el => el.click());

    const moonLabel = page.locator(`#labels-container .webgl-label--moon:has-text("${extSample.name}")`);
    await expect(moonLabel).toBeVisible({ timeout: 10000 });
    
    const [newPage] = await Promise.all([
      page.context().waitForEvent('page'),
      moonLabel.evaluate(el => el.click()),
    ]);
    expect(newPage.url()).toContain(new URL(extSample.link).hostname);
    await newPage.close();
  });

  test('F4-2-2: Clicking moon on mobile freezes its orbital motion', async ({ page }) => {
    await page.setViewportSize({ width: 700, height: 800 });
    await page.goto('/?skipIntro=true');
    await page.locator('#labels-container .webgl-label:not(.webgl-label--moon)').first().evaluate(el => el.click());
    const moonLabel = page.locator('#labels-container .webgl-label--moon').first();
    await expect(moonLabel).toBeVisible();
    await moonLabel.evaluate(el => el.click());
    
    const isFrozen = await page.evaluate(() => window.hoveredMoon !== null);
    expect(isFrozen).toBe(true);
  });

  test('F4-2-3: Mobile explore button target attribute matches project type', async ({ page }) => {
    test.skip(!extSample, 'No external-link (page: false) project in projects.json');
    await page.setViewportSize({ width: 700, height: 800 });
    await page.goto('/?skipIntro=true');

    await page.locator(`#labels-container .webgl-label:has-text("${extSample.category}")`).evaluate(el => el.click());
    const extMoon = page.locator(`#labels-container .webgl-label--moon:has-text("${extSample.name}")`);
    await expect(extMoon).toBeVisible();
    await extMoon.evaluate(el => el.click());
    
    const exploreBtn = page.locator('#mobile-explore-btn');
    await expect(exploreBtn).toHaveAttribute('target', '_blank');
  });

  test('F4-2-4: Mobile popup hides preview image element if not defined', async ({ page }) => {
    await page.setViewportSize({ width: 700, height: 800 });
    await page.goto('/?skipIntro=true');
    
    await page.locator('#labels-container .webgl-label:not(.webgl-label--moon)').first().evaluate(el => el.click());
    const moonLabel = page.locator('#labels-container .webgl-label--moon').first();
    await expect(moonLabel).toBeVisible();
    
    await page.evaluate(() => {
      const moons = planetsData.filter(p => p.mesh.userData.isMoon);
      if (moons.length > 0) {
        moons[0].mesh.userData.project.preview = null;
      }
    });
    
    await moonLabel.evaluate(el => el.click());
    const img = page.locator('#mobile-moon-img');
    await expect(img).toBeHidden();
  });

  test('F4-2-5: Moon click on mobile is ignored if transition is active', async ({ page }) => {
    await page.setViewportSize({ width: 700, height: 800 });
    await page.goto('/?skipIntro=true');
    await page.locator('#labels-container .webgl-label:not(.webgl-label--moon)').first().evaluate(el => el.click());
    const moonLabel = page.locator('#labels-container .webgl-label--moon').first();
    await expect(moonLabel).toBeVisible();
    
    await page.evaluate(() => { window.isTransitioning = true; });
    await moonLabel.evaluate(el => el.click());
    const popup = page.locator('#mobile-moon-popup');
    await expect(popup).not.toHaveClass(/visible/);
  });

  // ==========================================
  // FEATURE 5: Mobile UI & Interactions (5 tests)
  // ==========================================

  test('F5-2-1: Dynamic resize from <=600px to >600px does not throw error', async ({ page }) => {
    await page.setViewportSize({ width: 500, height: 800 });
    await page.goto('/?skipIntro=true');
    
    const errors = [];
    page.on('pageerror', (err) => {
      errors.push(err.message);
    });
    
    await page.setViewportSize({ width: 700, height: 800 });
    await page.waitForTimeout(200);
    expect(errors).toEqual([]);
  });

  test('F5-2-2: Closing mobile bottom sheet unfreezes the moon orbit', async ({ page }) => {
    await page.setViewportSize({ width: 700, height: 800 });
    await page.goto('/?skipIntro=true');
    await page.locator('#labels-container .webgl-label:not(.webgl-label--moon)').first().evaluate(el => el.click());
    const moonLabel = page.locator('#labels-container .webgl-label--moon').first();
    await expect(moonLabel).toBeVisible();
    await moonLabel.evaluate(el => el.click());
    
    const popup = page.locator('#mobile-moon-popup');
    await expect(popup).toHaveClass(/visible/);
    
    await page.locator('#mobile-close-btn').click();
    const isFrozen = await page.evaluate(() => window.hoveredMoon !== null);
    expect(isFrozen).toBe(false);
  });

  test('F5-2-3: Close button click is ignored if transition is active', async ({ page }) => {
    await page.setViewportSize({ width: 700, height: 800 });
    await page.goto('/?skipIntro=true');
    await page.locator('#labels-container .webgl-label:not(.webgl-label--moon)').first().evaluate(el => el.click());
    const moonLabel = page.locator('#labels-container .webgl-label--moon').first();
    await expect(moonLabel).toBeVisible();
    await moonLabel.evaluate(el => el.click());
    
    const popup = page.locator('#mobile-moon-popup');
    await expect(popup).toHaveClass(/visible/);
    
    await page.evaluate(() => { window.isTransitioning = true; });
    await page.locator('#mobile-close-btn').click();
    await expect(popup).toHaveClass(/visible/);
  });

  test('F5-2-4: Closing mobile popup restores camera position to system view', async ({ page }) => {
    await page.setViewportSize({ width: 700, height: 800 });
    await page.goto('/?skipIntro=true');
    await page.locator('#labels-container .webgl-label:not(.webgl-label--moon)').first().evaluate(el => el.click());
    const moonLabel = page.locator('#labels-container .webgl-label--moon').first();
    await expect(moonLabel).toBeVisible();
    await moonLabel.evaluate(el => el.click());
    
    await page.locator('#mobile-close-btn').click();
    await page.waitForTimeout(1000);
    const cameraY = await page.evaluate(() => typeof camera !== 'undefined' ? camera.position.y : null);
    expect(cameraY).toBeCloseTo(250, 0);
  });

  test('F5-2-5: Clicking labels-container non-label element does not trigger event handler', async ({ page }) => {
    await page.goto('/?skipIntro=true');
    const container = page.locator('#labels-container');
    await container.click({ position: { x: 10, y: 10 } });
    const backBtn = page.locator('#galaxy-back-btn');
    await expect(backBtn).not.toHaveClass(/visible/);
  });

});
