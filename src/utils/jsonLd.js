import {
  getSiteUrl,
  getDefaultOgImageUrl,
  getCanonicalUrl,
  siteName,
  buildBreadcrumbListSchema
} from './seo';
import {
  businessStreetAddress,
  businessAddressLocality,
  businessAddressRegion,
  businessAddressCountry,
  businessPhoneE164
} from './businessContact';
import { buildProductPath, getProductCategorySlug } from './urls';

export { buildBreadcrumbListSchema };

const SCHEMA_CONTEXT = 'https://schema.org';
const RATING_BEST = 5;
const RATING_WORST = 1;

/** Social profile URLs shown in site footer (sameAs). */
export const organizationSameAs = [
  'https://www.facebook.com/',
  'https://twitter.com/',
  'https://www.instagram.com/',
  'https://www.youtube.com/'
];

export const editorialAuthorName = 'Bazaar Editorial Team';

function normalizeBaseUrl(baseUrl) {
  const base =
    baseUrl != null && String(baseUrl).trim() !== ''
      ? String(baseUrl).trim().replace(/\/+$/, '')
      : getSiteUrl();
  if (base) return base;
  if (typeof window !== 'undefined' && window.location?.origin) {
    return String(window.location.origin).replace(/\/+$/, '');
  }
  return '';
}

/**
 * FAQ rows suitable for JSON-LD (shared with category SEO UI).
 * @param {Array<{ question?: string, answer?: string }>} faqs
 */
export function filterValidFaqs(faqs) {
  return (faqs || []).filter(
    (f) =>
      f?.question &&
      String(f.question).trim() &&
      f?.answer &&
      String(f.answer).trim().length > 20 &&
      !String(f.answer).includes('role=') &&
      !String(f.answer).includes('radix-')
  );
}

/**
 * @param {number} ratingValue
 * @param {number} reviewCount
 * @returns {object|null}
 */
export function buildAggregateRatingSchema(ratingValue, reviewCount) {
  const value = Number(ratingValue);
  const count = Number(reviewCount);
  if (!Number.isFinite(value) || value <= 0 || !Number.isFinite(count) || count <= 0) {
    return null;
  }
  return {
    '@type': 'AggregateRating',
    ratingValue: String(Math.min(RATING_BEST, Math.max(RATING_WORST, value)).toFixed(1)),
    reviewCount: String(Math.floor(count)),
    bestRating: String(RATING_BEST),
    worstRating: String(RATING_WORST)
  };
}

/**
 * Organization — site-wide (global layout).
 * @param {string} [baseUrl]
 */
export function buildOrganizationSchema(baseUrl) {
  const url = normalizeBaseUrl(baseUrl);
  const logoUrl = getDefaultOgImageUrl();
  return {
    '@context': SCHEMA_CONTEXT,
    '@type': 'Organization',
    '@id': `${url}/#organization`,
    name: siteName,
    url,
    logo: {
      '@type': 'ImageObject',
      url: logoUrl
    },
    address: {
      '@type': 'PostalAddress',
      streetAddress: businessStreetAddress,
      addressLocality: businessAddressLocality,
      addressRegion: businessAddressRegion,
      addressCountry: businessAddressCountry
    },
    telephone: businessPhoneE164,
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      telephone: businessPhoneE164,
      areaServed: businessAddressCountry,
      availableLanguage: ['English', 'Urdu']
    },
    sameAs: organizationSameAs
  };
}

/**
 * WebSite + SearchAction — site-wide (global layout).
 * @param {string} [baseUrl]
 * @param {string} [searchParam]
 */
