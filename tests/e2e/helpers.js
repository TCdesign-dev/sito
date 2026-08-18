/**
 * Shared fixtures for the e2e suite.
 *
 * Everything is derived from the live projects.json so editing content in the
 * admin panel never breaks the tests: they always target a project/category
 * that actually exists.
 */
const projects = require('../../projects/projects.json');

const EXPLORATIONS = ['explorations', 'esplorazioni'];
const isExploration = (c) => EXPLORATIONS.includes((c || '').toLowerCase());

/** Every distinct category, in the casing used by the data */
const categories = [...new Set(projects.map(p => p.category).filter(Boolean))];

/** Categories that get their own planet in the galaxy (Explorations is the Voyager) */
const planetCategories = categories.filter(c => !isExploration(c));

/** A category planet to drive navigation tests with */
const sampleCategory = planetCategories[0] || null;

/** A project with a dedicated page inside sampleCategory */
const sampleProject = projects.find(
  p => p.page && p.category === sampleCategory
) || null;

/** A project that links somewhere external instead of having a page */
const externalProject = projects.find(p => p.link && !p.page) || null;

const projectsIn = (category) =>
  projects.filter(p => (p.category || '').toLowerCase() === (category || '').toLowerCase());

/** Block webfonts: pending external requests stall page load in sandboxes */
async function blockFonts(page) {
  await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
}

/** Home page, ready to interact with (intro skipped, galaxy populated) */
async function openGalaxy(page, query = '?skipIntro=true') {
  await page.goto(`/${query}`);
  await page.waitForFunction(
    () => typeof planetsData !== 'undefined' &&
          planetsData.some(p => p.mesh.userData.isCategory),
    null,
    { timeout: 20000 }
  );
}

/**
 * Click a 3D label through the DOM rather than by coordinates: labels orbit
 * continuously, so a positional click can land on the canvas instead.
 */
async function clickLabel(page, text) {
  const label = text
    ? page.locator(`#labels-container .webgl-label:has-text("${text}")`).first()
    : page.locator('#labels-container .webgl-label').first();
  await label.waitFor({ state: 'visible', timeout: 15000 });
  await label.evaluate(el => el.click());
}

module.exports = {
  projects,
  categories,
  planetCategories,
  sampleCategory,
  sampleProject,
  externalProject,
  projectsIn,
  isExploration,
  blockFonts,
  openGalaxy,
  clickLabel,
};
