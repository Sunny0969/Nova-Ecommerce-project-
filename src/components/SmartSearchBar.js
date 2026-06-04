import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Search, Sparkles, TrendingUp, BookOpen } from 'lucide-react';
import { productsAPI, api } from 'api';
import { apiMessage, unwrapProductListResponse } from '../lib/api';
import { formatPKR } from '../utils/currency';
import { productImageUrl } from '../lib/productImage';
import blogSearchIndex from '../data/blogSearchIndex.json';

const RECENT_KEY = 'nova_shop_recent_searches_v1';

function useDebouncedValue(value, delayMs) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = window.setTimeout(() => setV(value), delayMs);
    return () => window.clearTimeout(t);
  }, [value, delayMs]);
  return v;
}

function loadRecent() {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    const arr = JSON.parse(raw || '[]');
    return Array.isArray(arr) ? arr.filter(Boolean).slice(0, 8) : [];
  } catch {
    return [];
  }
}

function saveRecent(next) {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(next.slice(0, 8)));
  } catch {
    // ignore
  }
}

function matchBlogEntries(q, limit = 5) {
  const t = String(q || '')
    .trim()
    .toLowerCase();
  if (t.length < 2) return [];
  const entries = Array.isArray(blogSearchIndex) ? blogSearchIndex : [];
  return entries
    .filter((e) => {
      const blob = `${e.title || ''} ${e.excerpt || ''} ${(e.tags || []).join(' ')}`.toLowerCase();
      return blob.includes(t);
    })
    .slice(0, limit);
}

function buildLocalSuggestions(q, products, max = 6) {
  const lc = String(q || '')
    .trim()
    .toLowerCase();
  if (!lc) return [];
  const out = [];
  const seen = new Set([lc]);
  for (const p of products || []) {
    const n = String(p?.name || '').trim();
    if (!n) continue;
    const nl = n.toLowerCase();
    if (nl.includes(lc) && !seen.has(nl)) {
      seen.add(nl);
      out.push(n);
      if (out.length >= max) break;
    }
  }
  return out;
}

function trendingKey(row, i) {
  if (row && typeof row === 'object' && row.query != null) return String(row.query);
  if (typeof row === 'string') return row;
  return `t-${i}`;
}

function trendingLabel(row) {
  if (row && typeof row === 'object' && row.query != null) return String(row.query);
  if (typeof row === 'string') return row;
  return '';
}

