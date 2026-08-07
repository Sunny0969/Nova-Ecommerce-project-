/**
 * Fail the build if admin CSS leaks into the main storefront stylesheet,
 * or if forbidden third-party CSS (e.g. Ant Design) is bundled.
 */
const fs = require('fs');
const path = require('path');

const cssDir = path.join(__dirname, '..', 'build', 'static', 'css');
const MAX_MAIN_CSS_KB = 185;

function fail(msg) {
  console.error(`[verify-storefront-css] ${msg}`);
  process.exit(1);
}

if (!fs.existsSync(cssDir)) {
  fail('build/static/css not found — run npm run build first.');
}

const mainFiles = fs.readdirSync(cssDir).filter((name) => /^main\..+\.css$/.test(name));
if (!mainFiles.length) {
  fail('main.*.css not found in build output.');
}

const mainCss = fs.readFileSync(path.join(cssDir, mainFiles[0]), 'utf8');
const mainKb = Buffer.byteLength(mainCss, 'utf8') / 1024;

const adminLeaks = ['.admin-shell', '.admin-sidebar', '.product-form__scroll-wrap'].filter((sel) =>
  mainCss.includes(sel)
);

if (adminLeaks.length) {
  fail(
    `Admin CSS leaked into main bundle:\n${adminLeaks.map((s) => `  - ${s}`).join('\n')}`
  );
}

const antdMarkers = ['.ant-', 'antd', 'ant-design'];
const antdHits = antdMarkers.filter((marker) => mainCss.includes(marker));
if (antdHits.length) {
  fail(
    `Ant Design CSS detected in main bundle (${antdHits.join(', ')}). ` +
      'Remove any import of antd/dist/antd.css — this project does not use Ant Design.'
  );
}

if (mainKb > MAX_MAIN_CSS_KB) {
  fail(
    `main.css is ${mainKb.toFixed(1)} KB (limit ${MAX_MAIN_CSS_KB} KB). ` +
      'PurgeCSS may not be running — check postcss.config.js and craco style.postcss.mode.'
  );
}

console.log(
  `[verify-storefront-css] OK — main.css is ${mainKb.toFixed(1)} KB, no admin/antd CSS.`
);
