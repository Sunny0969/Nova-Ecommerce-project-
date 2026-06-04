import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useCart } from '../context/CartContext';
import ProductCard from '../components/ProductCard';
import SEO from '../components/SEO';
import { unwrapFeaturedResponse, unwrapCategoriesResponse, apiMessage } from '../lib/api';
import HomeCategoryStrip from '../components/HomeCategoryStrip';
import HomeBannerSlider from '../components/HomeBannerSlider';
import HomeHero from '../components/HomeHero';
import HomeCategoriesGrid from '../components/HomeCategoriesGrid';
import HomeFlashSale from '../components/HomeFlashSale';
import HomePopularBrands from '../components/HomePopularBrands';
import {
  buildWebSiteWithSearchActionSchema,
  getSiteUrl,
  promoBannerBgUrl
} from '../utils/seo';
import { formatPKR } from '../utils/currency';
import RecommendationRow from '../components/RecommendationRow';
import api, { recommendationsAPI, productsAPI } from 'api';
import { getSessionId } from '../lib/sessionId';

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
      const res = await api.get('/api/categories');
      const list = unwrapCategoriesResponse(res);
      setCategories(list);
    } catch (error) {
      console.error('Categories fetch error:', error);
      setCategoriesError(String(apiMessage(error, 'Failed to load categories') || 'Failed to load categories'));
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
      const response = await productsAPI.getFeatured();
      const list = unwrapFeaturedResponse(response);
      setFeaturedProducts(list.slice(0, FEATURED_PRODUCT_LIMIT));
    } catch (error) {
      console.error('Error fetching products:', error);
      const isNet =
        error.code === 'ERR_NETWORK' || error.message?.includes('Network Error');
      const msg = isNet
        ? process.env.NODE_ENV === 'development'
          ? 'Cannot reach the API. Start the backend (port 5001) — from the project folder run npm run dev, or cd backend && npm start.'
          : 'Cannot load products. Set REACT_APP_API_URL to your Render API URL in .env.production, then run npm run build and upload the new build folder. Check browser DevTools → Network if it still fails.'
        : apiMessage(error, 'Failed to load products');
      setFeaturedError(String(msg || 'Failed to load products'));
      setFeaturedProducts([]);
    } finally {
      setFeaturedLoading(false);
    }
  };

  const handleAddToCart = async (product) => {
    await addToCart(product, 1);
  };

  const PROMO_CODE = 'Souvenir Handicraft20';

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
        title="Rozana — Online Shopping Pakistan"
        description="Rozana — sab kuch ghar pe, sasti qeemat pe. Shop fashion, grocery, electronics and more with fast delivery across Pakistan."
        schema={buildWebSiteWithSearchActionSchema(getSiteUrl() || undefined)}
      />

      <HomeCategoryStrip />

      <div className="home-top-stack">
        <HomeBannerSlider />
        <HomeHero />
      </div>

      <section className="section bg-cream home-categories-browse" id="categories" aria-label="Shop categories">
        <div className="container">
          <h2 className="home-categories-browse__title">Categories</h2>
          <HomeCategoriesGrid
            categories={categories}
            loading={categoriesLoading}
            error={categoriesError}
            onRetry={fetchCategories}
          />
        </div>
      </section>

      <HomePopularBrands />

      <HomeFlashSale />

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
              Coming Soon — featured products will appear here when they are added to the store.
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
        className="promo-banner promo-banner--Souvenir Handicrat"
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
            <span className="section-tag">WHY Souvenir Handicraft</span>
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
