const { test, expect } = require('@playwright/test');

test.describe('Tier 1: Smoke & Liveness Testing', () => {
  test.beforeEach(async ({ page }) => {
    // Listen for console errors
    page.on('pageerror', (err) => {
      expect(err.message).not.toContain('Exception');
    });
  });

  test('should load the page and run basic setup', async ({ page }) => {
    await page.goto('/');

    // Check title
    await expect(page).toHaveTitle(/Tommaso Costanza/);

    // Verify intro screen is shown and eventually removed
    const intro = page.locator('#intro-screen');
    await expect(intro).toBeAttached();
    // Wait for the intro screen to be removed (DOMContentLoaded logic in main.js)
    await expect(intro).not.toBeAttached({ timeout: 10000 });

    // Verify biography header is displayed
    const bio = page.locator('.hero-bio');
    await expect(bio).toBeVisible();

    // Verify copyright year in footer is updated to current year
    const currentYear = new Date().getFullYear().toString();
    const copyright = page.locator('.copyright-year');
    await expect(copyright).toHaveText(currentYear);
  });
});

test.describe('Tier 2: Core User Flows (Desktop Viewport)', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('should navigate from Galaxy View to System View, and then to Project Detail', async ({ page }) => {
    await page.goto('/?skipIntro=true'); // Use query param to skip intro transitions

    // Verify WebGL Canvas is present
    const canvas = page.locator('#webgl-canvas');
    await expect(canvas).toBeVisible();

    // Verify labels are populated (e.g. at least one category label)
    const label = page.locator('#labels-container .webgl-label').first();
    await expect(label).toBeVisible({ timeout: 5000 });

    // Click on a category label to transition to the system view
    const categoryName = await label.textContent();
    await label.click();

    // Verify that the back button becomes visible
    const backBtn = page.locator('#galaxy-back-btn');
    await expect(backBtn).toHaveClass(/visible/);

    // Verify system moons have been loaded and labels are visible
    const moonLabel = page.locator('#labels-container .webgl-label--moon').first();
    await expect(moonLabel).toBeVisible({ timeout: 5000 });

    // Click on a moon to navigate to details page
    const moonName = await moonLabel.textContent();
    await moonLabel.click();

    // Verify navigation to project.html
    await page.waitForURL(/\/project\.html\?id=/);
    await expect(page).toHaveTitle(new RegExp(moonName));

    // Verify project detail content loads
    const projectTitle = page.locator('.project-title');
    await expect(projectTitle).toHaveText(moonName);

    // Go back using the detail page back button
    const detailBackBtn = page.locator('.project-back');
    await detailBackBtn.click();

    // Verify we are back on index.html with skipIntro
    await page.waitForURL(/\/index\.html\?skipIntro=true/);
  });
});

test.describe('Tier 3: Mobile Responsiveness & Touch Interactions', () => {
  // Pixel 5 emulation is configured in playwright.config.js (width: 393px)
  
  test('should not initialize 3D canvas on mobile width <= 600', async ({ page }) => {
    await page.goto('/?skipIntro=true');

    // Canvas should not be attached/visible
    const canvas = page.locator('#webgl-canvas');
    await expect(canvas).not.toBeAttached();

    // Bug Check: verify that resizing does not crash (undefined camera/renderer)
    // Resize viewport dynamically to check robustness
    await page.setViewportSize({ width: 800, height: 600 });
    // Verify no console errors occurred on resize
  });

  test('should display mobile project list when screen width is <= 600', async ({ page }) => {
    await page.goto('/?skipIntro=true');

    // NOTE: This test will fail currently because #mobile-planet-list is missing from index.html!
    // It serves as a regression check for Milestone 1.
    const mobileList = page.locator('#mobile-planet-list');
    await expect(mobileList).toBeVisible();

    const planetCards = mobileList.locator('.mobile-planet-card');
    await expect(planetCards.first()).toBeVisible();
  });

  test('should show bottom sheet on touch/click of moon under mobile conditions (>600 width but touch device)', async ({ page }) => {
    // Set viewport to 700px (initializes ThreeJS since >600, but isMobile is true since <=768)
    await page.setViewportSize({ width: 700, height: 800 });
    await page.goto('/?skipIntro=true');

    // Click a category
    const label = page.locator('#labels-container .webgl-label').first();
    await label.click();

    // Wait for moon label to appear
    const moonLabel = page.locator('#labels-container .webgl-label--moon').first();
    await expect(moonLabel).toBeVisible();

    // Click the moon label
    await moonLabel.click();

    // Verify mobile bottom sheet popup slides in and is visible
    const bottomSheet = page.locator('#mobile-moon-popup');
    await expect(bottomSheet).toHaveClass(/visible/);

    // Verify bottom sheet content
    const sheetTitle = page.locator('#mobile-moon-title');
    await expect(sheetTitle).toBeVisible();
    await expect(sheetTitle).not.toBeEmpty();

    // Click the close button inside the bottom sheet
    const closeBtn = page.locator('#mobile-close-btn');
    await closeBtn.click();

    // Verify bottom sheet is dismissed
    await expect(bottomSheet).not.toHaveClass(/visible/);
  });
});

test.describe('Tier 4: Edge Cases & Visual Regression', () => {
  test('should guard transitions from rapid clicks', async ({ page }) => {
    await page.goto('/?skipIntro=true');

    // Rapidly click a category label multiple times
    const label = page.locator('#labels-container .webgl-label').first();
    await label.click();
    await label.click();
    await label.click();

    // Ensure we transition cleanly without breaking ThreeJS loop
    const backBtn = page.locator('#galaxy-back-btn');
    await expect(backBtn).toHaveClass(/visible/);
  });
});
