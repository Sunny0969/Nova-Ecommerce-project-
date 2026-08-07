/**
 * Fail the build if heavy admin vendors leak into storefront entry chunks.
 */
const fs = require('fs');
const path = require('path');

const buildDir = path.join(__dirname, '..', 'build', 'static', 'js');

const FORBIDDEN = [
  { label: 'jodit-react', re: /jodit-react|jodit\/es2021/i },
  { label: 'recharts', re: /\brecharts\b/i },
  { label: 'socket.io-client', re: /socket\.io-client/i }
];

/** Actual admin module paths — must not appear in storefront JS (chunk name maps are OK). */
const ADMIN_MODULE_MARKERS = [
  'pages/admin/AdminDashboard',
  'pages/admin/ProductForm',
  'pages/admin/AdminLayout',
  'admin-jodit',
  'admin-recharts'
];

const ADMIN_CHUNK_RE =
  /admin|staff-app|staff-routes|admin-jodit|admin-recharts|admin-socket-io/i;

function fail(msg) {
  console.error(`[verify-storefront-bundle] ${msg}`);
  process.exit(1);
}

/** Webpack runtime lists async chunk filenames; that is not vendor code. */
function stripWebpackChunkNameRefs(content) {
  return content
    .replace(/admin-jodit/g, '__ADMIN_JODIT_CHUNK__')
    .replace(/admin-recharts/g, '__ADMIN_RECHARTS_CHUNK__')
    .replace(/admin-socket-io/g, '__ADMIN_SOCKET_CHUNK__');
}

function scanFile(name) {
  const content = fs.readFileSync(path.join(buildDir, name), 'utf8');
  const stripped = stripWebpackChunkNameRefs(content);
  const hits = FORBIDDEN.filter((rule) => rule.re.test(stripped)).map((rule) => rule.label);
  const moduleLeaks = ADMIN_MODULE_MARKERS.filter((marker) => stripped.includes(marker));
  return { vendorHits: hits, moduleLeaks };
}

if (!fs.existsSync(buildDir)) {
  fail('build/static/js not found — run npm run build first.');
}

const violations = [];

for (const name of fs.readdirSync(buildDir)) {
  if (!name.endsWith('.js')) continue;
  if (ADMIN_CHUNK_RE.test(name)) continue;

  const isStorefrontEntry =
    /storefront-app|storefront-routes|^main\.|^runtime-main\./.test(name);

  if (!isStorefrontEntry) continue;

  const { vendorHits, moduleLeaks } = scanFile(name);
  for (const hit of vendorHits) {
    violations.push(`${name} contains ${hit}`);
  }
  for (const leak of moduleLeaks) {
    violations.push(`${name} contains admin module ${leak}`);
  }
}

if (violations.length) {
  fail(
    `Admin vendor code leaked into storefront bundles:\n${violations.map((v) => `  - ${v}`).join('\n')}`
  );
}

console.log(
  '[verify-storefront-bundle] OK — storefront entry chunks contain no jodit, recharts, or socket.io-client code.'
);
