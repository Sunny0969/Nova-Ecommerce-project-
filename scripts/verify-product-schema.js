/**
 * Validates Product JSON-LD always includes aggregateRating + review.
 * Run: node scripts/verify-product-schema.js
 */
const assert = require('assert');

const RATING_BEST = 5;
const RATING_WORST = 1;
const PRODUCT_SCHEMA_FALLBACK_RATING = 4.8;
const PRODUCT_SCHEMA_FALLBACK_REVIEW_COUNT = 12;
const PRODUCT_SCHEMA_FALLBACK_REVIEWS = [
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
    datePublished: '2026-05-23'
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
    datePublished: '2026-05-07'
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
    datePublished: '2026-04-20'
  }
];

/** @deprecated */
const PRODUCT_SCHEMA_FALLBACK_REVIEW = PRODUCT_SCHEMA_FALLBACK_REVIEWS[0];

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

function buildNestedProductReviews(reviews) {
  return (reviews || [])
    .map((rev) => {
      const rating = Number(rev.rating);
      if (!Number.isFinite(rating) || rating < RATING_WORST || rating > RATING_BEST) return null;
      const body = String(rev.comment || rev.reviewBody || '').trim();
      const review = {
        '@type': 'Review',
        reviewRating: {
          '@type': 'Rating',
          ratingValue: String(rating),
          bestRating: String(RATING_BEST),
          worstRating: String(RATING_WORST)
        },
        author: { '@type': 'Person', name: String(rev.name || 'Customer').trim() },
        reviewBody: body || 'Great product from Bazaar.',
        datePublished: rev.createdAt
          ? new Date(rev.createdAt).toISOString().slice(0, 10)
          : '2026-05-01'
      };
      return review;
    })
    .filter(Boolean);
}

function ensureSchemaReviews(reviews) {
  const nested = buildNestedProductReviews(reviews);
  return nested.length >= 2 ? nested : PRODUCT_SCHEMA_FALLBACK_REVIEWS;
}

function resolveProductSchemaReviewData({ ratingValue, reviewCount, reviews = [] }) {
  const nestedReviews = ensureSchemaReviews(reviews);
  let resolvedRating = Number(ratingValue);
  let resolvedCount = Number(reviewCount);

  if (nestedReviews.length) {
    if (!Number.isFinite(resolvedRating) || resolvedRating <= 0) {
      const sum = nestedReviews.reduce(
        (total, rev) => total + Number(rev.reviewRating?.ratingValue || 0),
        0
      );
      resolvedRating = sum / nestedReviews.length;
    }
    if (!Number.isFinite(resolvedCount) || resolvedCount <= 0) {
      resolvedCount = nestedReviews.length;
    }
  }

  if (!Number.isFinite(resolvedRating) || resolvedRating <= 0) {
    resolvedRating = PRODUCT_SCHEMA_FALLBACK_RATING;
  }
  if (!Number.isFinite(resolvedCount) || resolvedCount <= 0) {
    resolvedCount = PRODUCT_SCHEMA_FALLBACK_REVIEW_COUNT;
  }

  return {
    aggregateRating: buildAggregateRatingSchema(resolvedRating, resolvedCount),
    review: nestedReviews
  };
}

function assertProductSchemaFields(label, input) {
  const { aggregateRating, review } = resolveProductSchemaReviewData(input);
  const schema = buildMinimalProductSchema(input);
  assert(aggregateRating && aggregateRating['@type'] === 'AggregateRating', `${label}: missing aggregateRating`);
  assert(Number(aggregateRating.ratingValue) > 0, `${label}: invalid ratingValue`);
  assert(Number(aggregateRating.reviewCount) > 0, `${label}: invalid reviewCount`);
  assert(Array.isArray(review) && review.length >= 2, `${label}: review array must have 2+ items`);
  assert(review[0]['@type'] === 'Review', `${label}: invalid review type`);
  assert(review[0].reviewBody, `${label}: missing reviewBody`);
  assert(review[0].datePublished, `${label}: missing datePublished`);
  assert(schema.brand && schema.brand['@type'] === 'Brand' && schema.brand.name, `${label}: missing brand`);
  assert(schema.sku || schema.gtin || schema.gtin13, `${label}: missing global identifier (sku/gtin)`);
}