export function buildWebSiteSchema(baseUrl, searchParam = 'search') {
  const url = normalizeBaseUrl(baseUrl);
  const sp = String(searchParam || 'search');
  return {
    '@context': SCHEMA_CONTEXT,
    '@type': 'WebSite',
    '@id': `${url}/#website`,
    name: siteName,
    url,
    publisher: { '@id': `${url}/#organization` },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${url}/shop?${sp}={search_term_string}`
      },
      'query-input': 'required name=search_term_string'
    }
  };
}

/**
 * @param {Array<{ question: string, answer: string }>|Array<{ q: string, a: string }>} faqs
 */
export function flattenFaqItems(faqs) {
  return (faqs || [])
    .flatMap((entry) => {
      if (entry?.question && entry?.answer) {
        return [{ question: entry.question, answer: entry.answer }];
      }
      if (entry?.q && entry?.a) {
        return [{ question: entry.q, answer: entry.a }];
      }
      if (Array.isArray(entry?.items)) {
        return entry.items.map((item) => ({
          question: item.q || item.question,
          answer: item.a || item.answer
        }));
      }
      return [];
    })
    .filter((f) => f?.question && f?.answer);
}

/**
 * FAQ categories from faqContent.js → flat FAQ rows.
 */
export function flattenFaqCategories(categories) {
  return flattenFaqItems(categories || []);
}

/**
 * @param {Array<{ question: string, answer: string }>} faqs
 */
export function buildFAQPageSchema(faqs) {
  const items = filterValidFaqs(faqs);
  if (!items.length) return null;
  return {
    '@context': SCHEMA_CONTEXT,
    '@type': 'FAQPage',
    mainEntity: items.map((faq) => ({
      '@type': 'Question',
      name: String(faq.question).trim(),
      acceptedAnswer: {
        '@type': 'Answer',
        text: String(faq.answer).trim()
      }
    }))
  };
}

/**
 * @param {object} blog — post from API
 * @param {string} pageUrl — absolute canonical URL
 */
export function buildArticleSchema(blog, pageUrl) {
  if (!blog) return null;
  const url = normalizeBaseUrl();
  const headline = String(blog.title || '').trim();
  if (!headline) return null;

  const image =
    blog.featuredImage != null && String(blog.featuredImage).trim()
      ? String(blog.featuredImage).trim()
      : undefined;

  const datePublished = blog.dateISO ? new Date(blog.dateISO).toISOString() : undefined;
  const dateModified = blog.updatedAt
    ? new Date(blog.updatedAt).toISOString()
    : datePublished;

  return {
    '@context': SCHEMA_CONTEXT,
    '@type': 'BlogPosting',
    headline,
    description: String(blog.description || '').trim() || undefined,
    image: image ? [image] : undefined,
    articleSection: blog.category ? String(blog.category).trim() : undefined,
    author: {
      '@type': 'Person',
      name: editorialAuthorName
    },
    datePublished,
    dateModified,
    publisher: {
      '@type': 'Organization',
      '@id': `${url}/#organization`,
      name: siteName,
      logo: {
        '@type': 'ImageObject',
        url: getDefaultOgImageUrl()
      }
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': pageUrl
    }
  };
}

/**
 * HowTo from blog sections or guide-style content.
 * @param {{ name: string, steps: Array<{ name?: string, text: string, image?: string }> }} input
 */
export function buildHowToSchema({ name, steps }) {
  const stepList = (steps || [])
    .map((s, i) => {
      const text = String(s?.text || '').trim();
      if (!text) return null;
      const stepName = String(s?.name || '').trim() || `Step ${i + 1}`;
      const step = {
        '@type': 'HowToStep',
        position: i + 1,
        name: stepName,
        text
      };
      if (s?.image && String(s.image).trim()) {
        step.image = String(s.image).trim();
      }
      return step;
    })
    .filter(Boolean);

  if (!name || !stepList.length) return null;

  return {
    '@context': SCHEMA_CONTEXT,
    '@type': 'HowTo',
    name: String(name).trim(),
    step: stepList
  };
}

/**
 * @param {string} pageUrl — absolute page URL
 * @param {string[]} cssSelectors — speakable content selectors
 */
export function buildSpeakableSpecificationSchema(pageUrl, cssSelectors) {
  const selectors = (cssSelectors || []).map((s) => String(s).trim()).filter(Boolean);
  if (!selectors.length || !pageUrl) return null;
  return {
    '@context': SCHEMA_CONTEXT,
    '@type': 'WebPage',
    '@id': pageUrl,
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: selectors
    }
  };
}

function resolveProductBrandName(product) {
  const raw = product?.brand?.name || product?.brandName || product?.brand;
  if (raw != null && String(raw).trim()) return String(raw).trim();
  return siteName;
}

