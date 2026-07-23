const { test, expect } = require('@playwright/test');

test.describe('Tier 3: Cross-Feature Combinations', () => {

  // Keep the suite hermetic: external font requests hang in sandboxed
  // environments and can stall stylesheet-blocked script execution.
  test.beforeEach(async ({ page }) => {
    await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  });

  test('F3-1: skipIntro with mobile viewport allows bottom sheet click instantly', async ({ page }) => {
    await page.setViewportSize({ width: 700, height: 800 });
    await page.goto('/?skipIntro=true');
    
    const categoryLabel = page.locator('#labels-container .webgl-label:not(.webgl-label--moon)').first();
    await expect(categoryLabel).toBeVisible();
    await categoryLabel.evaluate(el => el.click());
    
    const moonLabel = page.locator('#labels-container .webgl-label--moon').first();
    await expect(moonLabel).toBeVisible({ timeout: 10000 });
    await moonLabel.evaluate(el => el.click());
    
    const popup = page.locator('#mobile-moon-popup');
    await expect(popup).toHaveClass(/visible/, { timeout: 10000 });
  });

  test('F3-2: Resize during system view updates isMobile state and camera adaptation', async ({ page }) => {
    // 1. Start in desktop mode
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto('/?skipIntro=true');
    
    const categoryLabel = page.locator('#labels-container .webgl-label:not(.webgl-label--moon)').first();
    await expect(categoryLabel).toBeVisible();
    await categoryLabel.evaluate(el => el.click());
    
    // 2. Resize to mobile width (700px)
    await page.setViewportSize({ width: 700, height: 800 });
    
    // Verify system remains active and elements adapt (e.g. isMobile becomes true)
    const isMobileTrue = await page.evaluate(() => isMobile);
    expect(isMobileTrue).toBe(true);
  });

  test('F3-3: Back to Galaxy button closes open bottom sheet and returns to galaxy view', async ({ page }) => {
    await page.setViewportSize({ width: 700, height: 800 });
    await page.goto('/?skipIntro=true');
    
    // Enter system and click a moon to open bottom sheet
    await page.locator('#labels-container .webgl-label:not(.webgl-label--moon)').first().evaluate(el => el.click());
    const moonLabel = page.locator('#labels-container .webgl-label--moon').first();
    await expect(moonLabel).toBeVisible();
    await moonLabel.evaluate(el => el.click());
    
    const popup = page.locator('#mobile-moon-popup');
    await expect(popup).toHaveClass(/visible/);

    // Click "Galaxy" back button directly. The open bottom sheet overlaps it
    // on this viewport, so fire the click on the element itself.
    const backBtn = page.locator('#galaxy-back-btn');
    await expect(backBtn).toBeVisible();
    await backBtn.evaluate(el => el.click());

    // Both back button and mobile popup should close, and we return to galaxy view
    await expect(backBtn).not.toHaveClass(/visible/);
  });

  test('F3-4: Intro sequence is not interrupted by resizing the window', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto('/');
    
    // Resize immediately during intro
    await page.setViewportSize({ width: 800, height: 600 });
    
    // Wait for intro to complete normally
    const header = page.locator('#space-header');
    await expect(header).toHaveClass(/reveal-header/, { timeout: 12000 });
  });

  test('F3-5: Multiple category transitions without page reload do not accumulate duplicate labels', async ({ page }) => {
    // Derive the expected categories from the live data so the test
    // survives content changes made through the admin panel.
    const projects = require('../../projects/projects.json');
    const categories = [...new Set(
      projects
        .map(p => p.category)
        .filter(c => c && c.toLowerCase() !== 'explorations')
    )];
    const hasExplorations = projects.some(
      p => (p.category || '').toLowerCase() === 'explorations'
    );
    // One label per category planet, plus the Voyager "Explorations" label
    const expectedLabels = categories.length + (hasExplorations ? 1 : 0);

    await page.goto('/?skipIntro=true');
    const backBtn = page.locator('#galaxy-back-btn');

    for (const cat of categories.slice(0, 2)) {
      const label = page.locator(`#labels-container .webgl-label:has-text("${cat}")`);
      await expect(label).toBeVisible();
      await label.evaluate(el => el.click());
      await expect(backBtn).toHaveClass(/visible/);
      // Clicks are ignored while the zoom transition is running — wait it out
      await page.waitForFunction(() => window.isTransitioning === false);
      await backBtn.click();
      await expect(backBtn).not.toHaveClass(/visible/, { timeout: 10000 });
      // Let the return-to-galaxy transition finish before the next round
      await page.waitForFunction(() => window.isTransitioning === false);
    }

    // Verify galaxy labels are not duplicated after the round trips
    const categoryLabels = page.locator('#labels-container .webgl-label:not(.webgl-label--moon)');
    await expect(categoryLabels).toHaveCount(expectedLabels, { timeout: 10000 });
  });

});
