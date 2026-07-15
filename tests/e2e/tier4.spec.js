const { test, expect } = require('@playwright/test');

// Pick a real project with a dedicated page from the live data, so the
// journeys survive content changes made through the admin panel.
const projects = require('../../projects/projects.json');
const sample = projects.find(
  p => p.page && p.category && p.category.toLowerCase() !== 'explorations'
);

test.describe('Tier 4: Real-World Application Scenarios', () => {

  test('F4-Scenario-1: Full Desktop Navigation Journey', async ({ page }) => {
    test.skip(!sample, 'No non-exploration project with a page in projects.json');

    // 1. Load the main page with intro sequence
    await page.goto('/');
    const intro = page.locator('#intro-screen');
    await expect(intro).toBeAttached();

    // 2. Wait for intro to dismiss and UI to reveal
    await expect(intro).not.toBeAttached({ timeout: 12000 });
    const header = page.locator('#space-header');
    await expect(header).toHaveClass(/reveal-header/, { timeout: 12000 });

    // 3. Click the sample project's category planet label
    const categoryLabel = page.locator(`#labels-container .webgl-label:has-text("${sample.category}")`);
    await expect(categoryLabel).toBeVisible();
    await categoryLabel.evaluate(el => el.click());

    // 4. Click the sample project's moon label
    const moonLabel = page.locator(`#labels-container .webgl-label--moon:has-text("${sample.name}")`);
    await expect(moonLabel).toBeVisible({ timeout: 5000 });
    await moonLabel.evaluate(el => el.click());

    // 5. Verify navigation to the project details page
    await page.waitForURL(new RegExp(`/project\\.html\\?id=${sample.id}`));
    await expect(page.locator('h1.project-title')).toHaveText(sample.name);

    // 6. Click back link in project detail to return to the galaxy
    const projectBackLink = page.locator('a.project-back');
    await expect(projectBackLink).toBeVisible();
    await projectBackLink.click();

    // 7. Verify we are back on the home with skipIntro enabled
    await page.waitForURL(/\?skipIntro=true/);
    await expect(header).toHaveClass(/reveal-header/);
  });

  test('F4-Scenario-2: Full Mobile Interaction Journey', async ({ page }) => {
    test.skip(!sample, 'No non-exploration project with a page in projects.json');

    await page.setViewportSize({ width: 700, height: 800 });
    await page.goto('/?skipIntro=true');

    // 1. Enter category system
    const categoryLabel = page.locator(`#labels-container .webgl-label:has-text("${sample.category}")`);
    await expect(categoryLabel).toBeVisible();
    await categoryLabel.evaluate(el => el.click());

    // 2. Click a moon to open bottom sheet
    const moonLabel = page.locator(`#labels-container .webgl-label--moon:has-text("${sample.name}")`);
    await expect(moonLabel).toBeVisible({ timeout: 5000 });
    await moonLabel.evaluate(el => el.click());

    // 3. Verify mobile bottom sheet and category title are visible
    const popup = page.locator('#mobile-moon-popup');
    const categoryTitle = page.locator('#mobile-category-title');
    await expect(popup).toHaveClass(/visible/);
    await expect(categoryTitle).toHaveClass(/visible/);
    await expect(page.locator('#mobile-moon-title')).toHaveText(sample.name);

    // 4. Click close button on bottom sheet
    await page.locator('#mobile-close-btn').click();
    await expect(popup).not.toHaveClass(/visible/);
    await expect(categoryTitle).not.toHaveClass(/visible/);

    // 5. Click back button to return to galaxy (wait for the camera
    // return transition started by the close button to finish first)
    await page.waitForFunction(() => window.isTransitioning === false);
    const backBtn = page.locator('#galaxy-back-btn');
    await expect(backBtn).toBeVisible();
    await backBtn.click();
    await expect(backBtn).not.toHaveClass(/visible/, { timeout: 10000 });
  });

  test('F4-Scenario-3: Multi-orientation Resize Stability', async ({ page }) => {
    // Start in mobile portrait
    await page.setViewportSize({ width: 700, height: 800 });
    await page.goto('/?skipIntro=true');

    // Open system view
    const categoryLabel = page.locator('#labels-container .webgl-label:not(.webgl-label--moon)').first();
    await expect(categoryLabel).toBeVisible();
    await categoryLabel.evaluate(el => el.click());

    // Rotate to landscape (width > 768px resolves to desktop behavior)
    await page.setViewportSize({ width: 800, height: 600 });
    await page.waitForTimeout(200);

    // Verify galaxy back button is still visible
    const backBtn = page.locator('#galaxy-back-btn');
    await expect(backBtn).toHaveClass(/visible/);

    // Rotate back to portrait
    await page.setViewportSize({ width: 700, height: 800 });
    await page.waitForTimeout(200);
    await expect(backBtn).toHaveClass(/visible/);
  });

  test('F4-Scenario-4: Rapid/Abusive User Interactions', async ({ page }) => {
    await page.goto('/?skipIntro=true');

    // Double click or spam click on category label rapidly
    const categoryLabel = page.locator('#labels-container .webgl-label:not(.webgl-label--moon)').first();
    await expect(categoryLabel).toBeVisible();
    await categoryLabel.evaluate(el => el.click());
    await categoryLabel.evaluate(el => el.click());
    await categoryLabel.evaluate(el => el.click());

    // Wait and verify we entered system view correctly
    const backBtn = page.locator('#galaxy-back-btn');
    await expect(backBtn).toHaveClass(/visible/, { timeout: 5000 });

    // Spam click back button (first one waits for the transition to end,
    // the extra ones exercise the spam-protection)
    await page.waitForFunction(() => window.isTransitioning === false);
    await backBtn.click();
    await backBtn.click();
    await backBtn.click();

    // Verify we returned to galaxy view correctly
    await expect(backBtn).not.toHaveClass(/visible/, { timeout: 5000 });
  });

  test('F4-Scenario-5: Invalid project id redirects to /404', async ({ page }) => {
    // Directly navigate to project.html with an invalid ID.
    // loadProjectDetail redirects unknown ids to /404 (in production Vercel
    // serves 404.html there; the bare test server has no such page, so we
    // only assert the redirect itself).
    await page.goto('/project.html?id=nonexistent-project');
    await page.waitForURL(/\/404/);
    expect(new URL(page.url()).pathname).toBe('/404');
  });

});