function resolveProductCategoryName(product) {
  const raw =
    product?.categoryName ||
    product?.category?.name ||
    (typeof product?.category === 'string' ? product.category : '');
  return raw != null && String(raw).trim() ? String(raw).trim() : undefined;
}

/**
 * Review entities nested inside Product schema (no itemReviewed).
 * @param {Array<object>} reviews
 * @param {number} [max=5]
 */
export function buildNestedProductReviews(reviews, max = 5) {
  return (reviews || [])
    .slice(0, max)
    .map((rev) => {
      const rating = Number(rev.rating);
      if (!Number.isFinite(rating) || rating < RATING_WORST || rating > RATING_BEST) {
        return null;
      }
      const authorName =
        (rev.user && (rev.user.name || rev.user.email)) || rev.name || 'Customer';
      const body = String(rev.comment || rev.reviewBody || '').trim();
      const datePublished = rev.createdAt ? new Date(rev.createdAt).toISOString() : undefined;

      const review = {
        '@type': 'Review',
        reviewRating: {
          '@type': 'Rating',
          ratingValue: String(rating),
          bestRating: String(RATING_BEST),
          worstRating: String(RATING_WORST)
        },
        author: {
          '@type': 'Person',
          name: String(authorName).trim()
        }
      };
      if (body) review.reviewBody = body;
      if (datePublished) review.datePublished = datePublished;
      return review;
    })
    .filter(Boolean);
}

/**
 * @param {object} product
 * @param {object} options
 * @param {string} options.canonicalUrl
 * @param {string[]} [options.images]
 * @param {number} options.price
 * @param {boolean} options.inStock
 * @param {number} [options.ratingValue]
 * @param {number} [options.reviewCount]
 * @param {string} [options.description]
 * @param {Array<object>} [options.reviews] — nested Review objects (max 5)
 */
export function buildProductSchema(product, options) {
  if (!product) return null;
  const {
    canonicalUrl,
    images = [],
    price,
    inStock,
    ratingValue,
    reviewCount,
    reviews = []
  } = options || {};

  const imgs = (images || []).filter(Boolean);
  const desc = String(options?.description || product.shortDescription || product.description || product.name || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 8000);

  const aggregateRating = buildAggregateRatingSchema(ratingValue, reviewCount);
  const nestedReviews = buildNestedProductReviews(reviews);
  const categoryName = resolveProductCategoryName(product);
  const brandName = resolveProductBrandName(product);

  const schema = {
    '@context': SCHEMA_CONTEXT,
    '@type': 'Product',
    '@id': canonicalUrl ? `${canonicalUrl}#product` : undefined,
    name: product.name,
    url: canonicalUrl,
    image: imgs.length ? imgs : undefined,
    description: desc || undefined,
    category: categoryName,
    sku:
      product.sku != null && String(product.sku).trim() ? String(product.sku).trim() : undefined,
    brand: {
      '@type': 'Brand',
      name: brandName
    },
    offers: {
      '@type': 'Offer',
      url: canonicalUrl,
      priceCurrency: 'PKR',
      price: String(Number(price).toFixed(2)),
      availability: inStock ? `${SCHEMA_CONTEXT}/InStock` : `${SCHEMA_CONTEXT}/OutOfStock`,
      itemCondition: `${SCHEMA_CONTEXT}/NewCondition`,
      seller: {
        '@type': 'Organization',
        name: siteName
      }
    }
  };

  if (aggregateRating) {
    schema.aggregateRating = aggregateRating;
  }
  if (nestedReviews.length) {
    schema.review = nestedReviews;
  }

  return schema;
}

/**
 * Standalone Review JSON-LD (legacy / optional separate scripts).
 * @param {Array<object>} reviews — API or UI review rows
 * @param {string} productName
 */
export function buildProductReviewSchemas(reviews, productName) {
  const name = String(productName || 'Product').trim();
  return buildNestedProductReviews(reviews).map((review) => ({
    '@context': SCHEMA_CONTEXT,
    ...review,
    itemReviewed: {
      '@type': 'Product',
      name
    }
  }));
}

/**
 * ItemList for shop/category listings.
 * @param {Array<object>} products
 * @param {string} [listName]
 */
