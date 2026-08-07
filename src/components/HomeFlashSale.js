import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Skeleton from 'react-loading-skeleton';
import { productsAPI } from '../api/storefront';
import { unwrapFeaturedResponse, apiMessage } from '../lib/api';
import { filterOnSaleProducts } from '../lib/productSale';
import FlashSaleCard from './FlashSaleCard';
import './HomeFlashSale.css';

const FETCH_LIMIT = 48;

function useColsPerRow() {
  const [cols, setCols] = useState(8);

  useEffect(() => {
    const mqSm = window.matchMedia('(max-width: 639px)');
    const mqMd = window.matchMedia('(max-width: 1023px)');

    const update = () => {
      if (mqSm.matches) setCols(2);
      else if (mqMd.matches) setCols(4);
      else setCols(8);
    };

    update();
    mqSm.addEventListener('change', update);
    mqMd.addEventListener('change', update);
    return () => {
      mqSm.removeEventListener('change', update);
      mqMd.removeEventListener('change', update);
    };
  }, []);

  return cols;
}

function chunkArray(list, size) {
  if (!size || size < 1) return [list];
  const out = [];
  for (let i = 0; i < list.length; i += size) {
    out.push(list.slice(i, i + size));
  }
  return out;
}

export default function HomeFlashSale() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);

  const cols = useColsPerRow();
  const maxRows = 2;
  const pageSize = cols * maxRows;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await productsAPI.getFlashSale({ limit: FETCH_LIMIT });
        const list = unwrapFeaturedResponse(res);
        if (!cancelled) {
          setProducts(filterOnSaleProducts(Array.isArray(list) ? list : []));
          setPage(0);
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setError(String(apiMessage(err, 'Failed to load flash sale') || 'Failed to load flash sale'));
          setProducts([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const useSlider = products.length > pageSize;
  const pages = useMemo(
    () => (useSlider ? chunkArray(products, pageSize) : [products]),
    [products, pageSize, useSlider]
  );

  const totalPages = pages.length;
  const safePage = Math.min(page, Math.max(0, totalPages - 1));

  useEffect(() => {
    if (page !== safePage) setPage(safePage);
  }, [page, safePage]);

  const goPrev = () => setPage((p) => Math.max(0, p - 1));
  const goNext = () => setPage((p) => Math.min(totalPages - 1, p + 1));

  if (!loading && !error && products.length === 0) {
    return null;
  }

  const gridStyle = {
    '--flash-sale-cols': String(cols)
  };

  return (
    <section className="section home-flash-sale" id="flash-sale" aria-label="Flash sale">
      <div className="container">
        <div className="home-flash-sale__header">
          <div className="home-flash-sale__title-wrap">
            <div className="home-flash-sale__title-block">
              <p className="home-flash-sale__eyebrow">Limited time</p>
              <h2 className="home-flash-sale__title">Flash Sale</h2>
            </div>
            {!loading && !error && products.length > 0 ? (
              <Link to="/shop?onSale=true" className="home-flash-sale__view-all">
                Shop flash sale deals online →
              </Link>
            ) : null}
          </div>
          {useSlider && !loading && !error ? (
            <div className="home-flash-sale__nav" aria-label="Flash sale pages">
              <button
                type="button"
                className="home-flash-sale__arrow"
                onClick={goPrev}
                disabled={safePage <= 0}
                aria-label="Previous flash sale products"
              >
                <ChevronLeft size={20} strokeWidth={2} />
              </button>
              <button
                type="button"
                className="home-flash-sale__arrow"
                onClick={goNext}
                disabled={safePage >= totalPages - 1}
                aria-label="Next flash sale products"
              >
                <ChevronRight size={20} strokeWidth={2} />
              </button>
            </div>
          ) : null}
        </div>

        {loading ? (
          <div
            className="flash-sale-grid flash-sale-grid--loading"
            style={gridStyle}
            aria-busy="true"
          >
            {Array.from({ length: pageSize }).map((_, i) => (
              <div key={i} className="flash-sale-card flash-sale-card--skeleton">
                <Skeleton height={120} borderRadius={12} />
                <Skeleton height={14} count={2} style={{ marginTop: 8 }} />
                <Skeleton height={18} width="70%" style={{ marginTop: 8 }} />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="api-error-banner" role="alert">
            <p>
              <strong>Flash sale could not be loaded.</strong> {error}
            </p>
          </div>
        ) : (
          <div className={`home-flash-sale__body${useSlider ? ' home-flash-sale__body--slider' : ''}`}>
            <div className="home-flash-sale__viewport">
              {useSlider ? (
                <div
                  className="home-flash-sale__track"
                  style={{ transform: `translateX(-${safePage * 100}%)` }}
                >
                  {pages.map((chunk, pageIndex) => (
                    <div
                      key={`page-${pageIndex}`}
                      className="flash-sale-grid flash-sale-page"
                      style={gridStyle}
                    >
                      {chunk.map((product, idx) => (
                        <FlashSaleCard
                          key={product._id || product.slug}
                          product={product}
                          imagePriority={pageIndex === 0 && idx < cols}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flash-sale-grid" style={gridStyle}>
                  {products.map((product, idx) => (
                    <FlashSaleCard
                      key={product._id || product.slug}
                      product={product}
                      imagePriority={idx < cols}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {useSlider && !loading && !error && totalPages > 1 ? (
          <div className="home-flash-sale__dots" role="tablist" aria-label="Flash sale pages">
            {pages.map((_, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={i === safePage}
                className={`home-flash-sale__dot${i === safePage ? ' home-flash-sale__dot--active' : ''}`}
                onClick={() => setPage(i)}
                aria-label={`Page ${i + 1} of ${totalPages}`}
              />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
