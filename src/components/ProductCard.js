import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import Skeleton from 'react-loading-skeleton';
import { Heart, ShoppingCart } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { productImageUrl } from '../lib/productImage';
import { buildProductImageAlt } from '../utils/imageAlt';
import { getCleanProductName } from '../lib/productDescription';
import ProductImage from './ProductImage';
import { formatPKR } from '../utils/currency';
import StarRating from './StarRating';
import { buildFakeReviews } from '../lib/fakeReviews';
import { buildProductPath, getProductCategorySlug } from '../utils/urls';
import ProductSaleRibbon from './ProductSaleRibbon';
import { useProductPrefetch } from '../hooks/useProductPrefetch';

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
  const slug = product?.slug || product?.productId || '';
  const prefetchHandlers = useProductPrefetch(slug);

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
    e.stopPropagation();
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
            baseColor="#f3f4f6"
            highlightColor="#fafafa"
            className="product-card__skeleton-img"
          />
        </div>
        <div className="product-info product-info--skeleton">
          <Skeleton width={90} height={12} baseColor="#e5e7eb" />
          <Skeleton height={16} style={{ marginTop: 8 }} baseColor="#e5e7eb" />
          <div className="product-card__skeleton-rating" style={{ marginTop: 6 }}>
            <Skeleton width={88} height={14} baseColor="#e5e7eb" />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
            <Skeleton height={22} width={80} baseColor="#e5e7eb" />
            <Skeleton height={36} width={36} style={{ borderRadius: 8 }} baseColor="#e5e7eb" />
          </div>
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

  const displayName = getCleanProductName(product);
  const productPath = buildProductPath(slug, getProductCategorySlug(product));
  const fake = buildFakeReviews(product);
  const ratingCount = fake.count;
  const rating = fake.rating;
  const imageUrl = productImageUrl(product);
  if (!imageUrl) return null;
  const badge = getDisplayBadge(product);
  const categoryLabel = formatCategoryLabel(product);
  const inStock =
    product.inStock !== false &&
    (product.stockQuantity == null || Number(product.stockQuantity) > 0);

  return (
    <article className={`product-card product-card--modern${layout === 'list' ? ' product-card--list' : ''}`}>
      <div className="product-image">
        <Link
          to={productPath}
          className="product-image-link product-image-link--cover"
          {...prefetchHandlers}
        >
          {imageUrl ? (
            <ProductImage
              className="product-image__img product-image__img--zoom"
              src={imageUrl}
              alt={buildProductImageAlt(product, { category: categoryLabel })}
              priority={imagePriority}
            />
          ) : (
            <span className="product-image__emoji" aria-hidden>
              {product.emoji || '📦'}
            </span>
          )}
        </Link>
        {badge === 'sale' ? (
          <ProductSaleRibbon discountPercent={discount} />
        ) : badge ? (
          <span className={`product-badge product-badge--${badge}`}>{badgeLabel(badge)}</span>
        ) : null}
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
        <Link to={productPath} className="product-name-link" {...prefetchHandlers}>
          <h3 className="product-name product-name--lines-1">{displayName}</h3>
        </Link>

        <div className="product-rating product-rating--stars">
          <StarRating
            value={rating}
            className="product-rating__stars"
          />
          <span className="rating-count">({ratingCount})</span>
        </div>

        <div className="product-card__footer-row">
          <div className="product-price">
            <span className="price-current">{formatPKR(price)}</span>
            {compareAt != null && Number(compareAt) > price && (
              <span className="price-original">{formatPKR(Number(compareAt))}</span>
            )}
          </div>
          {showAddToCartButton && (
            <button
              type="button"
              className="product-card__quick-cart-btn"
              onClick={handleAddToCart}
              disabled={!inStock}
              title={inStock ? 'Add to Cart' : 'Out of stock'}
              aria-label={inStock ? 'Add to Cart' : 'Out of stock'}
            >
              <ShoppingCart size={17} strokeWidth={2} />
            </button>
          )}
        </div>
      </div>
    </article>
  );
};

export default ProductCard;
