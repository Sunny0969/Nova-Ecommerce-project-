const config = require('../prerender.config');
const { wrapStorefrontDocument } = require('./prerenderStorefrontShell');
const {
  buildPrerenderProductJsonLd,
  buildPrerenderBreadcrumbJsonLd,
  resolveProductRatingFields,
  getVisibleReviewRows
} = require('./productSchemaJsonLd');
const { resolveProductOfferAvailability } = require('./productAvailability');
const {
  buildProductGlobalIdentifierFields,
  resolveProductSku
} = require('./productIdentifiers');

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function stripHtml(value) {
  return String(value ?? '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function truncate(text, max = 160) {
  const s = stripHtml(text);
  if (s.length <= max) return s;
  return `${s.slice(0, max - 1).trim()}…`;
}

function formatPkr(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return 'PKR —';
  return `PKR ${Math.round(n).toLocaleString('en-PK')}`;
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

function productImageUrl(product) {
  if (!product) return '';
  if (product.imageUrl) return String(product.imageUrl).trim();
  const first = product.images?.[0];
  if (typeof first === 'string') return first.trim();
  return first?.url ? String(first.url).trim() : '';
}

function productCategorySlug(product) {
  if (product?.categorySlug) return normalizeSlug(product.categorySlug);
  const c = product?.category;
  if (c && typeof c === 'object' && c.slug) return normalizeSlug(c.slug);
  if (typeof c === 'string') return normalizeSlug(c);
  return '';
}

function productPath(product) {
  const slug = normalizeSlug(product?.slug) || normalizeSlug(product?.name);
  const cat = productCategorySlug(product);
  if (slug && cat && !config.reservedCategorySlugs.has(cat)) {
    return `/${encodeURIComponent(cat)}/${encodeURIComponent(slug)}`;
  }
  if (slug) return `/shop/${encodeURIComponent(slug)}`;
  return '/shop';
}

function categoryPath(slug) {
  const s = normalizeSlug(slug);
  if (!s || config.reservedCategorySlugs.has(s)) return '/shop';
  return `/${encodeURIComponent(s)}`;
}

function renderProductIdentifierMicrodata(product) {
  const fields = buildProductGlobalIdentifierFields(product, { siteName: 'Bazaar' });
  const parts = [];
  if (fields.brand?.name) {
    parts.push(`<span itemprop="brand" itemscope itemtype="https://schema.org/Brand"><meta itemprop="name" content="${escapeHtml(fields.brand.name)}" /></span>`);
  }
  const sku = fields.sku || resolveProductSku(product);
  if (sku) {
    parts.push(`<meta itemprop="sku" content="${escapeHtml(sku)}" />`);
  }
  const gtin = fields.gtin13 || fields.gtin12 || fields.gtin14 || fields.gtin8 || fields.gtin;
  if (gtin) {
    parts.push(`<meta itemprop="gtin13" content="${escapeHtml(gtin)}" />`);
  }
  if (fields.manufacturer?.name) {
    parts.push(`<span itemprop="manufacturer" itemscope itemtype="https://schema.org/Organization"><meta itemprop="name" content="${escapeHtml(fields.manufacturer.name)}" /></span>`);
  }
  return parts.join('\n    ');
}

function renderOfferMicrodataMeta(product, pageUrl) {
  const availability = resolveProductOfferAvailability(product);
  const url = pageUrl || '';
  return `<link itemprop="availability" href="${escapeHtml(availability.url)}" />
    ${url ? `<meta itemprop="url" content="${escapeHtml(url)}" />` : ''}`;
}

function renderProductCard(product) {
  const name = stripHtml(product?.name) || 'Product';
  const href = productPath(product);
  const img = productImageUrl(product);
  const price = formatPkr(product?.price);
  const desc = truncate(product?.shortDescription || product?.description, 120);
  const cardUrl = `${config.siteUrl}${href.startsWith('/') ? href : `/${href}`}`;

  return `<li class="products-grid__item" role="listitem">
  <article class="product-card" itemscope itemtype="https://schema.org/Product">
    <div class="product-image">
      <a class="product-image-link product-image-link--cover" href="${escapeHtml(href)}" itemprop="url">
        ${
          img
            ? `<img class="product-image__img product-image__img--zoom" src="${escapeHtml(img)}" alt="${escapeHtml(name)}" width="320" height="320" loading="lazy" decoding="async" itemprop="image" />`
            : '<span class="product-image__emoji" aria-hidden="true">🛒</span>'
        }
      </a>
    </div>
    <div class="product-info">
      <a href="${escapeHtml(href)}" class="product-name-link">
        <h3 class="product-name product-name--lines-2" itemprop="name">${escapeHtml(name)}</h3>
      </a>
      <div class="product-price">
        <span class="price-current" itemprop="offers" itemscope itemtype="https://schema.org/Offer">
          <meta itemprop="priceCurrency" content="PKR" />
          ${renderOfferMicrodataMeta(product, cardUrl)}
          <span itemprop="price" content="${escapeHtml(String(Number(product?.price) || 0))}">${escapeHtml(price)}</span>
        </span>
      </div>
    </div>
  </article>
</li>`;
}

function renderCategoryList(categories, activeSlug) {
  const items = categories
    .map((cat) => {
      const slug = normalizeSlug(cat.slug || cat.name);
      const href = categoryPath(slug);
      const label = stripHtml(cat.name || slug);
      const count = cat.productCount != null ? ` (${cat.productCount})` : '';
      const active = activeSlug && slug === normalizeSlug(activeSlug) ? ' aria-current="page"' : '';
      return `<li><a href="${escapeHtml(href)}"${active}>${escapeHtml(label)}${escapeHtml(count)}</a></li>`;
    })
    .join('\n');

  return `<nav class="prerender-categories" aria-label="Shop categories">
  <h2 class="prerender-categories__title">Categories</h2>
  <ul class="prerender-categories__list">${items}</ul>
</nav>`;
}

function renderProductGrid(products, heading) {
  if (!products.length) {
    return `<section class="prerender-products" aria-label="${escapeHtml(heading)}">
  <h2 class="prerender-products__title">${escapeHtml(heading)}</h2>
  <p class="prerender-products__empty">Browse our full catalog online at Bazaar.</p>
</section>`;
  }

  const cards = products.map(renderProductCard).join('\n');
  const titleHtml = heading
    ? `<header class="section-header"><h2 class="section-header__title">${escapeHtml(heading)}</h2></header>`
    : '';
  return `<section class="section shop-products-section" aria-label="${escapeHtml(heading || 'Products')}">
  ${titleHtml}
  <div class="products-grid products-grid--shop" role="list">${cards}</div>
</section>`;
}

function buildItemListJsonLd(products, pageUrl) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    url: pageUrl,
    numberOfItems: products.length,
    itemListElement: products.map((product, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: `${config.siteUrl}${productPath(product)}`,
      name: stripHtml(product?.name) || 'Product'
    }))
  };
}

