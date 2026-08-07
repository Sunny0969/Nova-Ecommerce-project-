import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Skeleton from 'react-loading-skeleton';
import api from '../api/client';
import { apiMessage } from '../lib/api';
import { buildBrandImageAlt } from '../utils/imageAlt';
import { buildBrandPath } from '../utils/urls';
import OptimizedImage from './OptimizedImage';
import './HomePopularBrands.css';

function unwrapBrands(res) {
  const d = res?.data?.data;
  return Array.isArray(d) ? d : [];
}

export default function HomePopularBrands() {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const scrollRef = useRef(null);

  const fetchBrands = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/api/brands/popular?limit=24');
      setBrands(unwrapBrands(res));
    } catch (err) {
      console.error(err);
      setError(String(apiMessage(err, 'Failed to load brands') || 'Failed to load brands'));
      setBrands([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBrands();
  }, [fetchBrands]);

  const scrollBy = (dir) => {
    const el = scrollRef.current;
    if (!el) return;
    const step = Math.max(280, el.clientWidth * 0.75);
    el.scrollBy({ left: dir * step, behavior: 'smooth' });
  };

  if (!loading && !error && brands.length === 0) {
    return null;
  }

  return (
    <section className="section home-popular-brands" aria-label="Popular brands">
      <div className="container">
        <div className="home-popular-brands__header">
          <div className="home-popular-brands__title-wrap">
            <h2 className="home-popular-brands__title">Popular Brands</h2>
            {!loading && !error && brands.length > 0 ? (
              <Link to="/brands" className="home-popular-brands__view-more">
                View More
              </Link>
            ) : null}
          </div>
          <div className="home-popular-brands__nav" aria-hidden={loading || brands.length < 5}>
            <button
              type="button"
              className="home-popular-brands__arrow"
              onClick={() => scrollBy(-1)}
              aria-label="Scroll brands left"
              disabled={loading}
            >
              <ChevronLeft size={20} strokeWidth={2} />
            </button>
            <button
              type="button"
              className="home-popular-brands__arrow"
              onClick={() => scrollBy(1)}
              aria-label="Scroll brands right"
              disabled={loading}
            >
              <ChevronRight size={20} strokeWidth={2} />
            </button>
          </div>
        </div>

        {loading ? (
          <ul className="home-popular-brands__track home-popular-brands__track--loading" aria-hidden>
            {Array.from({ length: 10 }).map((_, i) => (
              <li key={i} className="home-popular-brands__item">
                <div className="brand-tile brand-tile--skeleton">
                  <Skeleton height={100} borderRadius={12} />
                </div>
              </li>
            ))}
          </ul>
        ) : error ? (
          <div className="api-error-banner" role="alert">
            <p>
              <strong>Brands could not be loaded.</strong> {error}
            </p>
            <button type="button" className="btn btn-outline btn-sm" onClick={fetchBrands}>
              Retry
            </button>
          </div>
        ) : (
          <ul ref={scrollRef} className="home-popular-brands__track">
            {brands.map((brand) => {
              const slug = brand.slug || '';
              return (
                <li key={brand._id || slug} className="home-popular-brands__item">
                  <Link
                    to={buildBrandPath(slug)}
                    className="brand-tile"
                    title={`Shop ${brand.name} at Bazaar`}
                    aria-label={`${brand.name} — shop at Bazaar`}
                  >
                    {brand.imageUrl ? (
                      <OptimizedImage
                        className="brand-tile__img"
                        src={brand.imageUrl}
                        alt={buildBrandImageAlt(brand.name)}
                        width={240}
                        height={120}
                        optimizeWidth={240}
                        loading="lazy"
                      />
                    ) : (
                      <span className="brand-tile__fallback">{brand.name}</span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
