import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useCart } from '../context/CartContext';
import ProductCard from '../components/ProductCard';
import SEO from '../components/SEO';
import { unwrapFeaturedResponse, unwrapCategoriesResponse, apiMessage } from '../lib/api';
import {
  buildWebSiteWithSearchActionSchema,
  getSiteUrl,
  homeHeroImageUrl,
  promoBannerBgUrl
} from '../utils/seo';
import { formatPKR } from '../utils/currency';
import RecommendationRow from '../components/RecommendationRow';
import { recommendationsAPI } from '../api/axios';
import { getSessionId } from '../lib/sessionId';

/** Emoji icon by category slug (API-driven names; slug is stable). */
function iconForCategorySlug(slug) {
  const s = String(slug || '').toLowerCase();
  if (s.includes('electronic')) return '📱';
  if (s.includes('fashion')) return '👗';
  if (s.includes('home')) return '🏡';
  if (s.includes('beaut')) return '💄';
  if (s.includes('sport')) return '⚽';
  if (s.includes('book')) return '📚';
  if (s.includes('toy')) return '🧸';
  return '🛍️';
}

const HOME_CATEGORY_LIMIT = 5;

/** Featured strip: show up to 4 items from GET /api/products/featured (typically 3–4). */
const FEATURED_PRODUCT_LIMIT = 4;

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [featuredLoading, setFeaturedLoading] = useState(true);
  const [featuredError, setFeaturedError] = useState(null);
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState(null);
  const [promoCopied, setPromoCopied] = useState(false);
  const { addToCart } = useCart();
  const [homeRecs, setHomeRecs] = useState([]);

  useEffect(() => {
    fetchFeaturedProducts();
  }, []);

  useEffect(() => {
    const sid = getSessionId();
    recommendationsAPI
      .homepage({ sessionId: sid, limit: 12 })
      .then((r) => setHomeRecs(r.data?.data?.products || []))
      .catch(() => setHomeRecs([]));
  }, []);

  const fetchCategories = useCallback(async () => {
    setCategoriesLoading(true);
    setCategoriesError(null);
    try {
      const res = await axios.get('/api/categories');
      const list = unwrapCategoriesResponse(res);
      setCategories(list.slice(0, HOME_CATEGORY_LIMIT));
    } catch (error) {
      console.error('Categories fetch error:', error);
      setCategoriesError(apiMessage(error, 'Failed to load categories'));
      setCategories([]);
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const fetchFeaturedProducts = async () => {
    setFeaturedLoading(true);
    setFeaturedError(null);
    try {
      const response = await axios.get('/api/products/featured');
      const list = unwrapFeaturedResponse(response);
      setFeaturedProducts(list.slice(0, FEATURED_PRODUCT_LIMIT));
    } catch (error) {
      console.error('Error fetching products:', error);
      const msg =
        error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')
          ? 'Cannot reach the API. Start the backend (port 5000) — from the project folder run npm run dev, or cd backend && npm start.'
          : apiMessage(error, 'Failed to load products');
      setFeaturedError(msg);
      setFeaturedProducts([]);
    } finally {
      setFeaturedLoading(false);
    }
  };

  const handleAddToCart = async (product) => {
    await addToCart(product, 1);
  };

  const PROMO_CODE = 'NOVA20';

  const handleCopyPromoCode = async () => {
    try {
      await navigator.clipboard.writeText(PROMO_CODE);
      setPromoCopied(true);
      window.setTimeout(() => setPromoCopied(false), 2500);
    } catch {
      toast.error('Could not copy — try selecting the code manually.');
    }
  };

  return (
    <>
      <SEO
        title="Premium Online Shopping"
        description="Shop premium products with fast delivery and secure checkout. Nova Shop offers curated style across electronics, fashion, home, beauty, and sports. Find your next favorite online."
        schema={buildWebSiteWithSearchActionSchema(getSiteUrl() || undefined)}
        preload={[{ href: homeHeroImageUrl, as: 'image', crossOrigin: 'anonymous' }]}
      />

      {/* Hero — split: copy + lifestyle image (Nova Shop) */}
      <section className="hero hero--home" aria-label="Hero banner">
        <div className="hero__copy">
          <div className="hero__copy-inner container">
            <p className="hero-badge">New season collection</p>
            <h1 className="hero-title">
              Discover <em>Premium</em> Style &amp; Living
            </h1>
            <p className="hero-lead">
              Curated collections of the world&apos;s finest products — delivered to your door with
              next-day shipping.
            </p>
            <div className="hero-actions">
              <Link to="/shop" className="btn btn-primary btn-hero-primary">
                Shop now →
              </Link>
              <a href="#featured" className="btn btn-outline btn-hero-outline">
                View collections
              </a>
            </div>
            <div className="hero-stats" role="group" aria-label="Store highlights">
              <div className="hero-stat">
                <span className="hero-stat__value">10K+</span>
                <span className="hero-stat__label">Products</span>
              </div>
              <span className="hero-stats__divider" aria-hidden="true" />
              <div className="hero-stat">
                <span className="hero-stat__value">50K+</span>
                <span className="hero-stat__label">Customers</span>
              </div>
              <span className="hero-stats__divider" aria-hidden="true" />
              <div className="hero-stat">
                <span className="hero-stat__value">4.9★</span>
                <span className="hero-stat__label">Rating</span>
              </div>
            </div>
          </div>
        </div>
        <div className="hero__media">
          <img
            className="hero__media-img"
            src={homeHeroImageUrl}
            alt=""
            width={1200}
            height={1800}
            decoding="async"
            fetchPriority="high"
            loading="eager"
          />
          <div className="hero__media-scrim" aria-hidden="true" />
        </div>
      </section>

      <section className="section bg-cream home-categories" id="categories" aria-label="Shop categories">
        <div className="container">
          <div className="section-header text-center home-categories__header">
            <p className="home-categories__label">Browse by category</p>
            <h2 className="home-categories__title">What Are You Looking For?</h2>
          </div>

          {categoriesLoading ? (
            <div className="categories-grid home-categories-grid home-categories-grid--loading" aria-busy="true">
              {Array.from({ length: HOME_CATEGORY_LIMIT }).map((_, i) => (
                <div key={i} className="home-category-card home-category-card--skeleton" aria-hidden="true">
                  <span className="home-category-card__icon-skel" />
                  <span className="home-category-card__name-skel" />
                </div>
              ))}
            </div>
          ) : categoriesError ? (
            <div className="home-categories__error" role="alert">
              <p>{categoriesError}</p>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => fetchCategories()}>
                Retry
              </button>
            </div>
          ) : categories.length === 0 ? (
            <p className="empty-products-hint empty-products-hint--muted home-categories__empty">
              No categories available yet.
            </p>
          ) : (
            <div className="categories-grid home-categories-grid">
              {categories.map((cat) => {
                const slug = cat.slug || '';
                const name = cat.name || slug;
                const icon = cat.image?.url ? null : iconForCategorySlug(slug);
                return (
                  <Link
                    key={cat._id || slug}
                    to={`/category/${encodeURIComponent(slug)}`}
                    className="home-category-card"
                  >
                    {cat.image?.url ? (
                      <span className="home-category-card__thumb-wrap">
                        <img
                          src={cat.image.url}
                          alt=""
                          className="home-category-card__thumb"
                          width={480}
                          height={480}
                          loading="lazy"
                          decoding="async"
                        />
                      </span>
                    ) : (
                      <span className="home-category-card__icon" aria-hidden>
                        {icon}
                      </span>
                    )}
                    <span className="home-category-card__name">{name}</span>
                    {typeof cat.productCount === 'number' && cat.productCount > 0 && (
                      <span className="home-category-card__count">{cat.productCount} items</span>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section className="section home-featured" id="featured" aria-label="Featured products">
        <div className="container">
          <div className="section-header section-header-flex home-featured__header">
            <div className="home-featured__intro">
              <p className="home-featured__label">Handpicked for you</p>
              <h2 className="home-featured__title">Featured Products</h2>
            </div>
            <Link to="/shop" className="home-featured__view-all">
              View all →
            </Link>
          </div>
          {featuredLoading ? (
            <div className="products-grid home-featured__grid">
              {Array.from({ length: FEATURED_PRODUCT_LIMIT }).map((_, i) => (
                <ProductCard key={i} loading />
              ))}
            </div>
          ) : featuredError ? (
            <div className="api-error-banner" role="alert">
              <p>
                <strong>Featured products could not be loaded.</strong> {featuredError}
              </p>
              <button type="button" className="btn btn-outline btn-sm" onClick={fetchFeaturedProducts}>
                Retry
              </button>
            </div>
          ) : featuredProducts.length === 0 ? (
            <p className="empty-products-hint empty-products-hint--muted home-featured__empty">
              No products yet. Restart the backend to auto-seed demos, or run{' '}
              <code>node scripts/seedDatabase.js</code> in <code>backend</code>, then refresh.
            </p>
          ) : (
            <div className="products-grid home-featured__grid">
              {featuredProducts.map((product, idx) => (
                <ProductCard
                  key={product._id}
                  product={product}
                  onAddToCart={handleAddToCart}
                  imagePriority={idx === 0}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <div className="container">
        <RecommendationRow title="Recommended for you" products={homeRecs} />
      </div>

      <section
        className="promo-banner promo-banner--nova"
        aria-label="Promotional offer"
        style={{ '--promo-bg-image': `url("${promoBannerBgUrl}")` }}
      >
        <div className="container promo-content">
          <p className="promo-banner__badge">Limited time</p>
          <h2 className="promo-banner__title">Get 20% Off Your First Order</h2>
          <p className="promo-banner__sub">Use the code below at checkout. Valid for new customers only.</p>
          <div className="promo-code promo-code--nova">
            <span className="promo-code__value">{PROMO_CODE}</span>
            <button type="button" className="promo-copy-btn" onClick={handleCopyPromoCode}>
              {promoCopied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <Link to="/shop" className="btn btn-gold promo-banner__cta">
            Shop the sale →
          </Link>
        </div>
      </section>

      <section className="section bg-cream trust-badges" aria-label="Why choose us">
        <div className="container">
          <div className="section-header text-center">
            <span className="section-tag">WHY NOVA SHOP</span>
            <h2>Shopping Made Simple</h2>
          </div>
          <div className="trust-grid">
            <div className="trust-card">
              <div className="trust-card__icon">🚚</div>
              <h4>Free Delivery</h4>
              <p>On orders over {formatPKR(50)}. Next-day available.</p>
            </div>
            <div className="trust-card">
              <div className="trust-card__icon">🔒</div>
              <h4>Secure Payments</h4>
              <p>SSL encrypted. Pay with card, PayPal & more.</p>
            </div>
            <div className="trust-card">
              <div className="trust-card__icon">↩️</div>
              <h4>Easy Returns</h4>
              <p>30-day hassle-free returns policy.</p>
            </div>
            <div className="trust-card">
              <div className="trust-card__icon">💬</div>
              <h4>24/7 Support</h4>
              <p>Live chat, email or phone — always here.</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Home;
