import React from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import { useWishlist } from '../context/WishlistContext';
import ProductCard from '../components/ProductCard';
import { useCart } from '../context/CartContext';

export default function WishlistPage({ embedded }) {
  const { products, loading } = useWishlist();
  const { addToCart } = useCart();

  const handleAdd = async (product) => {
    await addToCart(product, 1);
  };

  /** Map wishlist products to ProductCard shape (imageUrl, rating, etc.) */
  const shaped = (p) => ({
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
  });

  const grid = (
    <>
      {loading ? (
        <div className="products-grid">
          {[1, 2, 3, 4].map((i) => (
            <ProductCard key={i} loading />
          ))}
        </div>
      ) : products.length === 0 ? (
        <p className="empty-products-hint">
          No saved items yet.{' '}
          <Link to="/shop">Browse products</Link>
        </p>
      ) : (
        <div className="products-grid">
          {products.map((p) => (
            <ProductCard key={p._id} product={shaped(p)} onAddToCart={handleAdd} />
          ))}
        </div>
      )}
    </>
  );

  if (embedded) {
    return (
      <>
        <SEO
          noIndex
          title="Wishlist"
          description="Your saved products at Bazaar. Add to cart when you are ready to buy."
        />
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Wishlist</h2>
        {grid}
      </>
    );
  }

  return (
    <>
      <SEO
        noIndex
        title="Wishlist"
        description="Save your favorite Bazaar products, compare later, and add to cart in one click."
        canonicalUrl="/wishlist"
      />
      <header className="page-header">
        <div className="container">
          <h1 className="page-header__title">Wishlist</h1>
          <p className="page-header__subtitle">Your saved products — add to cart when you are ready.</p>
          <ol className="breadcrumb" aria-label="Breadcrumb">
            <li>
              <Link to="/">Home</Link>
            </li>
            <li className="active" aria-current="page">
              Wishlist
            </li>
          </ol>
        </div>
      </header>
      <div className="section wishlist-page">
        <div className="container">{grid}</div>
      </div>
    </>
  );
}
