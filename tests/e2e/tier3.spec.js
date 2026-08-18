const { test, expect } = require('@playwright/test');
const {
  planetCategories, sampleCategory, projectsIn,
  blockFonts, openGalaxy, clickLabel,
} = require('./helpers');

test.describe('Tier 3: Cross-Feature Combinations', () => {

  test.beforeEach(async ({ page }) => { await blockFonts(page); });

  test('F3-1: skipIntro on a mobile viewport allows an immediate planet tap', async ({ page }) => {
    test.skip(!sampleCategory, 'projects.json has no planet category');
    await page.setViewportSize({ width: 390, height: 800 });
    await openGalaxy(page);
    await clickLabel(page, sampleCategory);
    await page.waitForURL(/category\.html\?cat=/);
    expect(decodeURIComponent(page.url())).toContain(`cat=${sampleCategory}`);
  });

  test('F3-2: Resizing to mobile width updates isMobile and keeps the scene alive', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await openGalaxy(page);
    await page.setViewportSize({ width: 700, height: 800 });
    await page.waitForTimeout(300);
    expect(await page.evaluate(() => isMobile)).toBe(true);
    await expect(page.locator('#webgl-canvas')).toBeVisible();
  });

  test('F3-3: Intro sequence is not interrupted by resizing the window', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto('/');
    await page.setViewportSize({ width: 800, height: 600 });
    await expect(page.locator('#space-header')).toHaveClass(/reveal-header/, { timeout: 12000 });
  });

  test('F3-4: Galaxy renders exactly one label per category, no duplicates', async ({ page }) => {
    await openGalaxy(page);
    // one per planet category, plus the Voyager's "Explorations" label
    const expected = planetCategories.length + (projectsIn('Explorations').length ? 1 : 0);
    await expect(page.locator('#labels-container .webgl-label')).toHaveCount(expected, { timeout: 15000 });
  });

  test('F3-5: Returning from a category page rebuilds the galaxy cleanly', async ({ page }) => {
    test.skip(!sampleCategory, 'projects.json has no planet category');
    await openGalaxy(page);
    await clickLabel(page, sampleCategory);
    await page.waitForURL(/category\.html\?cat=/);

    // Back to the galaxy via the page's own back link
    await page.locator('a.project-back').click();
    await page.waitForURL(/skipIntro=true/);
    await page.waitForFunction(
      () => typeof planetsData !== 'undefined' &&
            planetsData.some(p => p.mesh.userData.isCategory),
      null,
      { timeout: 20000 }
    );
    const expected = planetCategories.length + (projectsIn('Explorations').length ? 1 : 0);
    await expect(page.locator('#labels-container .webgl-label')).toHaveCount(expected, { timeout: 15000 });
  });

});
