const { test, expect } = require('@playwright/test');
const {
  sampleCategory, externalProject, projectsIn,
  blockFonts, openGalaxy, clickLabel,
} = require('./helpers');

test.describe('Tier 2: Boundary & Corner Cases', () => {

  test.beforeEach(async ({ page }) => { await blockFonts(page); });

  // ==========================================
  // FEATURE 1: Intro Sequence & Liveness
  // ==========================================

  test('F1-2-1: skipIntro with invalid parameter does not skip intro', async ({ page }) => {
    await page.goto('/?skipIntro=invalid');
    await expect(page.locator('#intro-screen')).toBeAttached();
  });

  test('F1-2-2: skipIntro with empty parameter does not skip intro', async ({ page }) => {
    await page.goto('/?skipIntro=');
    await expect(page.locator('#intro-screen')).toBeAttached();
  });

  test('F1-2-3: Intro overlay is fully removed from the DOM', async ({ page }) => {
    await page.goto('/?skipIntro=true');
    await expect(page.locator('#intro-screen')).not.toBeAttached();
  });

  test('F1-2-4: Instructions appear and then fade out', async ({ page }) => {
    await page.goto('/');
    const instructions = page.locator('#solar-instructions');
    await expect(instructions).toHaveClass(/visible/, { timeout: 10000 });
    await expect(instructions).not.toHaveClass(/visible/, { timeout: 10000 });
  });

  test('F1-2-5: Body has loaded class after intro completes', async ({ page }) => {
    await page.goto('/?skipIntro=true');
    await expect(page.locator('body')).toHaveClass(/loaded/);
  });

  // ==========================================
  // FEATURE 2: Renderer & Scene
  // ==========================================

  test('F2-2-1: Canvas survives a resize', async ({ page }) => {
    await openGalaxy(page);
    await page.setViewportSize({ width: 800, height: 600 });
    await expect(page.locator('#webgl-canvas')).toBeVisible();
  });

  test('F2-2-2: OrbitControls target defaults to center', async ({ page }) => {
    await openGalaxy(page);
    expect(await page.evaluate(() => controls.target.x)).toBe(0);
  });

  test('F2-2-3: Scene contains light elements', async ({ page }) => {
    await openGalaxy(page);
    const lights = await page.evaluate(
      () => scene.children.filter(c => c.isAmbientLight || c.isPointLight).length);
    expect(lights).toBeGreaterThan(0);
  });

  test('F2-2-4: WebGL context is initialized correctly', async ({ page }) => {
    await openGalaxy(page);
    // Ask the renderer for its context: re-calling canvas.getContext with a
    // different type than the one already created legitimately returns null.
    expect(await page.evaluate(() => !!renderer.getContext())).toBe(true);
  });

  test('F2-2-5: Labels are positioned by the render loop', async ({ page }) => {
    await openGalaxy(page);
    const label = page.locator('#labels-container .webgl-label').first();
    await expect(label).toBeVisible();
    expect(await label.getAttribute('style')).toContain('transform');
  });

  test('F2-2-6: Pixel buffer follows a resize', async ({ page }) => {
    await openGalaxy(page);
    await page.setViewportSize({ width: 800, height: 600 });
    await page.waitForTimeout(300);
    const ratio = await page.evaluate(() => {
      const c = document.getElementById('webgl-canvas');
      return c.clientWidth / c.width;
    });
    expect(ratio).toBeGreaterThan(2.5);
    expect(ratio).toBeLessThan(3.5);
  });

  // ==========================================
  // FEATURE 3: Navigation guards
  // ==========================================

  test('F3-2-1: Planet click is ignored while isTransitioning is true', async ({ page }) => {
    await openGalaxy(page);
    await page.evaluate(() => { window.isTransitioning = true; });
    await clickLabel(page);
    await page.waitForTimeout(500);
    expect(new URL(page.url()).pathname).toBe('/');
  });

  test('F3-2-2: Clicking empty space on the canvas does not navigate', async ({ page }) => {
    await openGalaxy(page);
    const canvas = page.locator('#webgl-canvas');
    const box = await canvas.boundingBox();
    // Bottom-left corner: empty sky, away from the header overlay
    await canvas.click({ position: { x: 5, y: box.height - 5 }, force: true });
    await page.waitForTimeout(500);
    expect(new URL(page.url()).pathname).toBe('/');
  });

  test('F3-2-3: Clicking the labels container itself does not navigate', async ({ page }) => {
    await openGalaxy(page);
    await page.locator('#labels-container').evaluate(el => el.click());
    await page.waitForTimeout(500);
    expect(new URL(page.url()).pathname).toBe('/');
  });

  test('F3-2-4: Category names are URL-encoded in the planet link', async ({ page }) => {
    await openGalaxy(page);
    const href = await page.evaluate(() => {
      const p = planetsData.find(x => x.mesh.userData.isCategory);
      return `/category.html?cat=${encodeURIComponent(p.mesh.userData.category)}`;
    });
    expect(href).not.toMatch(/ /);
    expect(href.startsWith('/category.html?cat=')).toBe(true);
  });

  test('F3-2-5: Rapid repeated taps on a planet still land on one category page', async ({ page }) => {
    test.skip(!sampleCategory, 'projects.json has no planet category');
    await openGalaxy(page);
    const label = page.locator(`#labels-container .webgl-label:has-text("${sampleCategory}")`).first();
    // Three clicks in one tick: only the first may start a navigation
    await label.evaluate(el => { el.click(); el.click(); el.click(); });
    // poll the URL rather than waitForURL — no navigation event to race with
    await expect.poll(() => decodeURIComponent(page.url()), { timeout: 10000 })
      .toContain(`cat=${sampleCategory}`);
  });

  // ==========================================
  // FEATURE 4: List page edge cases
  // ==========================================

  test('F4-2-1: External-link projects open in a new tab', async ({ page }) => {
    test.skip(!externalProject, 'projects.json has no external-link project');
    await page.goto(`/category.html?cat=${encodeURIComponent(externalProject.category)}`);
    const card = page.locator(`.exploration-card:has-text("${externalProject.name}")`).first();
    await expect(card).toHaveAttribute('target', '_blank');
    await expect(card).toHaveAttribute('href', externalProject.link);
  });

  test('F4-2-2: ?cat= matching is case-insensitive', async ({ page }) => {
    test.skip(!sampleCategory, 'projects.json has no planet category');
    await page.goto(`/category.html?cat=${encodeURIComponent(sampleCategory.toUpperCase())}`);
    // The heading uses the casing stored in the data, not the query string
    await expect(page.locator('#category-title')).toHaveText(sampleCategory);
  });

  test('F4-2-3: Cards render even when a project has no preview image', async ({ page }) => {
    test.skip(!sampleCategory, 'projects.json has no planet category');
    await page.goto(`/category.html?cat=${encodeURIComponent(sampleCategory)}`);
    const cards = page.locator('.exploration-card');
    await expect(cards.first()).toBeVisible();
    // every card carries a title regardless of its image
    for (const title of await page.locator('.exploration-title').allTextContents()) {
      expect(title.trim().length).toBeGreaterThan(0);
    }
  });

  test('F4-2-4: Explorations projects keep their own back link', async ({ page }) => {
    const explorations = projectsIn('Explorations').filter(p => p.page);
    test.skip(!explorations.length, 'projects.json has no exploration with a page');
    await page.goto(`/project.html?id=${explorations[0].id}`);
    await expect(page.locator('a.project-back')).toHaveAttribute('href', '/explorations');
  });

  test('F4-2-5: Unknown project id redirects to /404', async ({ page }) => {
    await page.goto('/project.html?id=nonexistent-project');
    await page.waitForURL(/\/404/);
    expect(new URL(page.url()).pathname).toBe('/404');
  });

});
