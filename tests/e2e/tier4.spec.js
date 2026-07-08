const { test, expect } = require('@playwright/test');

test.describe('Tier 4: Real-World Application Scenarios', () => {

  test('F4-Scenario-1: Full Desktop Navigation Journey', async ({ page }) => {
    // 1. Load the main page with intro sequence
    await page.goto('/');
    const intro = page.locator('#intro-screen');
    await expect(intro).toBeAttached();
    
    // 2. Wait for intro to dismiss and UI to reveal
    await expect(intro).not.toBeAttached({ timeout: 12000 });
    const header = page.locator('#space-header');
    await expect(header).toHaveClass(/reveal-header/, { timeout: 12000 });
    
    // 3. Click a category planet label (e.g. Design)
    const categoryLabel = page.locator('#labels-container .webgl-label:has-text("Design")');
    await expect(categoryLabel).toBeVisible();
    await categoryLabel.click({ force: true });
    
    // 4. Click a project moon label (e.g. Compact Security Camera)
    const moonLabel = page.locator('#labels-container .webgl-label--moon:has-text("Compact Security Camera")');
    await expect(moonLabel).toBeVisible({ timeout: 5000 });
    await moonLabel.click({ force: true });
    
    // 5. Verify navigation to project details page (URL is rewritten to
    // the pretty /<category>/<id> form once the project loads)
    await page.waitForURL(/\/design\/compact-security-camera/);
    expect(page.url()).toContain('/design/compact-security-camera');
    
    // 6. Click back button in project detail to return to Galaxy
    const projectBackLink = page.locator('a.project-back');
    await expect(projectBackLink).toBeVisible();
    await projectBackLink.click();
    
    // 7. Verify we are back on index.html with skipIntro enabled
    await page.waitForURL(/\/index\.html\?skipIntro=true/);
    await expect(header).toHaveClass(/reveal-header/);
  });

  test('F4-Scenario-2: Full Mobile Interaction Journey', async ({ page }) => {
    await page.setViewportSize({ width: 700, height: 800 });
    await page.goto('/?skipIntro=true');
    
    // 1. Enter category system
    const categoryLabel = page.locator('#labels-container .webgl-label:has-text("Design")');
    await expect(categoryLabel).toBeVisible();
    await categoryLabel.click({ force: true });
    
    // 2. Click a moon to open bottom sheet
    const moonLabel = page.locator('#labels-container .webgl-label--moon:has-text("Compact Security Camera")');
    await expect(moonLabel).toBeVisible({ timeout: 5000 });
    await moonLabel.click({ force: true });
    
    // 3. Verify mobile bottom sheet and category title are visible
    const popup = page.locator('#mobile-moon-popup');
    const categoryTitle = page.locator('#mobile-category-title');
    await expect(popup).toHaveClass(/visible/);
    await expect(categoryTitle).toHaveClass(/visible/);
    await expect(page.locator('#mobile-moon-title')).toHaveText('Compact Security Camera');
    
    // 4. Click close button on bottom sheet
    await page.locator('#mobile-close-btn').click();
    await expect(popup).not.toHaveClass(/visible/);
    await expect(categoryTitle).not.toHaveClass(/visible/);
    
    // 5. Click back button to return to galaxy
    const backBtn = page.locator('#galaxy-back-btn');
    await expect(backBtn).toBeVisible();
    await backBtn.click();
    await expect(backBtn).not.toHaveClass(/visible/);
  });

  test('F4-Scenario-3: Multi-orientation Resize Stability', async ({ page }) => {
    // Start in mobile portrait
    await page.setViewportSize({ width: 700, height: 800 });
    await page.goto('/?skipIntro=true');
    
    // Open system view
    const categoryLabel = page.locator('#labels-container .webgl-label:not(.webgl-label--moon)').first();
    await expect(categoryLabel).toBeVisible();
    await categoryLabel.click({ force: true });
    
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
    await categoryLabel.click({ force: true });
    await categoryLabel.click({ force: true });
    await categoryLabel.click({ force: true });
    
    // Wait and verify we entered system view correctly
    const backBtn = page.locator('#galaxy-back-btn');
    await expect(backBtn).toHaveClass(/visible/, { timeout: 5000 });
    
    // Spam click back button
    await backBtn.click();
    await backBtn.click();
    await backBtn.click();
    
    // Verify we returned to galaxy view correctly
    await expect(backBtn).not.toHaveClass(/visible/, { timeout: 5000 });
  });

  test('F4-Scenario-5: Invalid Route / Error Redirection', async ({ page }) => {
    // Directly navigate to project.html with invalid ID
    await page.goto('/project.html?id=nonexistent-project');
    
    // Verify error UI is displayed
    const title = page.locator('h1.project-title');
    await expect(title).toHaveText('Project not found');
    
    // Click "Projects" back link
    const backLink = page.locator('a.project-back');
    await expect(backLink).toBeVisible();
    await backLink.click();
    
    // Verify redirection back to a safe route (projects.html)
    await page.waitForURL(/\/projects\.html/);
    expect(page.url()).toContain('projects.html');
  });

});
