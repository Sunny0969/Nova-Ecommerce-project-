import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import ProductCard from './ProductCard';
import { productsAPI } from '../api/storefront';
import { unwrapFeaturedResponse } from '../lib/api';
import './HomeFeaturedProducts.css';

export default function HomeFeaturedProducts({ onAddToCart }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await productsAPI.getFeatured();
        const list = unwrapFeaturedResponse(res);
        if (!cancelled) {
          if (Array.isArray(list) && list.length > 0) {
            setProducts(list.slice(0, 8));
          } else {
            const allRes = await productsAPI.getProducts({ limit: 8 });
            const allList = allRes?.data?.data?.products || allRes?.data?.products || [];
            if (!cancelled) setProducts(allList.slice(0, 8));
          }
        }
      } catch (err) {
        console.error('Featured products error:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="fashion-featured-section" aria-label="Featured products">
      <div className="fashion-featured-header">
        <h2 className="fashion-featured-title">Featured Products</h2>
        <Link to="/shop" className="fashion-featured-view-all">
          <span>View All</span>
          <ArrowRight size={15} strokeWidth={2.2} />
        </Link>
      </div>

      <div className="fashion-featured-grid">
        {loading
          ? Array.from({ length: 8 }).map((_, i) => <ProductCard key={i} loading />)
          : products.map((product) => (
              <ProductCard
                key={product._id || product.id}
                product={product}
                onAddToCart={onAddToCart}
              />
            ))}
      </div>
    </section>
  );
}
