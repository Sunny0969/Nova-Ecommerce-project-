import { useMemo } from 'react';
import { getProductRatingForSchema } from '../utils/jsonLd';
import { buildFakeReviews } from '../lib/fakeReviews';

/**
 * Resolve display + schema rating for a product (API reviews + UI seed reviews).
 * @param {object|null} product
 */
export function useProductRating(product) {
  const fake = useMemo(() => (product ? buildFakeReviews(product) : { rating: 0, count: 0 }), [product]);

  return useMemo(() => {
    if (!product) {
      return {
        loading: false,
        ratingValue: 0,
        reviewCount: 0,
        aggregateRating: null,
        fake
      };
    }
    const { ratingValue, reviewCount } = getProductRatingForSchema(product, fake);
    return {
      loading: false,
      ratingValue,
      reviewCount,
      displayRating: fake.count > 0 ? fake.rating : ratingValue,
      displayCount: fake.count > 0 ? fake.count : reviewCount,
      fake
    };
  }, [product, fake]);
}
