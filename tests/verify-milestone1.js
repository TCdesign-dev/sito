const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Running Milestone 1 Verification Checks...\n');

let failures = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`[PASS] ${message}`);
  } else {
    console.log(`[FAIL] ${message}`);
    failures++;
  }
}

// 1. Verify syntax of main.js using node -c
try {
  execSync('node -c main.js', { stdio: 'inherit' });
  assert(true, 'main.js has valid syntax (node -c main.js)');
} catch (err) {
  assert(false, 'main.js has syntax errors: ' + err.message);
}

// Read files
const indexHtml = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const mainJs = fs.readFileSync(path.join(__dirname, '../main.js'), 'utf8');
const styleCss = fs.readFileSync(path.join(__dirname, '../style.css'), 'utf8');

// 2. Check that #mobile-planet-list exists in index.html
const hasMobilePlanetList = indexHtml.includes('id="mobile-planet-list"');
assert(hasMobilePlanetList, '#mobile-planet-list exists in index.html');

// 3. Check that .space-main uses svh instead of vh in style.css
// Let's find the .space-main block in style.css and check if it contains svh
const spaceMainRegex = /\.space-main\s*\{[^}]*\}/g;
const spaceMainMatches = styleCss.match(spaceMainRegex);
let usesSvh = false;
if (spaceMainMatches) {
  usesSvh = spaceMainMatches.some(block => block.includes('svh') && !block.includes(' vh') && !block.includes(':vh'));
}
assert(usesSvh, '.space-main styling uses svh instead of vh in style.css');

// 4. Verify that main.js contains the guard checks for camera and renderer
const hasResizeGuard = mainJs.includes('if (camera && renderer && container.clientHeight > 0)');
const hasIntervalGuard = mainJs.includes('typeof camera !== \'undefined\' && camera');
const hasTimeoutGuard = mainJs.includes('if (camera)');
assert(hasResizeGuard, 'main.js contains resize listener camera & renderer guard');
assert(hasIntervalGuard, 'main.js contains DOMContentLoaded interval camera guard');
assert(hasTimeoutGuard, 'main.js contains DOMContentLoaded timeout camera guard');

// 5. Check if there are any other references to innerWidth restricting Three.js loading
const innerWidthOccurrences = (mainJs.match(/innerWidth/g) || []).length;
// We know from grep that innerWidth only occurs twice to set isMobile, which is safe.
const isInnerWidthSafe = innerWidthOccurrences <= 2;
assert(isInnerWidthSafe, `innerWidth is only referenced ${innerWidthOccurrences} times (expected <= 2 and only for isMobile)`);

console.log(`\nVerification finished. Total failures: ${failures}`);
process.exit(failures > 0 ? 1 : 0);