function wrapPrerenderBody({ title, description, canonicalPath, bodyHtml, jsonLd, storefront = {} }) {
  const canonical = `${config.siteUrl}${canonicalPath.startsWith('/') ? canonicalPath : `/${canonicalPath}`}`;
  let ld = '';
  if (jsonLd) {
    const blocks = Array.isArray(jsonLd) ? jsonLd : [jsonLd];
    ld = blocks
      .filter(Boolean)
      .map((block) => `<script type="application/ld+json">${JSON.stringify(block)}</script>`)
      .join('\n');
  }

  const pageKind = storefront.pageKind || 'catalog';
  const pageHeader =
    pageKind === 'home' || pageKind === 'product'
      ? ''
      : `<header class="prerender-page__header">
        <h1 class="prerender-page__title">${escapeHtml(title.split(' | ')[0].split(' — ')[0])}</h1>
        <p class="prerender-page__lede">${escapeHtml(description)}</p>
      </header>`;

  const innerBody =
    pageKind === 'home'
      ? bodyHtml
      : `<article class="prerender-page">${pageHeader}${bodyHtml}</article>`;

  return {
    title,
    description,
    canonical,
    rootHtml: wrapStorefrontDocument({
      bodyHtml: innerBody,
      categories: storefront.categories || [],
      activeCategorySlug: storefront.activeCategorySlug || '',
      promoItems: storefront.promoItems || [],
      maxDiscountPercent: storefront.maxDiscountPercent,
      pageKind
    }),
    jsonLdScript: ld
  };
}

