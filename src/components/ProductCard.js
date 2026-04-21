import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import Skeleton from 'react-loading-skeleton';
import { Heart } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { productImageUrl } from '../lib/productImage';
import ProductImage from './ProductImage';
import { formatPKR } from '../utils/currency';
import StarRating from './StarRating';
import { buildFakeReviews } from '../lib/fakeReviews';

function formatCategoryLabel(product) {
  const raw =
    typeof product.category === 'string'
      ? product.category
      : product.category?.slug || product.category?.name || '';
  if (!raw) return '';
  return String(raw)
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function getDisplayBadge(product) {
  const price = Number(product.price);
  const compareAt = product.originalPrice ?? product.comparePrice;
  if (compareAt != null && Number(compareAt) > price) return 'sale';

  if (product.badge) {
    const b = String(product.badge).toLowerCase();
    if (['sale', 'new', 'bestseller'].includes(b)) return b;
  }
  if (
    Array.isArray(product.tags) &&
    product.tags.some((t) => String(t).toLowerCase() === 'new')
  ) {
    return 'new';
  }
  if (product.isFeatured) return 'bestseller';
  return null;
}

function badgeLabel(badge) {
  switch (badge) {
    case 'sale':
      return 'Sale';
    case 'new':
      return 'New';
    case 'bestseller':
      return 'Bestseller';
    default:
      return badge;
  }
}

const ProductCard = ({
  product,
  onAddToCart,
  loading,
  layout = 'grid',
  showWishlistButton = true,
  showAddToCartButton = true,
  imagePriority = false
}) => {
  const { toggleWishlist, products: wishProducts } = useWishlist();

  const inWishlist = useMemo(() => {
    if (!product?._id) return false;
    return wishProducts.some((p) => String(p._id || p) === String(product._id));
  }, [product, wishProducts]);

  const handleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (product) toggleWishlist(product);
  };

  const handleAddToCart = (e) => {
    e.preventDefault();
    if (onAddToCart) onAddToCart(product);
  };

  if (loading) {
    return (
      <article
        className={`product-card product-card--skeleton${layout === 'list' ? ' product-card--list' : ''}`}
        aria-busy="true"
        aria-hidden="true"
      >
        <div className="product-image product-image--skeleton">
          <Skeleton
            height="100%"
            baseColor="#ebe6df"
            highlightColor="#f7f4ef"
            className="product-card__skeleton-img"
          />
        </div>
        <div className="product-info product-info--skeleton">
          <Skeleton width={90} height={11} baseColor="#e5e5e5" />
          <Skeleton height={15} style={{ marginTop: 10 }} baseColor="#e5e5e5" />
          <Skeleton height={15} width="78%" style={{ marginTop: 6 }} baseColor="#e5e5e5" />
          <div className="product-card__skeleton-rating">
            <Skeleton width={88} height={14} baseColor="#e5e5e5" />
          </div>
          <Skeleton height={22} width={110} style={{ marginTop: 10 }} baseColor="#e5e5e5" />
          <Skeleton
            height={44}
            style={{ marginTop: 14, borderRadius: 8 }}
            baseColor="#d4d4d4"
          />
        </div>
      </article>
    );
  }

  if (!product) return null;

  const compareAt = product.originalPrice ?? product.comparePrice;
  const price = Number(product.price);
  const discount =
    compareAt != null && Number(compareAt) > price
      ? Math.round(((Number(compareAt) - price) / Number(compareAt)) * 100)
      : 0;

  const slug = product.slug || product.productId;
  const fake = buildFakeReviews(product);
  const ratingCount = fake.count;
  const rating = fake.rating;
  const imageUrl = productImageUrl(product);
  const badge = getDisplayBadge(product);
  const categoryLabel = formatCategoryLabel(product);
  const inStock =
    product.inStock !== false &&
    (product.stockQuantity == null || Number(product.stockQuantity) > 0);

  return (
    <article className={`product-card${layout === 'list' ? ' product-card--list' : ''}`}>
      <div className="product-image">
        <Link to={`/shop/${slug}`} className="product-image-link product-image-link--cover">
          {imageUrl ? (
            <ProductImage
              className="product-image__img product-image__img--zoom"
              src={imageUrl}
              alt={product.name}
              priority={imagePriority}
            />
          ) : (
            <span className="product-image__emoji" aria-hidden>
              {product.emoji || '📦'}
            </span>
          )}
        </Link>
        {badge && (
          <span className={`product-badge product-badge--${badge}`}>{badgeLabel(badge)}</span>
        )}
        {showWishlistButton ? (
          <button
            type="button"
            className={`product-card__wishlist ${inWishlist ? 'product-card__wishlist--active' : ''}`}
            onClick={handleWishlist}
            aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
            aria-pressed={inWishlist}
          >
            <Heart size={18} strokeWidth={1.75} fill={inWishlist ? 'currentColor' : 'none'} />
          </button>
        ) : null}
      </div>
      <div className="product-info">
        {categoryLabel ? (
          <div className="product-category product-category--muted">{categoryLabel}</div>
        ) : null}
        <Link to={`/shop/${slug}`} className="product-name-link">
          <h3 className="product-name product-name--lines-2">{product.name}</h3>
        </Link>
        <div className="product-rating product-rating--stars">
          <StarRating
            value={rating}
            className="product-rating__stars"
          />
          <span className="rating-count">({ratingCount})</span>
        </div>
        <div className="product-price">
          <span className="price-current">{formatPKR(price)}</span>
          {compareAt != null && Number(compareAt) > price && (
            <>
              <span className="price-original">{formatPKR(Number(compareAt))}</span>
              <span className="price-discount">-{discount}%</span>
            </>
          )}
        </div>
        {showAddToCartButton ? (
          <button
            type="button"
            className="product-card__add-cart"
            onClick={handleAddToCart}
            disabled={!inStock}
          >
            {inStock ? 'Add to Cart' : 'Out of stock'}
          </button>
        ) : null}
      </div>
    </article>
  );
};

export default ProductCard;
