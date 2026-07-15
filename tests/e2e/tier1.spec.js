const { test, expect } = require('@playwright/test');

test.describe('Tier 1: Feature Coverage', () => {

  // ==========================================
  // FEATURE 1: Intro Sequence & Liveness (5 tests)
  // ==========================================

  test('F1-1: Intro screen is attached to DOM on initial load', async ({ page }) => {
    await page.goto('/');
    const intro = page.locator('#intro-screen');
    await expect(intro).toBeAttached();
  });

  test('F1-2: Intro title displays correct user name', async ({ page }) => {
    await page.goto('/');
    const title = page.locator('#intro-screen .intro-title');
    await expect(title).toHaveText('Tommaso Costanza');
  });

  test('F1-3: skipIntro=true bypasses the intro screen immediately', async ({ page }) => {
    await page.goto('/?skipIntro=true');
    const intro = page.locator('#intro-screen');
    await expect(intro).not.toBeAttached();
  });

  test('F1-4: skipIntro=true immediately reveals the space header', async ({ page }) => {
    await page.goto('/?skipIntro=true');
    const header = page.locator('#space-header');
    await expect(header).toHaveClass(/reveal-header/);
  });

  test('F1-5: Footer copyright year is populated and current', async ({ page }) => {
    await page.goto('/?skipIntro=true');
    const copyright = page.locator('.copyright-year');
    const currentYear = new Date().getFullYear().toString();
    await expect(copyright).toHaveText(currentYear);
  });

  // ==========================================
  // FEATURE 2: 3D Solar System View (5 tests)
  // ==========================================

  test('F2-1: WebGL canvas is visible on desktop viewports', async ({ page }) => {
    await page.goto('/?skipIntro=true');
    const canvas = page.locator('#webgl-canvas');
    await expect(canvas).toBeVisible();
  });

  test('F2-2: Labels container is present on desktop viewports', async ({ page }) => {
    await page.goto('/?skipIntro=true');
    const container = page.locator('#labels-container');
    await expect(container).toBeAttached();
  });

  test('F2-3: Star field background is present and visible', async ({ page }) => {
    await page.goto('/?skipIntro=true');
    const bg = page.locator('#space-bg');
    await expect(bg).toBeVisible();
  });

  test('F2-4: Category planet labels are rendered', async ({ page }) => {
    await page.goto('/?skipIntro=true');
    const categoryLabels = page.locator('#labels-container .webgl-label:not(.webgl-label--moon)');
    // Wait for the labels to populate
    await expect(categoryLabels.first()).toBeVisible({ timeout: 10000 });
    const count = await categoryLabels.count();
    expect(count).toBeGreaterThan(0);
  });

  test('F2-5: Desktop moon popup is hidden on initial load', async ({ page }) => {
    await page.goto('/?skipIntro=true');
    const popup = page.locator('#moon-popup');
    await expect(popup).not.toHaveClass(/visible/);
  });

  // ==========================================
  // FEATURE 3: Planet/System Navigation (5 tests)
  // ==========================================

  test('F3-1: Galaxy back button is hidden on initial load', async ({ page }) => {
    await page.goto('/?skipIntro=true');
    const backBtn = page.locator('#galaxy-back-btn');
    await expect(backBtn).not.toHaveClass(/visible/);
  });

  test('F3-2: Clicking category planet reveals galaxy back button', async ({ page }) => {
    await page.goto('/?skipIntro=true');
    const categoryLabel = page.locator('#labels-container .webgl-label:not(.webgl-label--moon)').first();
    await expect(categoryLabel).toBeVisible();
    await categoryLabel.evaluate(el => el.click());
    const backBtn = page.locator('#galaxy-back-btn');
    await expect(backBtn).toHaveClass(/visible/, { timeout: 10000 });
  });

  test('F3-3: Entering system view hides hero bio section', async ({ page }) => {
    await page.goto('/?skipIntro=true');
    const categoryLabel = page.locator('#labels-container .webgl-label:not(.webgl-label--moon)').first();
    await expect(categoryLabel).toBeVisible();
    await categoryLabel.evaluate(el => el.click());
    const bioWrap = page.locator('.hero-bio-wrap');
    await expect(bioWrap).toBeHidden();
  });

  test('F3-4: Clicking back button restores hero bio section', async ({ page }) => {
    await page.goto('/?skipIntro=true');
    const categoryLabel = page.locator('#labels-container .webgl-label:not(.webgl-label--moon)').first();
    await expect(categoryLabel).toBeVisible();
    await categoryLabel.evaluate(el => el.click());
    
    const backBtn = page.locator('#galaxy-back-btn');
    await expect(backBtn).toHaveClass(/visible/);
    // Clicks are ignored while the zoom transition is running — wait it out
    await page.waitForFunction(() => window.isTransitioning === false);
    await backBtn.click();

    const bioWrap = page.locator('.hero-bio-wrap');
    await expect(bioWrap).toBeVisible();
  });

  test('F3-5: Project moons are rendered when entering system view', async ({ page }) => {
    await page.goto('/?skipIntro=true');
    const categoryLabel = page.locator('#labels-container .webgl-label:not(.webgl-label--moon)').first();
    await expect(categoryLabel).toBeVisible();
    await categoryLabel.evaluate(el => el.click());
    
    const moonLabel = page.locator('#labels-container .webgl-label--moon');
    await expect(moonLabel.first()).toBeVisible({ timeout: 10000 });
    const count = await moonLabel.count();
    expect(count).toBeGreaterThan(0);
  });

  // ==========================================
  // FEATURE 4: Moon Selection & Bottom Sheet (5 tests)
  // ==========================================

  test('F4-1: Mobile bottom sheet popup is hidden on initial load', async ({ page }) => {
    await page.goto('/?skipIntro=true');
    const popup = page.locator('#mobile-moon-popup');
    await expect(popup).not.toHaveClass(/visible/);
  });

  test('F4-2: Clicking moon label on mobile reveals bottom sheet popup', async ({ page }) => {
    // Set mobile viewport (ThreeJS initialized for width > 600px)
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

  test('F4-3: Bottom sheet contains correct project details content', async ({ page }) => {
    await page.setViewportSize({ width: 700, height: 800 });
    await page.goto('/?skipIntro=true');
    
    // Enter category and click first moon
    await page.locator('#labels-container .webgl-label:not(.webgl-label--moon)').first().evaluate(el => el.click());
    const moonLabel = page.locator('#labels-container .webgl-label--moon').first();
    await expect(moonLabel).toBeVisible();
    const expectedTitle = await moonLabel.textContent();
    await moonLabel.evaluate(el => el.click());
    
    const titleEl = page.locator('#mobile-moon-title');
    const descEl = page.locator('#mobile-moon-desc');
    await expect(titleEl).toHaveText(expectedTitle || '');
    await expect(descEl).not.toBeEmpty();
  });

  test('F4-4: Explore button links to project details or external page', async ({ page }) => {
    await page.setViewportSize({ width: 700, height: 800 });
    await page.goto('/?skipIntro=true');
    
    await page.locator('#labels-container .webgl-label:not(.webgl-label--moon)').first().evaluate(el => el.click());
    const moonLabel = page.locator('#labels-container .webgl-label--moon').first();
    await expect(moonLabel).toBeVisible();
    await moonLabel.evaluate(el => el.click());
    
    const exploreBtn = page.locator('#mobile-explore-btn');
    await expect(exploreBtn).toHaveAttribute('href', /project\.html\?id=/);
  });

  test('F4-5: Clicking moon label on desktop navigates to details page', async ({ page }) => {
    await page.goto('/?skipIntro=true');
    
    await page.locator('#labels-container .webgl-label:not(.webgl-label--moon)').first().evaluate(el => el.click());
    const moonLabel = page.locator('#labels-container .webgl-label--moon').first();
    await expect(moonLabel).toBeVisible();
    
    // Click moon on desktop - redirects to project.html
    await moonLabel.evaluate(el => el.click());
    await page.waitForURL(/\/project\.html\?id=/);
    expect(page.url()).toContain('project.html?id=');
  });

  // ==========================================
  // FEATURE 5: Mobile UI & Interactions (5 tests)
  // ==========================================

  test('F5-1: WebGL canvas is initialized when width <= 600px', async ({ page }) => {
    await page.setViewportSize({ width: 500, height: 800 });
    await page.goto('/?skipIntro=true');
    const canvas = page.locator('#webgl-canvas');
    await expect(canvas).toBeVisible();
  });

  test('F5-2: Mobile category title is visible when moon is selected', async ({ page }) => {
    await page.setViewportSize({ width: 700, height: 800 });
    await page.goto('/?skipIntro=true');
    
    await page.locator('#labels-container .webgl-label:not(.webgl-label--moon)').first().evaluate(el => el.click());
    const moonLabel = page.locator('#labels-container .webgl-label--moon').first();
    await expect(moonLabel).toBeVisible();
    await moonLabel.evaluate(el => el.click());
    
    const categoryTitle = page.locator('#mobile-category-title');
    await expect(categoryTitle).toHaveClass(/visible/);
  });

  test('F5-3: Close button dismisses the mobile bottom sheet popup', async ({ page }) => {
    await page.setViewportSize({ width: 700, height: 800 });
    await page.goto('/?skipIntro=true');
    
    await page.locator('#labels-container .webgl-label:not(.webgl-label--moon)').first().evaluate(el => el.click());
    const moonLabel = page.locator('#labels-container .webgl-label--moon').first();
    await expect(moonLabel).toBeVisible();
    await moonLabel.evaluate(el => el.click());
    
    const popup = page.locator('#mobile-moon-popup');
    await expect(popup).toHaveClass(/visible/);
    
    await page.locator('#mobile-close-btn').click();
    await expect(popup).not.toHaveClass(/visible/);
  });

  test('F5-4: Close button hides the mobile category title', async ({ page }) => {
    await page.setViewportSize({ width: 700, height: 800 });
    await page.goto('/?skipIntro=true');
    
    await page.locator('#labels-container .webgl-label:not(.webgl-label--moon)').first().evaluate(el => el.click());
    const moonLabel = page.locator('#labels-container .webgl-label--moon').first();
    await expect(moonLabel).toBeVisible();
    await moonLabel.evaluate(el => el.click());
    
    const categoryTitle = page.locator('#mobile-category-title');
    await expect(categoryTitle).toHaveClass(/visible/);
    
    await page.locator('#mobile-close-btn').click();
    await expect(categoryTitle).not.toHaveClass(/visible/);
  });

  test('F5-5: WebGL canvas is initialized when width is above 600px', async ({ page }) => {
    await page.setViewportSize({ width: 601, height: 800 });
    await page.goto('/?skipIntro=true');
    const canvas = page.locator('#webgl-canvas');
    await expect(canvas).toBeVisible();
  });

});
