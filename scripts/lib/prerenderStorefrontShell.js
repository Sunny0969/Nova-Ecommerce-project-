/**
 * Static storefront chrome for prerender — mirrors React Navbar, ticker, category strip, hero, footer.
 * Uses the same CSS class names as the live SPA so /static/css/main.*.css styles apply without JS.
 */
const bannerCloudinary = require('../../src/config/homeBannerCloudinary.json');

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function normalizeSlug(slug) {
  return String(slug || '')
    .trim()
    .toLowerCase()
    .replace(/_/g, '-')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function categoryHref(slug) {
  const s = normalizeSlug(slug);
  return s ? `/${encodeURIComponent(s)}` : '/shop';
}

function renderPromoTicker(items = []) {
  const fallback = [{ code: 'GLBAR20', text: 'Exclusive voucher — 20% off storewide' }];
  const list = items.length ? items : fallback;
  const track = list
    .map((item) => {
      const code = item.code ? `<span class="promo-ticker__code">${escapeHtml(item.code)}</span>` : '';
      const text = `<span class="promo-ticker__text">${escapeHtml(item.text || '')}</span>`;
      return `<span class="promo-ticker__item">${code}${text}</span>`;
    })
    .join('');

  return `<div class="promo-ticker" role="region" aria-label="Promotions">
  <div class="promo-ticker__inner">
    <span class="promo-ticker__badge"><span class="promo-ticker__badge-label">Offers</span></span>
    <div class="promo-ticker__viewport">
      <div class="promo-ticker__track" aria-hidden="true">${track}${track}</div>
    </div>
  </div>
</div>`;
}

function renderNavbar() {
  return `<nav class="navbar" aria-label="Main navigation">
  <div class="nav-inner">
    <div class="nav-brand">
      <a class="nav-logo" href="/" aria-label="Bazaar Home">BAZAAR<span class="nav-logo__dot">.</span></a>
      <span class="nav-location nav-location--desktop">Pakistan</span>
      <div class="nav-main nav-main--desktop">
        <a class="nav-link" href="/shop">Shop</a>
        <a class="nav-link" href="/blog">Blog</a>
      </div>
    </div>
    <div class="nav-search nav-search--inline">
      <form class="nav-search__field" action="/shop" method="get" role="search">
        <span class="nav-search__submit" aria-hidden="true">⌕</span>
        <input class="nav-search__input" type="search" name="search" placeholder="Search products, blogs &amp; more…" aria-label="Search products" />
      </form>
    </div>
    <div class="nav-tools nav-tools--desktop">
      <div class="nav-tools__icons">
        <a class="nav-icon-btn" href="/wishlist" aria-label="Wishlist">♡</a>
        <a class="nav-icon-btn" href="/cart" aria-label="Cart">🛒</a>
        <a class="nav-icon-btn" href="/login" aria-label="Account">👤</a>
      </div>
    </div>
  </div>
</nav>`;
}

function renderCategoryStrip(categories, activeSlug) {
  if (!Array.isArray(categories) || !categories.length) return '';

  const items = categories
    .map((cat) => {
      const slug = normalizeSlug(cat.slug || cat.name);
      const name = escapeHtml(cat.name || slug);
      const href = categoryHref(slug);
      const active = activeSlug && slug === normalizeSlug(activeSlug) ? ' home-category-strip__link--active' : '';
      return `<a class="home-category-strip__link${active}" href="${escapeHtml(href)}">${name}</a>`;
    })
    .join('');

  return `<nav class="home-category-strip" aria-label="Browse categories">
  <div class="home-category-strip__inner">
    <div class="home-category-strip__scroll">${items}</div>
  </div>
</nav>`;
}

function renderHomeBanner() {
  const slide = bannerCloudinary['summer-sale'];
  const src =
    slide?.url ||
    'https://res.cloudinary.com/db05hw4ri/image/upload/v1781378765/bazaar/home-banners/wdkt8hfhmjwewa78dplk.webp';

  return `<div class="home-banner-slider-wrapper">
  <section class="home-banner-slider" aria-label="Promotional banners">
    <div class="home-banner-slider__viewport">
      <a class="home-banner-slider__slide home-banner-slider__slide--active" href="/shop">
        <img class="home-banner-slider__img" src="${escapeHtml(src)}" alt="Summer Sale — shop at Bazaar" width="1920" height="575" loading="eager" decoding="sync" fetchpriority="high" />
      </a>
    </div>
  </section>
</div>`;
}

function renderHomeHero(maxDiscountPercent = 40) {
  const pct =
    Number.isFinite(Number(maxDiscountPercent)) && Number(maxDiscountPercent) > 0
      ? Math.round(Number(maxDiscountPercent))
      : 40;

  return `<section class="rozana-hero" id="rozana-hero" aria-label="Bazaar storefront hero">
  <div class="container rozana-hero__grid">
    <div class="rozana-hero__copy">
      <p class="rozana-hero__eyebrow">Pakistan ka no. 1 online store</p>
      <h1 class="rozana-hero__title">Online Shopping Pakistan — sab kuch <span class="rozana-hero__accent">ghar pe</span>, sab se sasti qeemat pe.</h1>
      <p class="rozana-hero__lead">Groceries, electronics, fashion aur zyada — ek hi jagah. Fast delivery aur best prices.</p>
    </div>
    <div class="rozana-hero__panel">
      <div class="rozana-hero__promo" role="region" aria-label="Current promotion">
        <span class="rozana-hero__promo-icon" aria-hidden="true">🎉</span>
        <div class="rozana-hero__promo-text">
          <p class="rozana-hero__promo-title">Sale — Up to <strong class="rozana-hero__promo-pct">${pct}%</strong> Off</p>
          <p class="rozana-hero__promo-sub">Limited time • Best prices on Bazaar</p>
        </div>
      </div>
      <ul class="rozana-hero__features">
        <li class="rozana-hero__feature">
          <span class="rozana-hero__feature-icon" aria-hidden="true">🌿</span>
          <div>
            <p class="rozana-hero__feature-title">Fresh &amp; Fast Delivery</p>
            <p class="rozana-hero__feature-sub">Daily fresh items • Same day available</p>
          </div>
        </li>
        <li class="rozana-hero__feature">
          <span class="rozana-hero__feature-icon" aria-hidden="true">↩</span>
          <div>
            <p class="rozana-hero__feature-title">Easy Returns</p>
            <p class="rozana-hero__feature-sub">7-day policy</p>
          </div>
        </li>
      </ul>
    </div>
  </div>
</section>`;
}

function renderFooter(categories = []) {
  const catLinks = categories
    .slice(0, 12)
    .map((cat) => {
      const slug = normalizeSlug(cat.slug || cat.name);
      return `<li><a href="${escapeHtml(categoryHref(slug))}">${escapeHtml(cat.name || slug)}</a></li>`;
    })
    .join('');

  return `<footer class="footer footer--bazaar" role="contentinfo">
  <div class="container">
    <div class="footer-grid footer-grid--store">
      <div class="footer-brand">
        <a class="footer-logo" href="/">BAZAAR<span class="footer-logo__dot">.</span></a>
        <p class="footer-tagline">Pakistan&apos;s online grocery &amp; lifestyle marketplace — groceries, fashion, and home essentials.</p>
      </div>
      <div class="footer-col footer-col--categories">
        <h2 class="footer-col__title">Categories</h2>
        <ul class="footer-links">${catLinks}</ul>
      </div>
      <div class="footer-col footer-col--about">
        <h2 class="footer-col__title">Help</h2>
        <ul class="footer-links">
          <li><a href="/about-us">About Us</a></li>
          <li><a href="/contact-us">Contact</a></li>
          <li><a href="/faqs">FAQs</a></li>
          <li><a href="/shipping-policy">Shipping</a></li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <p class="footer-bottom__copy">© ${new Date().getFullYear()} Bazaar. All rights reserved.</p>
    </div>
  </div>
</footer>`;
}

/**
 * @param {{ bodyHtml: string, categories?: array, activeCategorySlug?: string, promoItems?: array, maxDiscountPercent?: number, pageKind?: 'home'|'catalog'|'product' }} opts
 */
function wrapStorefrontDocument(opts) {
  const {
    bodyHtml,
    categories = [],
    activeCategorySlug = '',
    promoItems = [],
    maxDiscountPercent = 40,
    pageKind = 'catalog'
  } = opts;

  const homeLead =
    pageKind === 'home'
      ? `<div class="home-top-stack">
  <div class="home-top-stack__lead">
    ${renderHomeBanner()}
  </div>
  ${renderHomeHero(maxDiscountPercent)}
</div>`
      : '';

  return `<div class="App">
  ${renderPromoTicker(promoItems)}
  ${renderNavbar()}
  ${renderCategoryStrip(categories, activeCategorySlug)}
  <main id="main-content" class="main-content" tabindex="-1">
    ${homeLead}
    <div class="container">${bodyHtml}</div>
  </main>
  ${renderFooter(categories)}
</div>`;
}

module.exports = {
  wrapStorefrontDocument,
  renderPromoTicker,
  renderNavbar,
  renderCategoryStrip,
  renderHomeBanner,
  renderHomeHero,
  renderFooter,
  categoryHref,
  normalizeSlug
};
