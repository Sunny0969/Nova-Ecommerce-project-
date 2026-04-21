import React from 'react';
import { Link } from 'react-router-dom';
import { useWishlist } from '../../context/WishlistContext';
import { useCart } from '../../context/CartContext';
import ProductCard from '../../components/ProductCard';

function shapeProduct(p) {
  return {
    ...p,
    productId: p.slug,
    imageUrl: p.images?.[0]?.url || '',
    category: p.category?.slug || p.category || '',
    rating: Number(p.ratings) || 0,
    ratingCount: p.numReviews ?? 0,
    originalPrice: p.comparePrice,
    badge: p.isFeatured ? 'bestseller' : '',
    inStock: (p.stock ?? 0) > 0,
    stockQuantity: p.stock
  };
}

export default function Wishlist() {
  const { products, loading, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();

  return (
    <div className="account-page account-wishlist-page">
      <h2 className="account-page__title">Wishlist</h2>

      {loading ? (
        <div className="products-grid">
          {[1, 2, 3, 4].map((i) => (
            <ProductCard key={i} loading />
          ))}
        </div>
      ) : products.length === 0 ? (
        <p className="empty-products-hint">
          No saved items yet.{' '}
          <Link to="/shop" className="btn btn-primary btn-sm">
            Browse products
          </Link>
        </p>
      ) : (
        <div className="account-wishlist__grid">
          {products.map((p) => (
            <div key={p._id} className="account-wishlist__cell">
              <ProductCard
                product={shapeProduct(p)}
                showWishlistButton={false}
                showAddToCartButton={false}
              />
              <div className="account-wishlist__actions">
                <button
                  type="button"
                  className="btn btn-primary btn-sm btn-full"
                  onClick={() => addToCart(shapeProduct(p), 1)}
                >
                  Move to cart
                </button>
                <button
                  type="button"
                  className="btn btn-outline btn-sm btn-full"
                  onClick={() => removeFromWishlist(p._id)}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
