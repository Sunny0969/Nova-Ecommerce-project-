/**

 * Hostinger SPA deploy helpers — run after every production build.

 * 1. Copy prerendered index.html → 404.html (Hostinger ErrorDocument fallback)

 * 2. Ensure .htaccess exists in build/ with PRERENDER-FIRST rules

 */

const fs = require('fs');

const path = require('path');



const buildDir = path.join(__dirname, '..', 'build');

const indexPath = path.join(buildDir, 'index.html');

const fallback404Path = path.join(buildDir, '404.html');

const htaccessPath = path.join(buildDir, '.htaccess');

const publicHtaccess = path.join(__dirname, '..', 'public', '.htaccess');

const manifestPath = path.join(buildDir, 'prerender-manifest.json');



function fail(msg) {

  console.error(`[ensure-spa-hostinger-fallback] ${msg}`);

  process.exit(1);

}



function main() {

  if (!fs.existsSync(indexPath)) {

    fail('build/index.html not found — run npm run build first.');

  }



  fs.copyFileSync(indexPath, fallback404Path);



  if (fs.existsSync(publicHtaccess)) {

    fs.copyFileSync(publicHtaccess, htaccessPath);

  }



  if (!fs.existsSync(htaccessPath)) {

    fail('build/.htaccess missing — add frontend/public/.htaccess and rebuild.');

  }



  const htaccess = fs.readFileSync(htaccessPath, 'utf8');

  const requiredRules = [
    'RewriteEngine On',
    'PRERENDER-FIRST',
    'REQUEST_FILENAME}/index.html',
    'mod_expires',
    'ErrorDocument 404'
  ];

  for (const needle of requiredRules) {

    if (!htaccess.includes(needle)) {

      fail(`.htaccess missing required rule: ${needle}`);

    }

  }



  const indexHtml = fs.readFileSync(indexPath, 'utf8');

  const prerendered = indexHtml.includes('data-prerender="catalog"');

  if (fs.existsSync(manifestPath)) {

    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

    console.log(

      `[ensure-spa-hostinger-fallback] Prerender manifest: ${manifest.totalPages} pages ` +

        `(${manifest.products} products, ${manifest.categories} categories).`

    );

  } else if (prerendered) {

    console.warn(

      '[ensure-spa-hostinger-fallback] Home is prerendered but prerender-manifest.json is missing.'

    );

  } else {

    console.warn(

      '[ensure-spa-hostinger-fallback] build/index.html is NOT prerendered yet. ' +

        'Run npm run build:hostinger before uploading to Hostinger.'

    );

  }



  if (!fallback404Path || !fs.readFileSync(fallback404Path, 'utf8').includes('id="root"')) {

    fail('404.html must be a copy of index.html for Hostinger ErrorDocument fallback.');

  }



  console.log(

    '[ensure-spa-hostinger-fallback] OK — 404.html synced; .htaccess PRERENDER-FIRST rules present.'

  );

}



main();


