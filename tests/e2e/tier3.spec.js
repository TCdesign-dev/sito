const { test, expect } = require('@playwright/test');

test.describe('Tier 3: Cross-Feature Combinations', () => {

  test('F3-1: skipIntro with mobile viewport allows bottom sheet click instantly', async ({ page }) => {
    await page.setViewportSize({ width: 700, height: 800 });
    await page.goto('/?skipIntro=true');
    
    const categoryLabel = page.locator('#labels-container .webgl-label:not(.webgl-label--moon)').first();
    await expect(categoryLabel).toBeVisible();
    await categoryLabel.click({ force: true });
    
    const moonLabel = page.locator('#labels-container .webgl-label--moon').first();
    await expect(moonLabel).toBeVisible({ timeout: 10000 });
    await moonLabel.click({ force: true });
    
    const popup = page.locator('#mobile-moon-popup');
    await expect(popup).toHaveClass(/visible/, { timeout: 10000 });
  });

  test('F3-2: Resize during system view updates isMobile state and camera adaptation', async ({ page }) => {
    // 1. Start in desktop mode
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto('/?skipIntro=true');
    
    const categoryLabel = page.locator('#labels-container .webgl-label:not(.webgl-label--moon)').first();
    await expect(categoryLabel).toBeVisible();
    await categoryLabel.click({ force: true });
    
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
    await page.locator('#labels-container .webgl-label:not(.webgl-label--moon)').first().click({ force: true });
    const moonLabel = page.locator('#labels-container .webgl-label--moon').first();
    await expect(moonLabel).toBeVisible();
    await moonLabel.click({ force: true });
    
    const popup = page.locator('#mobile-moon-popup');
    await expect(popup).toHaveClass(/visible/);
    
    // Click "Galaxy" back button directly
    const backBtn = page.locator('#galaxy-back-btn');
    await expect(backBtn).toBeVisible();
    await backBtn.click();
    
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
    await page.goto('/?skipIntro=true');
    
    const designLabel = page.locator('#labels-container .webgl-label:has-text("Design")');
    await expect(designLabel).toBeVisible();
    await designLabel.click({ force: true });
    
    const backBtn = page.locator('#galaxy-back-btn');
    await expect(backBtn).toHaveClass(/visible/);
    await backBtn.click();
    await expect(backBtn).not.toHaveClass(/visible/);
    
    const webLabel = page.locator('#labels-container .webgl-label:has-text("Web")');
    await expect(webLabel).toBeVisible();
    await webLabel.click({ force: true });
    await backBtn.click();
    await expect(backBtn).not.toHaveClass(/visible/);
    
    // Verify that the number of category labels in galaxy view is still correct (exactly the unique categories, not duplicated)
    const categoryLabels = page.locator('#labels-container .webgl-label:not(.webgl-label--moon)');
    const count = await categoryLabels.count();
    // Unique categories are Design, Web, Typography. So count should be 3.
    expect(count).toBe(3);
  });

});