function buildHomePage({ categories, products, maxDiscountPercent, promoItems }) {
  const title = 'Online Shopping Pakistan — Groceries & Essentials | Bazaar';
  const description =
    'Shop groceries, cleaning, tea, rice, fashion and electronics online in Pakistan. Bazaar offers secure checkout and fast delivery from Hyderabad.';

  const body = renderProductGrid(products, 'Popular products');

  return wrapPrerenderBody({
    title,
    description,
    canonicalPath: '/',
    bodyHtml: body,
    jsonLd: buildItemListJsonLd(products, `${config.siteUrl}/`),
    storefront: {
      categories,
      pageKind: 'home',
      maxDiscountPercent,
      promoItems
    }
  });
}

function buildShopPage({ categories, products, totalCount, promoItems = [] }) {
  const title = 'Shop Online Pakistan — Groceries & Lifestyle | Bazaar';
  const description =
    'Browse the full Bazaar catalog — groceries, homecare, fashion, and electronics with secure payment and nationwide delivery.';

  const body = renderProductGrid(products, `All products${totalCount ? ` (${totalCount})` : ''}`);

  return wrapPrerenderBody({
    title,
    description,
    canonicalPath: '/shop',
    bodyHtml: body,
    jsonLd: buildItemListJsonLd(products, `${config.siteUrl}/shop`),
    storefront: { categories, pageKind: 'catalog', promoItems }
  });
}

function buildCategoryPage({ category, categories, products, totalCount, promoItems = [] }) {
  const name = stripHtml(category?.name || category?.slug || 'Category');
  const slug = normalizeSlug(category?.slug || category?.name);
  const title = `${name} — Shop Online | Bazaar`;
  const description = truncate(
    category?.description ||
      `Shop ${name} online at Bazaar Pakistan. ${totalCount || products.length} products with fast delivery and secure checkout.`,
    165
  );

  const body = renderProductGrid(products, `${name}${totalCount ? ` (${totalCount})` : ''}`);

  return wrapPrerenderBody({
    title,
    description,
    canonicalPath: categoryPath(slug),
    bodyHtml: body,
    jsonLd: buildItemListJsonLd(products, `${config.siteUrl}${categoryPath(slug)}`),
    storefront: { categories, activeCategorySlug: slug, pageKind: 'catalog', promoItems }
  });
}

function renderSiteNav() {
  const links = [
    ['/', 'Home'],
    ['/shop', 'Shop'],
    ['/brands', 'Brands'],
    ['/blog', 'Blog'],
    ['/about-us', 'About'],
    ['/contact-us', 'Contact'],
    ['/faqs', 'FAQs']
  ];
  const items = links
    .map(([href, label]) => `<li><a href="${escapeHtml(href)}">${escapeHtml(label)}</a></li>`)
    .join('');
  return `<nav class="prerender-site-nav" aria-label="Site">
  <ul>${items}</ul>
</nav>`;
}

function buildProductJsonLd(product, pageUrl) {
  return buildPrerenderProductJsonLd(product, pageUrl, { siteName: 'Bazaar' });
}

function renderProductRatingMicrodata(ratingValue, reviewCount) {
  const rv = Number(ratingValue);
  const rc = Number(reviewCount);
  if (!Number.isFinite(rv) || rv <= 0 || !Number.isFinite(rc) || rc <= 0) return '';
  return `<div itemprop="aggregateRating" itemscope itemtype="https://schema.org/AggregateRating">
    <meta itemprop="ratingValue" content="${escapeHtml(rv.toFixed(1))}" />
    <meta itemprop="reviewCount" content="${escapeHtml(String(Math.floor(rc)))}" />
    <meta itemprop="bestRating" content="5" />
    <meta itemprop="worstRating" content="1" />
    <p class="prerender-product-detail__rating" aria-label="Rated ${escapeHtml(rv.toFixed(1))} out of 5 from ${escapeHtml(String(Math.floor(rc)))} reviews">
      ★ ${escapeHtml(rv.toFixed(1))} <span>(${escapeHtml(String(Math.floor(rc)))} reviews)</span>
    </p>
  </div>`;
}

