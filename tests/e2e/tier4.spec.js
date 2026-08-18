const { test, expect } = require('@playwright/test');
const {
  sampleCategory, sampleProject, projectsIn,
  blockFonts, openGalaxy, clickLabel,
} = require('./helpers');

test.describe('Tier 4: Real-World Application Scenarios', () => {

  test.beforeEach(async ({ page }) => { await blockFonts(page); });

  test('F4-Scenario-1: Full Desktop Navigation Journey', async ({ page }) => {
    test.skip(!sampleProject, 'projects.json has no project with a page');

    // 1. Land on the site and sit through the intro
    await page.goto('/');
    const intro = page.locator('#intro-screen');
    await expect(intro).toBeAttached();
    await expect(intro).not.toBeAttached({ timeout: 12000 });
    const header = page.locator('#space-header');
    await expect(header).toHaveClass(/reveal-header/, { timeout: 12000 });

    // 2. Click the category planet -> its list page
    await clickLabel(page, sampleCategory);
    await page.waitForURL(/category\.html\?cat=/);
    await expect(page.locator('#category-title')).toHaveText(sampleCategory);

    // 3. Open a project from the list
    await page.locator(`.exploration-card:has-text("${sampleProject.name}")`).first().click();
    await page.waitForURL(new RegExp(`project\\.html\\?id=${sampleProject.id}`));
    await expect(page.locator('h1.project-title')).toHaveText(sampleProject.name);

    // 4. Back link returns to the category list
    await page.locator('a.project-back').click();
    await page.waitForURL(/category\.html\?cat=/);
    await expect(page.locator('#category-title')).toHaveText(sampleCategory);

    // 5. And from there back to the galaxy
    await page.locator('a.project-back').click();
    await page.waitForURL(/skipIntro=true/);
    await expect(page.locator('#webgl-canvas')).toBeVisible();
  });

  test('F4-Scenario-2: Full Mobile Navigation Journey', async ({ page }) => {
    test.skip(!sampleProject, 'projects.json has no project with a page');
    await page.setViewportSize({ width: 390, height: 800 });

    await openGalaxy(page);
    await clickLabel(page, sampleCategory);
    await page.waitForURL(/category\.html\?cat=/);

    const cards = page.locator('.exploration-card');
    await expect(cards).toHaveCount(projectsIn(sampleCategory).length);

    await page.locator(`.exploration-card:has-text("${sampleProject.name}")`).first().click();
    await page.waitForURL(new RegExp(`project\\.html\\?id=${sampleProject.id}`));
    await expect(page.locator('h1.project-title')).toHaveText(sampleProject.name);
  });

  test('F4-Scenario-3: Explorations journey through the Voyager', async ({ page }) => {
    const explorations = projectsIn('Explorations');
    test.skip(!explorations.length, 'projects.json has no explorations');

    await openGalaxy(page);
    await clickLabel(page, 'Explorations');
    await page.waitForURL(/explorations/);

    // The live server rewrites /explorations; the bare test server does not,
    // so load the file directly to check the list itself.
    await page.goto('/explorations.html');
    await expect(page.locator('.exploration-card')).toHaveCount(explorations.length);
  });

  test('F4-Scenario-4: Multi-orientation Resize Stability', async ({ page }) => {
    await page.setViewportSize({ width: 700, height: 800 });
    await openGalaxy(page);

    await page.setViewportSize({ width: 800, height: 600 });
    await page.waitForTimeout(200);
    await expect(page.locator('#webgl-canvas')).toBeVisible();
    await expect(page.locator('#labels-container .webgl-label').first()).toBeVisible();

    await page.setViewportSize({ width: 700, height: 800 });
    await page.waitForTimeout(200);
    await expect(page.locator('#webgl-canvas')).toBeVisible();
    await expect(page.locator('#labels-container .webgl-label').first()).toBeVisible();
  });

  test('F4-Scenario-5: Invalid routes redirect to /404', async ({ page }) => {
    await page.goto('/project.html?id=nonexistent-project');
    await page.waitForURL(/\/404/);

    await page.goto('/category.html?cat=nonexistent-category');
    await page.waitForURL(/\/404/);
    expect(new URL(page.url()).pathname).toBe('/404');
  });

});
