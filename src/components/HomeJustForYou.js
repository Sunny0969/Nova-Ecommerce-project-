import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Flame, Sparkles, Loader2, ArrowUp, ShoppingBag } from 'lucide-react';
import ProductCard from './ProductCard';
import api from '../api/client';
import './HomeJustForYou.css';

const TABS = [
  { id: 'all', label: 'All Items', icon: Sparkles },
  { id: 'sale', label: 'On Sale', icon: Flame },
  { id: 'clothing', label: 'Fashion & Clothing' },
  { id: 'bags', label: 'Bags & Luggage' },
  { id: 'grocery', label: 'Grocery & Essentials' },
  { id: 'health-beauty', label: 'Health & Beauty' }
];

export default function HomeJustForYou({ onAddToCart }) {
  const [activeTab, setActiveTab] = useState('all');
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  const observerRef = useRef(null);
  const sentinelRef = useRef(null);
  const loadingRef = useRef(false);

  const fetchPage = useCallback(async (pageNum, tabId, replace = false) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);

    try {
      const params = {
        page: pageNum,
        limit: 12,
        sort: tabId === 'sale' ? 'discount' : 'popular'
      };

      if (tabId === 'sale') {
        params.onSale = true;
      } else if (tabId !== 'all') {
        params.category = tabId;
      }

      const res = await api.get('/api/products', { params });
      const data = res?.data?.data || res?.data || {};
      const newProducts = Array.isArray(data.products) ? data.products : [];
      const total = Number(data.totalCount) || 0;
      const totalPages = Number(data.totalPages) || 1;

      setTotalCount(total);
      setHasMore(pageNum < totalPages && newProducts.length > 0);

      setProducts((prev) => {
        if (replace) return newProducts;
        const existingIds = new Set(prev.map((p) => String(p._id || p.id)));
        const filteredNew = newProducts.filter((p) => !existingIds.has(String(p._id || p.id)));
        return [...prev, ...filteredNew];
      });
    } catch (err) {
      console.error('Failed to load Just For You products:', err);
      setHasMore(false);
    } finally {
      loadingRef.current = false;
      setLoading(false);
      setInitialLoading(false);
    }
  }, []);

  // Handle Tab Switch
  useEffect(() => {
    setProducts([]);
    setPage(1);
    setHasMore(true);
    setInitialLoading(true);
    fetchPage(1, activeTab, true);
  }, [activeTab, fetchPage]);

  // Infinite Scroll IntersectionObserver
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && hasMore && !loadingRef.current && !initialLoading) {
          setPage((prevPage) => {
            const nextPage = prevPage + 1;
            fetchPage(nextPage, activeTab, false);
            return nextPage;
          });
        }
      },
      { rootMargin: '300px' }
    );

    const currentSentinel = sentinelRef.current;
    if (currentSentinel) {
      observerRef.current.observe(currentSentinel);
    }

    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [hasMore, initialLoading, activeTab, fetchPage]);

  const handleManualLoadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchPage(nextPage, activeTab, false);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <section className="just-for-you-section" aria-label="Just For You Product Feed">
      <div className="container">
        {/* Header */}
        <div className="just-for-you-header">
          <div className="just-for-you-title-group">
            <span className="just-for-you-badge">
              <Flame size={16} className="just-for-you-badge-icon" />
              <span>TEMU & DARAZ STYLE FEED</span>
            </span>
            <h2 className="just-for-you-title">
              Just For You
              {totalCount > 0 && <span className="just-for-you-count">({totalCount}+ items)</span>}
            </h2>
            <p className="just-for-you-subtitle">
              Explore thousands of verified products with fast delivery across Pakistan
            </p>
          </div>
        </div>

        {/* Category / Filter Pills */}
        <div className="just-for-you-tabs" role="tablist">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                className={`just-for-you-tab-pill ${isActive ? 'just-for-you-tab-pill--active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {Icon && <Icon size={14} className="just-for-you-tab-icon" />}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Product Grid */}
        <div className="just-for-you-grid">
          {initialLoading
            ? Array.from({ length: 12 }).map((_, i) => <ProductCard key={i} loading />)
            : products.map((product) => (
                <ProductCard
                  key={product._id || product.id}
                  product={product}
                  onAddToCart={onAddToCart}
                />
              ))}
        </div>

        {/* Infinite Scroll Sentinel & Loading Indicator */}
        <div ref={sentinelRef} className="just-for-you-sentinel">
          {loading && !initialLoading && (
            <div className="just-for-you-loading-more">
              <Loader2 size={24} className="just-for-you-spinner" />
              <span>Loading more exciting deals...</span>
            </div>
          )}
        </div>

        {/* End of Feed / Load More Controls */}
        {!initialLoading && (
          <div className="just-for-you-footer">
            {hasMore ? (
              <button
                className="just-for-you-load-more-btn"
                onClick={handleManualLoadMore}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="just-for-you-spinner" />
                    <span>Loading...</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag size={16} />
                    <span>Load More Products</span>
                  </>
                )}
              </button>
            ) : (
              <div className="just-for-you-end-message">
                <p>🎉 You have explored all recommendations for this category!</p>
                <button className="just-for-you-top-btn" onClick={scrollToTop}>
                  <ArrowUp size={14} />
                  <span>Back to top</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
