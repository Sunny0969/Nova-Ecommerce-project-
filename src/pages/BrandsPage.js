import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Skeleton from 'react-loading-skeleton';
import SEO from '../components/SEO';
import api from '../api/client';
import { apiMessage } from '../lib/api';
import { buildMetaDescription, buildMetaKeywords, buildPageTitle } from '../utils/pageSeo';
import { buildBrandPath } from '../utils/urls';
import { buildBrandImageAlt } from '../utils/imageAlt';
import OptimizedImage from '../components/OptimizedImage';
import './BrandsPage.css';

function unwrapBrands(res) {
  const d = res?.data?.data;
  return Array.isArray(d) ? d : [];
}

export default function BrandsPage() {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/api/brands');
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
    load();
  }, [load]);

  return (
    <>
      <SEO
        title={buildPageTitle('Shop by Brand', 'Groceries & Essentials')}
        description={buildMetaDescription(
          'grocery brands Pakistan',
          'Browse trusted household and food brands with fast delivery.',
          'Shop popular brands at Bazaar — secure checkout and delivery across Pakistan.'
        )}
        keywords={buildMetaKeywords('brands', 'grocery brands', 'Bazaar', 'online shopping Pakistan')}
        canonicalUrl="/brands"
      />
      <header className="page-header page-header--product-detail">
        <div className="container">
          <ol className="breadcrumb" aria-label="Breadcrumb">
            <li>
              <Link to="/">Home</Link>
            </li>
            <li className="active" aria-current="page">
              Brands
            </li>
          </ol>
        </div>
      </header>

      <div className="section brands-page">
        <div className="container">
          <h1 className="brands-page__title">Shop by Brand</h1>
          <h2 className="visually-hidden">Browse all grocery and household brands</h2>

          {loading ? (
            <ul className="brands-page__grid brands-page__grid--loading" aria-hidden>
              {Array.from({ length: 24 }).map((_, i) => (
                <li key={i} className="brands-page__item">
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
              <button type="button" className="btn btn-outline btn-sm" onClick={load}>
                Retry
              </button>
            </div>
          ) : brands.length === 0 ? (
            <p className="brands-page__empty">No brands available yet.</p>
          ) : (
            <ul className="brands-page__grid">
              {brands.map((brand) => {
                const slug = brand.slug || '';
                return (
                  <li key={brand._id || slug} className="brands-page__item">
                    <Link
                      to={buildBrandPath(slug)}
                      className="brand-tile brand-tile--link"
                      aria-label={`Shop ${brand.name} products`}
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
      </div>
    </>
  );
}
