const { test, expect } = require('@playwright/test');
const {
  sampleCategory, sampleProject, projectsIn,
  blockFonts, openGalaxy, clickLabel,
} = require('./helpers');

test.describe('Tier 1: Feature Coverage', () => {

  test.beforeEach(async ({ page }) => { await blockFonts(page); });

  // ==========================================
  // FEATURE 1: Intro Sequence & Liveness
  // ==========================================

  test('F1-1: Intro screen is attached to DOM on initial load', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#intro-screen')).toBeAttached();
  });

  test('F1-2: Intro title displays correct user name', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#intro-screen .intro-title')).toHaveText('Tommaso Costanza');
  });

  test('F1-3: skipIntro=true bypasses the intro screen immediately', async ({ page }) => {
    await page.goto('/?skipIntro=true');
    await expect(page.locator('#intro-screen')).not.toBeAttached();
  });

  test('F1-4: skipIntro=true immediately reveals the space header', async ({ page }) => {
    await page.goto('/?skipIntro=true');
    await expect(page.locator('#space-header')).toHaveClass(/reveal-header/);
  });

  test('F1-5: Footer copyright year is populated and current', async ({ page }) => {
    await page.goto('/?skipIntro=true');
    await expect(page.locator('.copyright-year'))
      .toHaveText(new Date().getFullYear().toString());
  });

  // ==========================================
  // FEATURE 2: 3D Solar System View
  // ==========================================

  test('F2-1: WebGL canvas is visible on desktop viewports', async ({ page }) => {
    await page.goto('/?skipIntro=true');
    await expect(page.locator('#webgl-canvas')).toBeVisible();
  });

  test('F2-2: Labels container is present on desktop viewports', async ({ page }) => {
    await page.goto('/?skipIntro=true');
    await expect(page.locator('#labels-container')).toBeAttached();
  });

  test('F2-3: Star field background is present and visible', async ({ page }) => {
    await page.goto('/?skipIntro=true');
    await expect(page.locator('#space-bg')).toBeVisible();
  });

  test('F2-4: Category planet labels are rendered', async ({ page }) => {
    await openGalaxy(page);
    const labels = page.locator('#labels-container .webgl-label');
    await expect(labels.first()).toBeVisible({ timeout: 10000 });
    expect(await labels.count()).toBeGreaterThan(0);
  });

  test('F2-5: Scene is rendered pixelated — low-res buffer, full-size canvas', async ({ page }) => {
    await openGalaxy(page);
    const canvas = await page.evaluate(() => {
      const c = document.getElementById('webgl-canvas');
      return {
        ratio: c.clientWidth / c.width,
        imageRendering: getComputedStyle(c).imageRendering,
      };
    });
    // PIXEL_SIZE in main.js — the buffer is 1/3 of the CSS size
    expect(canvas.ratio).toBeGreaterThan(2.5);
    expect(canvas.ratio).toBeLessThan(3.5);
    expect(canvas.imageRendering).toBe('pixelated');
  });

  // ==========================================
  // FEATURE 3: Category Navigation
  // ==========================================

  test('F3-1: Clicking a category planet opens its category page', async ({ page }) => {
    test.skip(!sampleCategory, 'projects.json has no planet category');
    await openGalaxy(page);
    await clickLabel(page, sampleCategory);
    await page.waitForURL(/category\.html\?cat=/);
    expect(decodeURIComponent(page.url())).toContain(`cat=${sampleCategory}`);
  });

  test('F3-2: Category page headline is the category name', async ({ page }) => {
    test.skip(!sampleCategory, 'projects.json has no planet category');
    await page.goto(`/category.html?cat=${encodeURIComponent(sampleCategory)}`);
    await expect(page.locator('#category-title')).toHaveText(sampleCategory);
    await expect(page).toHaveTitle(new RegExp(sampleCategory));
  });

  test('F3-3: Category page lists every project of that category', async ({ page }) => {
    test.skip(!sampleCategory, 'projects.json has no planet category');
    await page.goto(`/category.html?cat=${encodeURIComponent(sampleCategory)}`);
    const cards = page.locator('.exploration-card');
    await expect(cards).toHaveCount(projectsIn(sampleCategory).length);
  });

  test('F3-4: Category cards link to their project page', async ({ page }) => {
    test.skip(!sampleProject, 'projects.json has no project with a page');
    await page.goto(`/category.html?cat=${encodeURIComponent(sampleCategory)}`);
    const card = page.locator(`.exploration-card:has-text("${sampleProject.name}")`).first();
    await expect(card).toHaveAttribute('href', `/project.html?id=${sampleProject.id}`);
  });

  test('F3-5: The Voyager links to the Explorations list', async ({ page }) => {
    await openGalaxy(page);
    await clickLabel(page, 'Explorations');
    await page.waitForURL(/explorations/);
    expect(page.url()).toContain('/explorations');
  });

  // ==========================================
  // FEATURE 4: Project & List Pages
  // ==========================================

  test('F4-1: Project page renders the project from ?id=', async ({ page }) => {
    test.skip(!sampleProject, 'projects.json has no project with a page');
    await page.goto(`/project.html?id=${sampleProject.id}`);
    await expect(page.locator('h1.project-title')).toHaveText(sampleProject.name);
  });

  test('F4-2: Project page links back to its category', async ({ page }) => {
    test.skip(!sampleProject, 'projects.json has no project with a page');
    await page.goto(`/project.html?id=${sampleProject.id}`);
    const back = page.locator('a.project-back');
    await expect(back).toHaveAttribute(
      'href', `/category.html?cat=${encodeURIComponent(sampleProject.category)}`);
  });

  test('F4-3: Explorations page lists the explorations', async ({ page }) => {
    await page.goto('/explorations.html');
    const expected = projectsIn('Explorations').length;
    if (expected) await expect(page.locator('.exploration-card')).toHaveCount(expected);
    else await expect(page.locator('.explorations-list')).toContainText('No explorations');
  });

  test('F4-4: Unknown category redirects to /404', async ({ page }) => {
    await page.goto('/category.html?cat=definitely-not-a-category');
    await page.waitForURL(/\/404/);
    expect(new URL(page.url()).pathname).toBe('/404');
  });

  test('F4-5: Category page without ?cat= redirects to /404', async ({ page }) => {
    await page.goto('/category.html');
    await page.waitForURL(/\/404/);
    expect(new URL(page.url()).pathname).toBe('/404');
  });

  // ==========================================
  // FEATURE 5: Mobile
  // ==========================================

  test('F5-1: WebGL canvas is initialized on narrow viewports', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await page.goto('/?skipIntro=true');
    await expect(page.locator('#webgl-canvas')).toBeVisible();
  });

  test('F5-2: WebGL canvas is initialized above the mobile breakpoint', async ({ page }) => {
    await page.setViewportSize({ width: 900, height: 800 });
    await page.goto('/?skipIntro=true');
    await expect(page.locator('#webgl-canvas')).toBeVisible();
  });

  test('F5-3: Category labels are reachable on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await openGalaxy(page);
    await expect(page.locator('#labels-container .webgl-label').first()).toBeVisible();
  });

  test('F5-4: Tapping a planet on mobile opens the category page', async ({ page }) => {
    test.skip(!sampleCategory, 'projects.json has no planet category');
    await page.setViewportSize({ width: 390, height: 800 });
    await openGalaxy(page);
    await clickLabel(page, sampleCategory);
    await page.waitForURL(/category\.html\?cat=/);
    expect(decodeURIComponent(page.url())).toContain(`cat=${sampleCategory}`);
  });

  test('F5-5: Mobile renders the same pixelated buffer', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await openGalaxy(page);
    const ratio = await page.evaluate(() => {
      const c = document.getElementById('webgl-canvas');
      return c.clientWidth / c.width;
    });
    expect(ratio).toBeGreaterThan(2.5);
    expect(ratio).toBeLessThan(3.5);
  });

});
