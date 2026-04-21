import React, { useCallback, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import SEO from '../components/SEO';
import { unwrapCategoriesResponse, apiMessage } from '../lib/api';
import RecommendationRow from '../components/RecommendationRow';
import api, { recommendationsAPI } from '../api/axios';

const SUPPORT_MAIL = 'support@novashop.com';

export default function NotFound() {
  const { pathname } = useLocation();
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [popular, setPopular] = useState([]);

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

  return (
    <main className="section container not-found-page" id="main-content">
      <SEO
        noIndex
        title="404 - Page Not Found"
        description="The page you requested does not exist on Nova Shop. Go home, browse the shop, or contact support for help."
        canonicalUrl={pathname}
      />

      <div className="not-found-page__inner">
        <p className="not-found-page__code" aria-hidden>
          404
        </p>
        <h1 className="not-found-page__title">404 — Page Not Found</h1>
        <p className="not-found-page__lede">
          The link may be broken, or the page may have been removed. Use the shortcuts below to get back to
          shopping, or reach our team if you need help with an order.
        </p>

        <div className="not-found-page__actions">
          <Link to="/" className="btn btn-primary">
            Go Home
          </Link>
          <Link to="/shop" className="btn btn-outline">
            Browse Shop
          </Link>
          <a href={`mailto:${SUPPORT_MAIL}`} className="btn btn-outline">
            Contact Support
          </a>
        </div>

        <section className="not-found-page__categories" aria-label="Popular categories">
          <h2 className="not-found-page__section-title">Popular categories</h2>
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
                    <Link to={`/shop?category=${encodeURIComponent(slug)}`} className="not-found-page__category-card">
                      <span className="not-found-page__category-name">{name}</span>
                      <span className="not-found-page__category-cta">Shop →</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <RecommendationRow title="Popular products" products={popular} />
      </div>
    </main>
  );
}
