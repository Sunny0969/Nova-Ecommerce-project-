/**
 * Fail the build if Hostinger deploy artifacts are missing or misconfigured.
 */
const fs = require('fs');
const path = require('path');

const buildDir = path.join(__dirname, '..', 'build');
const required = ['index.html', 'api-config.js', '.htaccess', 'static'];
const railway = 'nova-ecommerce-project-backend-production.up.railway.app';

function fail(msg) {
  console.error(`[verify-hostinger-build] ${msg}`);
  process.exit(1);
}

if (!fs.existsSync(buildDir)) {
  fail('build/ folder not found — run npm run build first.');
}

for (const name of required) {
  const p = path.join(buildDir, name);
  if (!fs.existsSync(p)) {
    fail(`Missing ${name} in build/ — upload this to Hostinger public_html.`);
  }
}

const indexHtml = fs.readFileSync(path.join(buildDir, 'index.html'), 'utf8');
if (!indexHtml.includes(railway)) {
  fail('index.html does not reference the Railway API — live site will fail to load data.');
}

const apiConfig = fs.readFileSync(path.join(buildDir, 'api-config.js'), 'utf8');
if (!apiConfig.includes(railway)) {
  fail('api-config.js does not point to Railway.');
}

console.log('[verify-hostinger-build] OK — ready to upload build/ to Hostinger.');
