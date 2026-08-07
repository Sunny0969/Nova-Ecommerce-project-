import React, { useEffect, useMemo, useState } from 'react';
import SEO from './SEO';
import {
  buildProductSchema,
  buildSpeakableSpecificationSchema,
  getProductPageReviews,
  getProductRatingForSchema
} from '../utils/jsonLd';
import { buildFakeReviews } from '../lib/fakeReviews';
import { fetchProductReviews } from '../api/products';
import { getCanonicalUrl } from '../utils/seo';
import { resolveProductOfferAvailability } from '../utils/productAvailability';

/**
 * Product detail JSON-LD (Product + optional Speakable) via react-helmet.
 */
export default function ProductSchemaMarkup({
  product,
  canonicalPath,
  images = [],
  price,
  inStock = true,
  storeSettings,
  speakableSelectors = ['.product-detail-title', '.product-detail-short']
}) {
  const fake = useMemo(() => (product ? buildFakeReviews(product) : null), [product]);
  const [apiReviews, setApiReviews] = useState([]);

  const slug = product?.slug || product?.productId;

  useEffect(() => {
    if (!slug) {
      setApiReviews([]);
      return undefined;
    }
    let cancelled = false;
    fetchProductReviews(slug, 5)
      .then((rows) => {
        if (!cancelled) setApiReviews(rows);
      })
      .catch(() => {
        if (!cancelled) setApiReviews([]);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const canonicalUrl = useMemo(
    () => getCanonicalUrl(canonicalPath || '/shop'),
    [canonicalPath]
  );

  const schema = useMemo(() => {
    if (!product) return null;
    const { ratingValue, reviewCount } = getProductRatingForSchema(product, fake);
    const availability = resolveProductOfferAvailability(product, { inStock });
    const pageReviews = apiReviews.length
      ? apiReviews
      : getProductPageReviews(product, fake);
    const productLd = buildProductSchema(product, {
      canonicalUrl,
      images,
      price,
      inStock: availability.isAvailable,
      ratingValue,
      reviewCount,
      reviews: pageReviews,
      storeSettings
    });
    const speakable = buildSpeakableSpecificationSchema(canonicalUrl, speakableSelectors);
    return speakable ? [productLd, speakable] : productLd;
  }, [
    product,
    fake,
    apiReviews,
    canonicalUrl,
    images,
    price,
    inStock,
    storeSettings,
    speakableSelectors
  ]);

  if (!product || !schema) return null;

  return <SEO schema={schema} />;
}
