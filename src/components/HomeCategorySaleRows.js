import React, { useEffect, useState } from 'react';
import ProductCard from './ProductCard';
import { productsAPI } from '../api/storefront';
import { apiMessage } from '../lib/api';
import CategorySaleRow from './CategorySaleRow';
import './HomeCategorySaleRows.css';

const CATEGORY_LIMIT = 5;
const PRODUCTS_PER_CATEGORY = 12;

function unwrapCategorySaleRows(res) {
  const rows = res?.data?.data?.rows;
  return Array.isArray(rows) ? rows : [];
}

export default function HomeCategorySaleRows({ onAddToCart }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await productsAPI.getHomeCategorySales({
          categories: CATEGORY_LIMIT,
          productsPerCategory: PRODUCTS_PER_CATEGORY
        });
        if (!cancelled) setRows(unwrapCategorySaleRows(res));
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setError(String(apiMessage(err, 'Failed to load sale categories') || 'Failed to load sale categories'));
          setRows([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!loading && !error && rows.length === 0) {
    return null;
  }

  return (
    <section className="section home-category-sales" id="category-sales" aria-label="Category sales">
      <div className="container">
        {loading ? (
          <div className="home-category-sales__loading" aria-busy="true">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="home-cat-sale-row home-cat-sale-row--skeleton">
                <div className="home-cat-sale-row__scroll rec-row__scroll">
                  {Array.from({ length: 5 }).map((__, j) => (
                    <div key={j} className="rec-row__item">
                      <ProductCard loading />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="api-error-banner" role="alert">
            <p>
              <strong>Sale categories could not be loaded.</strong> {error}
            </p>
          </div>
        ) : (
          rows.map((row) => (
            <CategorySaleRow
              key={row.category?.slug || row.category?._id}
              category={row.category}
              products={row.products}
              onAddToCart={onAddToCart}
            />
          ))
        )}
      </div>
    </section>
  );
}