function renderProductReviewsSection(product) {
  const rows = getVisibleReviewRows(product);
  if (!rows.length) return '';
  const items = rows
    .map((row) => {
      const stars = '★'.repeat(Math.min(5, Math.max(1, Math.round(row.rating))));
      return `<article class="prerender-product-detail__review" itemprop="review" itemscope itemtype="https://schema.org/Review">
      <p class="prerender-product-detail__review-meta">
        <span itemprop="author" itemscope itemtype="https://schema.org/Person"><span itemprop="name">${escapeHtml(row.authorName)}</span></span>
        · <span aria-hidden="true">${escapeHtml(stars)}</span>
        ${row.datePublished ? `<time itemprop="datePublished" datetime="${escapeHtml(row.datePublished)}">${escapeHtml(row.datePublished)}</time>` : ''}
      </p>
      <p itemprop="reviewBody">${escapeHtml(row.reviewText)}</p>
      <span itemprop="reviewRating" itemscope itemtype="https://schema.org/Rating">
        <meta itemprop="ratingValue" content="${escapeHtml(String(row.rating))}" />
        <meta itemprop="bestRating" content="5" />
        <meta itemprop="worstRating" content="1" />
      </span>
    </article>`;
    })
    .join('\n');
  return `<section class="prerender-product-detail__reviews" aria-label="Customer reviews">
    <h2 class="prerender-product-detail__reviews-title">Customer reviews</h2>
    ${items}
  </section>`;
}

function buildProductPage({ product, categories, promoItems = [] }) {
  const name = stripHtml(product?.name) || 'Product';
  const path = productPath(product);
  const title = `${name} — Buy Online Pakistan | Bazaar`;
  const description = truncate(
    product?.shortDescription ||
      product?.description ||
      `Buy ${name} online at Bazaar Pakistan. Secure checkout and delivery across the country.`,
    165
  );
  const img = productImageUrl(product);
  const price = formatPkr(product?.price);
  const desc = stripHtml(product?.description || product?.shortDescription || '');
  const catSlug = productCategorySlug(product);
  const catName = categories.find((c) => normalizeSlug(c.slug) === catSlug)?.name || catSlug;
  const pageUrl = `${config.siteUrl}${path}`;
  const { ratingValue, reviewCount } = resolveProductRatingFields(product);
  const ratingMicro = renderProductRatingMicrodata(ratingValue, reviewCount);
  const reviewsSection = renderProductReviewsSection(product);

  const body = `<section class="prerender-product-detail product-detail-page" itemscope itemtype="https://schema.org/Product">
  ${img ? `<img class="prerender-product-detail__img product-detail-page__img" src="${escapeHtml(img)}" alt="${escapeHtml(name)}" width="480" height="480" itemprop="image" />` : ''}
  <h1 class="product-detail-page__title" itemprop="name">${escapeHtml(name)}</h1>
  ${renderProductIdentifierMicrodata(product)}
  ${catName ? `<p class="product-detail-page__category"><a href="${escapeHtml(categoryPath(catSlug))}">${escapeHtml(catName)}</a></p>` : ''}
  ${ratingMicro}
  <p class="prerender-product-detail__price product-price" itemprop="offers" itemscope itemtype="https://schema.org/Offer">
    <meta itemprop="priceCurrency" content="PKR" />
    ${renderOfferMicrodataMeta(product, pageUrl)}
    <span class="price-current" itemprop="price" content="${escapeHtml(String(Number(product?.price) || 0))}">${escapeHtml(price)}</span>
  </p>
  ${desc ? `<div class="prerender-product-detail__desc product-detail-page__desc" itemprop="description">${escapeHtml(desc)}</div>` : ''}
  ${reviewsSection}
</section>`;

  const breadcrumb = buildPrerenderBreadcrumbJsonLd(
    [
      { name: 'Home', path: '/' },
      ...(catSlug ? [{ name: catName || catSlug, path: categoryPath(catSlug) }] : []),
      { name, path }
    ],
    config.siteUrl
  );

  const productLd = buildProductJsonLd(product, pageUrl);
  const jsonLd = breadcrumb ? [breadcrumb, productLd] : productLd;

  return wrapPrerenderBody({
    title,
    description,
    canonicalPath: path,
    bodyHtml: body,
    jsonLd,
    storefront: { categories, activeCategorySlug: catSlug, pageKind: 'product', promoItems }
  });
}