export function buildProductItemListSchema(products, listName = 'Products') {
  const items = (products || [])
    .slice(0, 20)
    .map((p, i) => {
      const slug = p?.slug || p?.productId;
      if (!slug || !p?.name) return null;
      const path = buildProductPath(String(slug), getProductCategorySlug(p));
      return {
        '@type': 'ListItem',
        position: i + 1,
        name: String(p.name).trim(),
        url: getCanonicalUrl(path)
      };
    })
    .filter(Boolean);

  if (!items.length) return null;

  return {
    '@context': SCHEMA_CONTEXT,
    '@type': 'ItemList',
    name: listName,
    itemListElement: items
  };
}

/**
 * Breadcrumb + optional FAQ for static content pages.
 */
export function buildStaticPageSchemas({ breadcrumbs, faqs, speakableUrl, speakableSelectors }) {
  const schemas = [];
  if (Array.isArray(breadcrumbs) && breadcrumbs.length) {
    const crumbs = buildBreadcrumbListSchema(breadcrumbs);
    if (crumbs) schemas.push(crumbs);
  }
  if (faqs?.length) {
    const faqSchema = buildFAQPageSchema(faqs);
    if (faqSchema) schemas.push(faqSchema);
  }
  if (speakableUrl && speakableSelectors?.length) {
    const speakable = buildSpeakableSpecificationSchema(speakableUrl, speakableSelectors);
    if (speakable) schemas.push(speakable);
  }
  return schemas.length ? schemas : null;
}

/**
 * Reviews shown on the product page (API first, then UI seed reviews).
 * @param {object} product
 * @param {{ reviews?: Array<object> }} fake
 */
export function getProductPageReviews(product, fake) {
  const api = Array.isArray(product?.reviews) ? product.reviews : [];
  if (api.length) return api;
  return Array.isArray(fake?.reviews) ? fake.reviews : [];
}

/**
 * Rating/count for schema — matches product detail UI (fake when present, else API).
 */
export function getProductRatingForSchema(product, fake) {
  const fakeCount = Number(fake?.count) || 0;
  const fakeRating = Number(fake?.rating) || 0;
  if (fakeCount > 0 && fakeRating > 0) {
    return { ratingValue: fakeRating, reviewCount: fakeCount };
  }
  const reviewCount = Number(product?.ratingCount ?? product?.numReviews) || 0;
  const ratingValue = Number(product?.rating ?? product?.ratings) || 0;
  return { ratingValue, reviewCount };
}

/**
 * Blog detail: Article + optional FAQ, HowTo, Speakable, Breadcrumb.
 * @param {object} params
 */
export function buildBlogDetailSchemas({
  blog,
  canonicalUrl,
  articleSections,
  faqItems
}) {
  if (!blog) return null;
  const schemas = [];
  const pageUrl = canonicalUrl;

  const article = buildArticleSchema(blog, pageUrl);
  if (article) schemas.push(article);

  const crumbs = buildBreadcrumbListSchema([
    { name: 'Home', path: '/' },
    { name: 'Blog', path: '/blog' },
    {
      name: String(blog.category || 'Article').trim(),
      path: `/blog?category=${encodeURIComponent(String(blog.category || ''))}`
    },
    { name: blog.title, path: `/blog/${blog.slug}` }
  ]);
  if (crumbs) schemas.push(crumbs);

  const faqSchema = buildFAQPageSchema(
    (faqItems || []).map((f) => ({
      question: f.question,
      answer: f.answer
    }))
  );
  if (faqSchema) schemas.push(faqSchema);

  const howToSteps = (articleSections || [])
    .map((s) => ({
      name: s.title,
      text: s.content,
      image: s.id === 1 ? blog.featuredImage : undefined
    }))
    .filter((s) => s.text && String(s.text).trim());

  if (howToSteps.length >= 2) {
    const howTo = buildHowToSchema({
      name: blog.title,
      steps: howToSteps
    });
    if (howTo) schemas.push(howTo);
  }

  const speakable = buildSpeakableSpecificationSchema(pageUrl, [
    '.blog-detail-hero__title',
    '.blog-detail-hero__description'
  ]);
  if (speakable) schemas.push(speakable);

  return schemas.length ? schemas : null;
}
