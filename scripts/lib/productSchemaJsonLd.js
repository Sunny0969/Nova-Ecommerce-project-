/**
 * Product JSON-LD for build-time prerender (must match storefront utils/jsonLd.js).
 */
const { buildFakeReviewsForProduct } = require('./prerenderFakeReviews');
const { resolveProductOfferAvailability } = require('./productAvailability');
const { buildProductGlobalIdentifierFields } = require('./productIdentifiers');

const SCHEMA_CONTEXT = 'https://schema.org';
const RATING_BEST = 5;
const RATING_WORST = 1;
const FALLBACK_RATING = 4.8;
const FALLBACK_REVIEW_COUNT = 12;

function isoDateOnly(value) {
  if (!value) return undefined;
  try {
    return new Date(value).toISOString().slice(0, 10);
  } catch {
    return undefined;
  }
}

function buildFallbackReviews() {
  const now = Date.now();
  return [
    {
      '@type': 'Review',
      reviewRating: {
        '@type': 'Rating',
        ratingValue: '5',
        bestRating: String(RATING_BEST),
        worstRating: String(RATING_WORST)
      },
      author: { '@type': 'Person', name: 'Ayesha Khan' },
      reviewBody: 'Excellent quality and fast delivery across Pakistan. Highly recommend Bazaar.',
      datePublished: isoDateOnly(now - 12 * 86400000)
    },
    {
      '@type': 'Review',
      reviewRating: {
        '@type': 'Rating',
        ratingValue: '5',
        bestRating: String(RATING_BEST),
        worstRating: String(RATING_WORST)
      },
      author: { '@type': 'Person', name: 'Hassan Ali' },
      reviewBody: 'Good value for money. Product matched the description and photos.',
      datePublished: isoDateOnly(now - 28 * 86400000)
    },
    {
      '@type': 'Review',
      reviewRating: {
        '@type': 'Rating',
        ratingValue: '4',
        bestRating: String(RATING_BEST),
        worstRating: String(RATING_WORST)
      },
      author: { '@type': 'Person', name: 'Sara Ahmed' },
      reviewBody: 'Smooth ordering experience and reliable packaging.',
      datePublished: isoDateOnly(now - 45 * 86400000)
    }
  ];
}

function stripHtml(value) {
  return String(value ?? '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function buildAggregateRatingSchema(ratingValue, reviewCount) {
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

function buildNestedProductReviews(reviews, max = 5) {
  return (reviews || [])
    .slice(0, max)
    .map((rev) => {
      const rating = Number(rev.rating);
      if (!Number.isFinite(rating) || rating < RATING_WORST || rating > RATING_BEST) return null;
      const authorName =
        (rev.user && (rev.user.name || rev.user.email)) ||
        rev.authorName ||
        rev.name ||
        'Customer';
      const body = String(rev.comment || rev.reviewText || rev.reviewBody || '').trim();
      const review = {
        '@type': 'Review',
        reviewRating: {
          '@type': 'Rating',
          ratingValue: String(rating),
          bestRating: String(RATING_BEST),
          worstRating: String(RATING_WORST)
        },
        author: { '@type': 'Person', name: String(authorName).trim() },
        reviewBody: body || 'Great product from Bazaar — fast delivery in Pakistan.',
        datePublished: isoDateOnly(rev.createdAt || rev.datePublished) || isoDateOnly(Date.now())
      };
      return review;
    })
    .filter(Boolean);
}

function ensureSchemaReviewArray(product, apiReviews = []) {
  const nested = buildNestedProductReviews(apiReviews, 5);
  if (nested.length >= 2) return nested;

  const fake = buildFakeReviewsForProduct(product, 3);
  const fromFake = buildNestedProductReviews(fake, 5);
  if (fromFake.length >= 2) return fromFake;

  return buildFallbackReviews();
}

function resolveProductRatingFields(product) {
  const apiReviews = Array.isArray(product?.reviews) ? product.reviews : [];
  const review = ensureSchemaReviewArray(product, apiReviews);

  let ratingValue = Number(product?.rating ?? product?.ratings);
  let reviewCount = Number(product?.ratingCount ?? product?.numReviews);

  if (review.length) {
    if (!Number.isFinite(ratingValue) || ratingValue <= 0) {
      const sum = review.reduce((t, r) => t + Number(r.reviewRating?.ratingValue || 0), 0);
      ratingValue = sum / review.length;
    }
    if (!Number.isFinite(reviewCount) || reviewCount <= 0) {
      reviewCount = Math.max(review.length, FALLBACK_REVIEW_COUNT);
    }
  }

  if (!Number.isFinite(ratingValue) || ratingValue <= 0) ratingValue = FALLBACK_RATING;
  if (!Number.isFinite(reviewCount) || reviewCount <= 0) reviewCount = FALLBACK_REVIEW_COUNT;

  const aggregateRating = buildAggregateRatingSchema(ratingValue, reviewCount);

  return { aggregateRating, review, ratingValue, reviewCount };
}

/**
 * @param {object} product
 * @param {string} pageUrl — absolute canonical URL
 * @param {{ siteName?: string }} [opts]
 */
function buildPrerenderProductJsonLd(product, pageUrl, opts = {}) {
  const siteName = opts.siteName || 'Bazaar';
  const name = stripHtml(product?.name) || 'Product';
  const img =
    product?.imageUrl ||
    product?.images?.[0]?.url ||
    (typeof product?.images?.[0] === 'string' ? product.images[0] : '');
  const price = Number(product?.price) || 0;
  const availability = resolveProductOfferAvailability(product);
  const { aggregateRating, review } = resolveProductRatingFields(product);
  const identifierFields = buildProductGlobalIdentifierFields(product, { siteName });

  return {
    '@context': SCHEMA_CONTEXT,
    '@type': 'Product',
    '@id': `${pageUrl}#product`,
    name,
    image: img ? [String(img).trim()] : undefined,
    description: stripHtml(product?.shortDescription || product?.description || name).slice(0, 8000),
    url: pageUrl,
    ...identifierFields,
    offers: {
      '@type': 'Offer',
      url: pageUrl,
      priceCurrency: 'PKR',
      price: price.toFixed(2),
      availability: availability.url,
      itemCondition: `${SCHEMA_CONTEXT}/NewCondition`,
      seller: { '@type': 'Organization', name: siteName }
    },
    aggregateRating,
    review
  };
}

function buildPrerenderBreadcrumbJsonLd(items, siteUrl) {
  const list = (items || []).filter((i) => i?.name && i?.path);
  if (!list.length) return null;
  return {
    '@context': SCHEMA_CONTEXT,
    '@type': 'BreadcrumbList',
    itemListElement: list.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: String(item.name).trim(),
      item: `${siteUrl}${item.path.startsWith('/') ? item.path : `/${item.path}`}`
    }))
  };
}

/** Plain rows for visible prerender review list */
function getVisibleReviewRows(product) {
  const { review } = resolveProductRatingFields(product);
  return (review || []).slice(0, 5).map((r, i) => ({
    id: `schema-review-${i}`,
    authorName: r.author?.name || 'Customer',
    rating: Number(r.reviewRating?.ratingValue) || 5,
    reviewText: r.reviewBody || '',
    datePublished: r.datePublished || ''
  }));
}

module.exports = {
  buildPrerenderProductJsonLd,
  buildPrerenderBreadcrumbJsonLd,
  resolveProductRatingFields,
  buildAggregateRatingSchema,
  getVisibleReviewRows,
  ensureSchemaReviewArray
};
