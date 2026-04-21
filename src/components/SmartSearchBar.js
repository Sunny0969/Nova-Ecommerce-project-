import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Search, Sparkles, TrendingUp } from 'lucide-react';
import { productsAPI, api } from '../api/axios';
import { apiMessage } from '../lib/api';
import { formatPKR } from '../utils/currency';
import { productImageUrl } from '../lib/productImage';

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

export default function SmartSearchBar({
  value,
  onChange,
  onPick,
  placeholder = 'Search products…',
  isOpen,
  onClose,
  inputRef
}) {
  const [aiProducts, setAiProducts] = useState([]);
  const [basicResults, setBasicResults] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [trending, setTrending] = useState([]);
  const [recent, setRecent] = useState(() => loadRecent());
  const [loading, setLoading] = useState(false);
  const [hint, setHint] = useState('');

  const debounced = useDebouncedValue(value, 300);
  const lastQueryRef = useRef('');

  const trimmed = String(debounced || '').trim();

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
      setAiProducts([]);
      setBasicResults([]);
      setSuggestions([]);
      setHint('');
      return;
    }
    lastQueryRef.current = q;
    setLoading(true);
    setHint('');
    try {
      const [aiRes, basicRes, sugRes] = await Promise.all([
        api.get('/api/products/ai-search', { params: { q } }),
        productsAPI.search({ q }),
        api.get('/api/products/ai-suggest', { params: { q } }).catch(() => ({ data: { data: [] } }))
      ]);

      const ai = aiRes.data?.data?.products || [];
      setAiProducts(Array.isArray(ai) ? ai : []);

      const basic = basicRes?.data?.data || [];
      setBasicResults(Array.isArray(basic) ? basic : []);

      const sug = sugRes?.data?.data || [];
      setSuggestions(Array.isArray(sug) ? sug : []);

      if ((!ai || ai.length === 0) && (!basic || basic.length === 0)) {
        setHint('No matches');
      }
    } catch (e) {
      setHint(apiMessage(e, 'Search failed'));
      setAiProducts([]);
      setBasicResults([]);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, [isOpen, trimmed]);

  useEffect(() => {
    run();
  }, [run]);

  const mergedProducts = useMemo(() => {
    // Prefer AI results; fallback to basic.
    const seen = new Set();
    const out = [];
    for (const p of aiProducts || []) {
      const id = p?._id || p?.slug;
      if (!id || seen.has(id)) continue;
      seen.add(id);
      out.push({ kind: 'product', source: 'ai', product: p });
    }
    for (const r of basicResults || []) {
      const id = r?.slug;
      if (!id || seen.has(id)) continue;
      seen.add(id);
      out.push({ kind: 'basic', source: 'keyword', row: r });
    }
    return out.slice(0, 12);
  }, [aiProducts, basicResults]);

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
    try {
      await api.post('/api/products/search-click', {
        query: q,
        productId: p?._id,
        source: 'smart-search'
      });
    } catch {
      // ignore
    }
    onPick?.({ type: 'product', slug, product: p });
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
          aria-autocomplete="list"
          aria-controls="nav-search-results"
          autoComplete="off"
        />
        <span className="smart-search__badge" title="AI Search">
          <Sparkles size={14} aria-hidden="true" /> AI
        </span>
        <button type="button" className="nav-search__close" aria-label="Close search" onClick={onClose}>
          Close
        </button>
      </div>

      {isOpen && (String(value || '').trim().length >= 1 || loading) && (
        <div className="nav-search__dropdown" id="nav-search-results" role="listbox">
          {loading && <div className="nav-search__hint">Searching…</div>}
          {!loading && hint ? <div className="nav-search__hint">{hint}</div> : null}

          {!loading && suggestions.length > 0 && (
            <div className="smart-search__section">
              <div className="smart-search__section-title">
                <Sparkles size={14} aria-hidden="true" /> AI suggestions
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

          {!loading && mergedProducts.length > 0 && (
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

          {!loading && String(value || '').trim().length < 1 && recent.length > 0 && (
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
              {trending.slice(0, 6).map((t) => (
                <button
                  key={t.query}
                  type="button"
                  role="option"
                  className="nav-search__item smart-search__query"
                  onClick={() => onPickQuery(t.query)}
                >
                  {t.query}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