export default function SmartSearchBar({
  value,
  onChange,
  onPick,
  placeholder = 'Search products, blogs & more…',
  isOpen,
  onClose,
  onFocus,
  inputRef,
  persistent = false
}) {
  const [searchRows, setSearchRows] = useState([]);
  const [listProducts, setListProducts] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [blogMatches, setBlogMatches] = useState([]);
  const [trending, setTrending] = useState([]);
  const [recent, setRecent] = useState(() => loadRecent());
  const [loading, setLoading] = useState(false);
  const [hint, setHint] = useState('');

  const debounced = useDebouncedValue(value, 300);
  const lastQueryRef = useRef('');

  const trimmed = String(debounced || '').trim();
  const rawTrim = String(value || '').trim();

  const refreshTrending = useCallback(async () => {
    try {
      const res = await api.get('/api/products/trending-searches');
      const d = res.data?.data;
      setTrending(Array.isArray(d) ? d : []);
    } catch {
      setTrending([]);
    }
  }, []);

  useEffect(() => {
    if (isOpen) refreshTrending();
  }, [isOpen, refreshTrending]);

  const run = useCallback(async () => {
    if (!isOpen) return;
    const q = String(trimmed);
    if (!q) {
      setSearchRows([]);
      setListProducts([]);
      setSuggestions([]);
      setBlogMatches([]);
      setHint('');
      return;
    }
    lastQueryRef.current = q;
    setLoading(true);
    setHint('');
    try {
      const [searchRes, listRes] = await Promise.all([
        productsAPI.search({ q }),
        productsAPI.getAll({ search: q, limit: 12, page: 1 }).catch(() => ({ data: {} }))
      ]);

      const rows = searchRes?.data?.data;
      setSearchRows(Array.isArray(rows) ? rows : []);

      const { products } = unwrapProductListResponse(listRes);
      setListProducts(Array.isArray(products) ? products : []);

      const blogs = matchBlogEntries(q);
      setBlogMatches(blogs);
      setSuggestions(buildLocalSuggestions(q, products));

      const hasProducts = (Array.isArray(products) && products.length > 0) || (Array.isArray(rows) && rows.length > 0);
      const hasBlogs = blogs.length > 0;
      if (!hasProducts && !hasBlogs) {
        setHint('No matches — try another word or browse the shop.');
      }
    } catch (e) {
      setHint(apiMessage(e, 'Search failed'));
      setSearchRows([]);
      setListProducts([]);
      setSuggestions([]);
      setBlogMatches([]);
    } finally {
      setLoading(false);
    }
  }, [isOpen, trimmed]);

  useEffect(() => {
    run();
  }, [run]);

  const mergedProducts = useMemo(() => {
    const seen = new Set();
    const out = [];
    for (const p of listProducts || []) {
      const slug = p?.slug;
      if (!slug || seen.has(slug)) continue;
      seen.add(slug);
      out.push({ kind: 'product', product: p });
    }
    for (const r of searchRows || []) {
      const slug = r?.slug;
      if (!slug || seen.has(slug)) continue;
      seen.add(slug);
      out.push({ kind: 'basic', row: r });
    }
    return out.slice(0, 12);
  }, [listProducts, searchRows]);

  const showDropdown = isOpen;

  const onPickQuery = (q) => {
    const s = String(q || '').trim();
    if (!s) return;
    const next = [s, ...recent.filter((x) => x !== s)];
    setRecent(next);
    saveRecent(next);
    onPick?.({ type: 'query', query: s });
  };

  const onPickProduct = async (p) => {
    const slug = p?.slug;
    if (!slug) return;
    const q = String(lastQueryRef.current || '').trim();
    if (q) {
      const next = [q, ...recent.filter((x) => x !== q)];
      setRecent(next);
      saveRecent(next);
    }
    if (p?._id) {
      try {
        await api.post('/api/products/search-click', {
          query: q,
          productId: p._id,
          source: 'smart-search'
        });
      } catch {
        // ignore
      }
    }
    onPick?.({ type: 'product', slug, product: p });
  };

  const onPickBlog = (slug) => {
    const q = String(lastQueryRef.current || '').trim();
    if (q) {
      const next = [q, ...recent.filter((x) => x !== q)];
      setRecent(next);
      saveRecent(next);
    }
    onPick?.({ type: 'blog', slug });
  };

  return (
    <div className="smart-search" role="search">
      <div className="nav-search__field">
        <Search size={18} strokeWidth={1.75} className="nav-search__icon" aria-hidden="true" />
        <input
          ref={inputRef}
          type="search"
          className="nav-search__input"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          onFocus={onFocus}
          aria-autocomplete="list"
          aria-controls="nav-search-results"
          autoComplete="off"
        />
        <span className="smart-search__badge" title="Keyword search — no external AI">
          <Sparkles size={12} aria-hidden="true" /> Smart
        </span>
        {!persistent && onClose ? (
          <button type="button" className="nav-search__close" aria-label="Close search" onClick={onClose}>
            Close
          </button>
        ) : null}
      </div>

      {showDropdown && (
        <div className="nav-search__dropdown" id="nav-search-results" role="listbox">
          {loading && <div className="nav-search__hint">Searching…</div>}
          {!loading && rawTrim.length >= 1 && hint ? <div className="nav-search__hint">{hint}</div> : null}

          {!loading && rawTrim.length >= 1 && suggestions.length > 0 && (
            <div className="smart-search__section">
              <div className="smart-search__section-title">
                <Sparkles size={14} aria-hidden="true" /> Suggestions
              </div>
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  role="option"
                  className="nav-search__item smart-search__query"
                  onClick={() => onPickQuery(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {!loading && rawTrim.length >= 1 && mergedProducts.length > 0 && (
            <div className="smart-search__section">
              <div className="smart-search__section-title">
                <Search size={14} aria-hidden="true" /> Products
              </div>
              {mergedProducts.map((x) => {
                if (x.kind === 'product') {
                  const p = x.product;
                  return (
                    <button
                      key={p._id || p.slug}
                      type="button"
                      role="option"
                      className="nav-search__item smart-search__product"
                      onClick={() => onPickProduct(p)}
                    >
                      <span className="smart-search__thumb" aria-hidden="true">
                        <img src={productImageUrl(p)} alt="" />
                      </span>
                      <span className="smart-search__meta">
                        <span className="smart-search__name">{p.name}</span>
                        <span className="smart-search__price">{formatPKR(p.price)}</span>
                      </span>
                    </button>
                  );
                }
                return (
                  <button
                    key={x.row.slug}
                    type="button"
                    role="option"
                    className="nav-search__item smart-search__query"
                    onClick={() => onPick?.({ type: 'basic', slug: x.row.slug })}
                  >
                    {x.row.name}
                  </button>
                );
              })}
            </div>
          )}

          {!loading && rawTrim.length >= 1 && blogMatches.length > 0 && (
            <div className="smart-search__section">
              <div className="smart-search__section-title">
                <BookOpen size={14} aria-hidden="true" /> Blog
              </div>
              {blogMatches.map((post) => (
                <button
                  key={post.slug}
                  type="button"
                  role="option"
                  className="nav-search__item smart-search__blog"
                  onClick={() => onPickBlog(post.slug)}
                >
                  <span className="smart-search__blog-title">{post.title}</span>
                  <span className="smart-search__blog-excerpt">{post.excerpt}</span>
                </button>
              ))}
            </div>
          )}

          {!loading && rawTrim.length < 1 && recent.length > 0 && (
            <div className="smart-search__section">
              <div className="smart-search__section-title">Recent</div>
              {recent.map((s) => (
                <button
                  key={s}
                  type="button"
                  role="option"
                  className="nav-search__item smart-search__query"
                  onClick={() => onPickQuery(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {!loading && trending.length > 0 && (
            <div className="smart-search__section">
              <div className="smart-search__section-title">
                <TrendingUp size={14} aria-hidden="true" /> Trending
              </div>
              {trending.slice(0, 6).map((t, i) => {
                const label = trendingLabel(t);
                if (!label) return null;
                return (
                  <button
                    key={trendingKey(t, i)}
                    type="button"
                    role="option"
                    className="nav-search__item smart-search__query"
                    onClick={() => onPickQuery(label)}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
