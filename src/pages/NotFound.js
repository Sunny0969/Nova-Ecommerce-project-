import React, { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import SEO from '../components/SEO';
import { unwrapCategoriesResponse, apiMessage } from '../lib/api';
import RecommendationRow from '../components/RecommendationRow';
import api, { recommendationsAPI } from 'api';
import { businessDisplayName } from '../utils/businessContact';
import { buildCategoryPath } from '../utils/urls';

export default function NotFound() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [popular, setPopular] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  const loadCategories = useCallback(async () => {
    setCategoriesLoading(true);
    try {
      const res = await api.get('/api/categories');
      const list = unwrapCategoriesResponse(res);
      const active = (Array.isArray(list) ? list : []).filter((c) => c.isActive !== false);
      setCategories(active.slice(0, 8));
    } catch (e) {
      console.error(apiMessage(e, 'Categories'));
      setCategories([]);
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    recommendationsAPI
      .trending({ limit: 12 })
      .then((r) => setPopular(r.data?.data?.products || []))
      .catch(() => setPopular([]));
  }, []);

  useEffect(() => {
    api
      .post('/api/seo/not-found', {
        path: pathname,
        referrer: typeof document !== 'undefined' ? document.referrer : '',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : ''
      })
      .catch(() => {});
  }, [pathname]);

  const handleSearch = (e) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    navigate(`/shop?search=${encodeURIComponent(q)}`);
  };

  return (
    <div className="section container not-found-page">
      <SEO
        noIndex
        title="Page Not Found"
        description="This page is not on Bazaar. Search products, browse categories, or contact us in Hyderabad for order help."
        canonicalUrl={pathname}
      />

      <div className="not-found-page__inner">
        <p className="not-found-page__code" aria-hidden>
          404
        </p>
        <h1 className="not-found-page__title">We couldn&apos;t find that page</h1>
        <p className="not-found-page__lede">
          The link may be outdated or mistyped. Search our catalog, jump to a popular category, or
          contact {businessDisplayName} if you need help with an order.
        </p>

        <form className="not-found-page__search" role="search" onSubmit={handleSearch}>
          <label htmlFor="not-found-search" className="visually-hidden">
            Search products
          </label>
          <Search size={20} className="not-found-page__search-icon" aria-hidden />
          <input
            id="not-found-search"
            type="search"
            className="form-control not-found-page__search-input"
            placeholder="Search products…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="submit" className="btn btn-primary not-found-page__search-btn">
            Search shop
          </button>
        </form>

        <div className="not-found-page__actions">
          <Link to="/" className="btn btn-primary">
            Go Home
          </Link>
          <Link to="/shop" className="btn btn-outline">
            Browse Shop
          </Link>
          <a href="/#footer-contact" className="btn btn-outline">
            Contact Us
          </a>
        </div>

        <section className="not-found-page__categories" aria-label="Top categories">
          <h2 className="not-found-page__section-title">Shop by category</h2>
          {categoriesLoading ? (
            <p className="empty-products-hint empty-products-hint--muted">Loading categories…</p>
          ) : categories.length === 0 ? (
            <p className="empty-products-hint empty-products-hint--muted">
              <Link to="/shop">Browse the full shop</Link> to explore products.
            </p>
          ) : (
            <ul className="not-found-page__category-grid">
              {categories.map((cat) => {
                const slug = (cat.slug || '').toLowerCase();
                const name = cat.name || slug || 'Category';
                if (!slug) return null;
                return (
                  <li key={cat._id || slug}>
                    <Link to={buildCategoryPath(slug)} className="not-found-page__category-card">
                      <span className="not-found-page__category-name">{name}</span>
                      <span className="not-found-page__category-cta">Shop →</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <RecommendationRow title="Bestsellers you may like" products={popular} />
      </div>
    </div>
  );
}
