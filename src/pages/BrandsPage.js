import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Skeleton from 'react-loading-skeleton';
import SEO from '../components/SEO';
import api from 'api';
import { apiMessage } from '../lib/api';
import { buildMetaDescription, buildMetaKeywords, buildPageTitle } from '../utils/pageSeo';
import { buildBrandPath } from '../utils/urls';
import { buildBrandImageAlt } from '../utils/imageAlt';
import { optimizeImageUrl } from '../utils/optimizedImageUrl';
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
            <div className="brands-page__grid brands-page__grid--loading">
              {Array.from({ length: 24 }).map((_, i) => (
                <div key={i} className="brand-tile brand-tile--skeleton">
                  <Skeleton height={100} borderRadius={12} />
                </div>
              ))}
            </div>
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
            <div className="brands-page__grid" role="list">
              {brands.map((brand) => {
                const slug = brand.slug || '';
                return (
                  <Link
                    key={brand._id || slug}
                    to={buildBrandPath(slug)}
                    className="brand-tile brand-tile--link"
                    role="listitem"
                    aria-label={`Shop ${brand.name} products`}
                  >
                    {brand.imageUrl ? (
                      <OptimizedImage
                        className="brand-tile__img"
                        src={optimizeImageUrl(brand.imageUrl, { width: 240, quality: 80 })}
                        alt={buildBrandImageAlt(brand.name)}
                        width={240}
                        height={120}
                        optimize={false}
                      />
                    ) : (
                      <span className="brand-tile__fallback">{brand.name}</span>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