const STATIC_PAGE_CONTENT = {
  '/about-us': {
    title: 'About Us — Online Grocery Pakistan | Bazaar',
    description:
      'Learn about Bazaar — Pakistan online store for groceries, home essentials, fashion, and imported products with delivery nationwide.',
    body: `<div class="prerender-static-body">
      <p>Bazaar is an online marketplace serving customers across Pakistan with groceries, health &amp; beauty, home care, snacks, beverages, clothing, and daily essentials.</p>
      <p>We focus on quality products, secure checkout, and reliable delivery from Hyderabad to cities nationwide.</p>
    </div>`
  },
  '/contact-us': {
    title: 'Contact Us | Bazaar',
    description: 'Contact Bazaar customer support for orders, delivery questions, and product help in Pakistan.',
    body: `<div class="prerender-static-body">
      <p>Reach our team for order support, delivery updates, and product questions.</p>
      <p>Visit our live site contact form for the fastest response, or email orders@bazaar-pk.com.</p>
    </div>`
  },
  '/faqs': {
    title: 'FAQs | Bazaar',
    description: 'Frequently asked questions about delivery, payments, returns, and shopping at Bazaar Pakistan.',
    body: `<div class="prerender-static-body">
      <p><strong>Delivery:</strong> We deliver across Pakistan. Fees and timelines depend on your city and order size.</p>
      <p><strong>Payments:</strong> Cash on delivery, bank transfer, and card payments where available.</p>
      <p><strong>Returns:</strong> See our returns policy for eligible items and refund timelines.</p>
    </div>`
  },
  '/privacy-policy': {
    title: 'Privacy Policy | Bazaar',
    description: 'How Bazaar collects, uses, and protects your personal information when you shop online.',
    body: `<div class="prerender-static-body"><p>We respect your privacy and protect account, order, and payment data according to our full privacy policy on the live site.</p></div>`
  },
  '/terms-and-conditions': {
    title: 'Terms and Conditions | Bazaar',
    description: 'Terms for using Bazaar website, placing orders, and shopping online in Pakistan.',
    body: `<div class="prerender-static-body"><p>By shopping at Bazaar you agree to our terms covering orders, pricing, delivery, and acceptable use of our website.</p></div>`
  },
  '/returns-and-refunds': {
    title: 'Returns and Refunds | Bazaar',
    description: 'Bazaar returns and refunds policy for online orders in Pakistan.',
    body: `<div class="prerender-static-body"><p>Eligible items can be returned within the policy window. Refunds are processed to your original payment method or Bazaar Wallet where applicable.</p></div>`
  },
  '/shipping-policy': {
    title: 'Shipping Policy | Bazaar',
    description: 'Delivery areas, shipping fees, and timelines for Bazaar orders in Pakistan.',
    body: `<div class="prerender-static-body"><p>We ship nationwide from Hyderabad. Shipping fees and delivery estimates are shown at checkout.</p></div>`
  },
  '/blog': {
    title: 'Shopping Guides & Tips | Bazaar Blog',
    description: 'Read Bazaar blog articles on groceries, fashion, home essentials, and smart online shopping in Pakistan.',
    body: ''
  },
  '/brands': {
    title: 'Shop by Brand | Bazaar',
    description: 'Browse trusted grocery and lifestyle brands at Bazaar Pakistan.',
    body: ''
  }
};

function buildStaticPage(routePath) {
  const meta = STATIC_PAGE_CONTENT[routePath];
  if (!meta) return null;
  const body = `${renderSiteNav()}${meta.body || ''}`;
  return wrapPrerenderBody({
    title: meta.title,
    description: meta.description,
    canonicalPath: routePath,
    bodyHtml: body
  });
}