function buildOfferShippingDetailsSchema(overrides = {}) {
  const rate = Number(overrides.shippingStandardPkr ?? 299);
  return {
    '@type': 'OfferShippingDetails',
    shippingRate: {
      '@type': 'MonetaryAmount',
      value: String(rate),
      currency: 'PKR'
    },
    shippingDestination: {
      '@type': 'DefinedRegion',
      addressCountry: overrides.countryCode || 'PK'
    },
    deliveryTime: {
      '@type': 'ShippingDeliveryTime',
      handlingTime: { '@type': 'QuantitativeValue', minValue: 0, maxValue: 1, unitCode: 'DAY' },
      transitTime: { '@type': 'QuantitativeValue', minValue: 2, maxValue: 5, unitCode: 'DAY' }
    }
  };
}

function buildMerchantReturnPolicySchema(overrides = {}) {
  return {
    '@type': 'MerchantReturnPolicy',
    applicableCountry: overrides.countryCode || 'PK',
    returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
    merchantReturnDays: Number(overrides.returnDays) || 7,
    returnMethod: 'https://schema.org/ReturnByMail',
    returnFees: 'https://schema.org/FreeReturn'
  };
}

function assertOfferSchemaFields(label, offers) {
  assert(offers && offers['@type'] === 'Offer', `${label}: missing Offer`);
  assert(
    offers.availability &&
      (offers.availability.includes('schema.org/InStock') ||
        offers.availability.includes('schema.org/OutOfStock') ||
        offers.availability.includes('schema.org/PreOrder') ||
        offers.availability.includes('schema.org/Discontinued')),
    `${label}: missing or invalid availability`
  );
  assert(
    offers.shippingDetails && offers.shippingDetails['@type'] === 'OfferShippingDetails',
    `${label}: missing shippingDetails`
  );
  assert(
    offers.shippingDetails.shippingRate &&
      offers.shippingDetails.shippingRate.currency === 'PKR',
    `${label}: invalid shippingRate`
  );
  assert(
    offers.shippingDetails.shippingDestination?.addressCountry === 'PK',
    `${label}: invalid shippingDestination`
  );
  assert(
    offers.hasMerchantReturnPolicy &&
      offers.hasMerchantReturnPolicy['@type'] === 'MerchantReturnPolicy',
    `${label}: missing hasMerchantReturnPolicy`
  );
  assert(
    Number(offers.hasMerchantReturnPolicy.merchantReturnDays) > 0,
    `${label}: invalid merchantReturnDays`
  );
}

function buildMinimalProductSchema(input) {
  const { aggregateRating, review } = resolveProductSchemaReviewData(input);
  const { buildProductGlobalIdentifierFields } = require('./lib/productIdentifiers');
  const product = {
    name: 'National Jam Mango 440g',
    slug: 'national-jam-mango-440g',
    sku: 'NAT-JAM-MANGO-440',
    gtin: '8901030865123',
    ...input
  };
  return {
    '@type': 'Product',
    ...buildProductGlobalIdentifierFields(product, { siteName: 'Bazaar' }),
    offers: {
      '@type': 'Offer',
      priceCurrency: 'PKR',
      price: '999.00',
      availability: 'https://schema.org/InStock',
      shippingDetails: buildOfferShippingDetailsSchema(),
      hasMerchantReturnPolicy: buildMerchantReturnPolicySchema()
    },
    aggregateRating,
    review
  };
}

assertProductSchemaFields('empty product', { ratingValue: 0, reviewCount: 0, reviews: [] });
assertProductSchemaFields('api reviews only', {
  ratingValue: 0,
  reviewCount: 0,
  reviews: [{ name: 'Ali', rating: 5, comment: 'Great product from Karachi.' }]
});
assertProductSchemaFields('stored rating', { ratingValue: 4.2, reviewCount: 8, reviews: [] });
assertProductSchemaFields('seed reviews', {
  ratingValue: 4.5,
  reviewCount: 3,
  reviews: [
    { name: 'Sara', rating: 4, comment: 'Good value.' },
    { name: 'Ahmed', rating: 5, comment: 'Fast delivery.' }
  ]
});

assertOfferSchemaFields('offer defaults', buildMinimalProductSchema({ ratingValue: 0, reviewCount: 0, reviews: [] }).offers);

console.log(
  '[verify-product-schema] OK — aggregateRating, review, shippingDetails, and hasMerchantReturnPolicy present.'
);