function buildBlogIndexPage(posts) {
  const title = 'Shopping Guides & Tips | Bazaar Blog';
  const description =
    'Practical shopping guides, product tips, and buying advice from Bazaar Pakistan.';
  const cards = (posts || [])
    .map((post) => {
      const slug = normalizeSlug(post.slug);
      const href = `/blog/${encodeURIComponent(slug)}`;
      const label = stripHtml(post.title || slug);
      const excerpt = truncate(post.metaDescription || post.description, 140);
      return `<li class="prerender-blog-card"><a href="${escapeHtml(href)}">${escapeHtml(label)}</a>${excerpt ? `<p>${escapeHtml(excerpt)}</p>` : ''}</li>`;
    })
    .join('');
  const body = `${renderSiteNav()}
<section aria-label="Blog posts">
  <ul class="prerender-blog-list">${cards || '<li>No posts yet.</li>'}</ul>
</section>`;
  return wrapPrerenderBody({ title, description, canonicalPath: '/blog', bodyHtml: body });
}

function buildBlogPostPage(post) {
  const slug = normalizeSlug(post.slug);
  const title = stripHtml(post.metaTitle || post.title || 'Blog') + ' | Bazaar';
  const description = truncate(post.metaDescription || post.description || post.title, 165);
  const path = `/blog/${encodeURIComponent(slug)}`;
  const img = post.featuredImage ? String(post.featuredImage).trim() : '';
  let bodyHtml = stripHtml(post.body || '');
  if (!bodyHtml && Array.isArray(post.sections)) {
    bodyHtml = post.sections
      .map((s) => `${stripHtml(s.title)}\n${stripHtml(s.content)}`)
      .join('\n\n');
  }
  const body = `${renderSiteNav()}
<article class="prerender-static-body">
  ${img ? `<img class="prerender-product-detail__img" src="${escapeHtml(img)}" alt="${escapeHtml(post.imageAlt || post.title || '')}" width="640" height="360" />` : ''}
  <h1 class="prerender-page__title">${escapeHtml(stripHtml(post.title))}</h1>
  ${bodyHtml ? `<div>${escapeHtml(bodyHtml)}</div>` : `<p>${escapeHtml(description)}</p>`}
  <p><a href="/blog">← All articles</a></p>
</article>`;
  return wrapPrerenderBody({ title, description, canonicalPath: path, bodyHtml: body });
}

function buildBrandsPage(brands) {
  const title = 'Shop by Brand | Bazaar';
  const description = 'Browse grocery, home, and lifestyle brands available at Bazaar Pakistan.';
  const cards = (brands || [])
    .map((brand) => {
      const slug = normalizeSlug(brand.slug);
      const href = `/brand/${encodeURIComponent(slug)}`;
      return `<li class="prerender-brand-card"><a href="${escapeHtml(href)}">${escapeHtml(stripHtml(brand.name || slug))}</a></li>`;
    })
    .join('');
  const body = `${renderSiteNav()}
<ul class="prerender-brand-list">${cards}</ul>`;
  return wrapPrerenderBody({ title, description, canonicalPath: '/brands', bodyHtml: body });
}

function buildBrandPage({ brand, categories, products, totalCount }) {
  const name = stripHtml(brand?.name || brand?.slug || 'Brand');
  const slug = normalizeSlug(brand?.slug);
  const path = `/brand/${encodeURIComponent(slug)}`;
  const title = `${name} — Shop Online | Bazaar`;
  const description = `Shop ${name} products online at Bazaar Pakistan.${totalCount ? ` ${totalCount} products available.` : ''}`;
  const body = `${renderSiteNav()}
${renderCategoryList(categories)}
${renderProductGrid(products, `${name} products${totalCount ? ` (${totalCount})` : ''}`)}`;
  return wrapPrerenderBody({
    title,
    description,
    canonicalPath: path,
    bodyHtml: body,
    jsonLd: buildItemListJsonLd(products, `${config.siteUrl}${path}`)
  });
}

module.exports = {
  escapeHtml,
  buildHomePage,
  buildShopPage,
  buildCategoryPage,
  buildProductPage,
  buildStaticPage,
  buildBlogIndexPage,
  buildBlogPostPage,
  buildBrandsPage,
  buildBrandPage,
  normalizeSlug,
  categoryPath,
  productPath,
  productCategorySlug,
  STATIC_PAGE_CONTENT
};
