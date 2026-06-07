import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { LayoutGrid, List, SlidersHorizontal, Search, X } from 'lucide-react';
import { useCart } from '../context/CartContext';
import ProductCard from '../components/ProductCard';
import Pagination from '../components/Pagination';
import CategoryShopSeo from '../components/CategoryShopSeo';
import SEO from '../components/SEO';
import { getCanonicalUrl, buildBreadcrumbListSchema } from '../utils/seo';
import { buildMetaDescription, buildPageTitle, getShopListingCanonicalPath } from '../utils/pageSeo';
import { getCategorySeoContent } from '../data/categorySeoContent';
import {
  buildFAQPageSchema,
  buildSpeakableSpecificationSchema,
  filterValidFaqs
} from '../utils/jsonLd';
import { unwrapProductListResponse, unwrapCategoriesResponse, apiMessage } from '../lib/api';
import api from 'api';

const PAGE_SIZE = 50;
const VIEW_STORAGE_KEY = 'Souvenir Handicraft-shop-products-view';

function categoriesFromSearchParams(searchParams) {
  const multi = searchParams.getAll('category');
  if (multi.length) {
    return [...new Set(multi.map((s) => String(s).trim()).filter(Boolean))];
  }
  const legacy = searchParams.get('cat');
  if (legacy && legacy !== 'all') return [String(legacy).trim()];
  return [];
}

function useMediaQuery(query) {
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false
  );
  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setMatches(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [query]);
  return matches;
}

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const isDesktopFilters = useMediaQuery('(min-width: 1025px)');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerCloseRef = useRef(null);

  const [items, setItems] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [refetchToken, setRefetchToken] = useState(0);
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState(null);
  const [categoryTags, setCategoryTags] = useState([]);
  const [categoryTagsLoading, setCategoryTagsLoading] = useState(false);
  const [brands, setBrands] = useState([]);

  const [viewMode, setViewMode] = useState(() => {
    try {
      const v = localStorage.getItem(VIEW_STORAGE_KEY);
      return v === 'list' ? 'list' : 'grid';
    } catch {
      return 'grid';
    }
  });

  const page = Math.max(1, parseInt(searchParams.get('page'), 10) || 1);
  const sort = searchParams.get('sort') || 'newest';
  const searchUrl = (searchParams.get('search') || '').trim();
  const minPriceUrl = searchParams.get('minPrice') || '';
  const maxPriceUrl = searchParams.get('maxPrice') || '';
  const ratingUrl = searchParams.get('rating') || '';
  const inStock = searchParams.get('inStock') === 'true';
  const onSale = searchParams.get('onSale') === 'true';
  const selectedTag = (searchParams.get('tag') || '').trim();
  const selectedBrandSlug = (searchParams.get('brand') || '').trim().toLowerCase();
  const selectedCategories = useMemo(
    () => categoriesFromSearchParams(searchParams),
    [searchParams]
  );

  const [searchInput, setSearchInput] = useState(searchUrl);
  const [minDraft, setMinDraft] = useState(minPriceUrl);
  const [maxDraft, setMaxDraft] = useState(maxPriceUrl);

  useEffect(() => setSearchInput(searchUrl), [searchUrl]);
  useEffect(() => setMinDraft(minPriceUrl), [minPriceUrl]);
  useEffect(() => setMaxDraft(maxPriceUrl), [maxPriceUrl]);

  const searchParamsRef = useRef(searchParams);
  searchParamsRef.current = searchParams;

  useEffect(() => {
    if (searchInput === searchUrl) return;
    const t = window.setTimeout(() => {
      const next = new URLSearchParams(searchParamsRef.current);
      const q = searchInput.trim();
      if (q) next.set('search', q);
      else next.delete('search');
      next.set('page', '1');
      setSearchParams(next, { replace: true });
    }, 300);
    return () => window.clearTimeout(t);
  }, [searchInput, searchUrl, setSearchParams]);

  const searchPending = searchInput.trim() !== searchUrl;

  const { addToCart } = useCart();

  const fetchCategories = useCallback(async () => {
    setCategoriesLoading(true);
    setCategoriesError(null);
    try {
      const res = await api.get('/api/categories');
      const list = unwrapCategoriesResponse(res);
      setCategories(Array.isArray(list) ? list : []);
    } catch (error) {
      console.error(error);
      setCategoriesError(String(apiMessage(error, 'Failed to load categories') || 'Failed to load categories'));
      setCategories([]);
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get('/api/brands');
        const list = res?.data?.data;
        if (!cancelled) setBrands(Array.isArray(list) ? list : []);
      } catch {
        if (!cancelled) setBrands([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const querySignature = searchParams.toString();

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setFetchError(null);
      setLoading(true);
      const sp = new URLSearchParams(querySignature);
      const p = Math.max(1, parseInt(sp.get('page'), 10) || 1);
      const s = sp.get('sort') || 'newest';
      const q = (sp.get('search') || '').trim();
      const mn = sp.get('minPrice') || '';
      const mx = sp.get('maxPrice') || '';
      const r = sp.get('rating') || '';
      const stock = sp.get('inStock') === 'true';
      const sale = sp.get('onSale') === 'true';
      const cats = categoriesFromSearchParams(sp);

      const params = new URLSearchParams();
      params.set('page', String(p));
      params.set('limit', String(PAGE_SIZE));
      params.set('sort', s);
      cats.forEach((c) => params.append('category', c));
      if (q) params.set('search', q);
      if (mn) params.set('minPrice', mn);
      if (mx) params.set('maxPrice', mx);
      if (r) params.set('rating', r);
      if (stock) params.set('inStock', 'true');
      if (sale) params.set('onSale', 'true');
      const tag = (sp.get('tag') || '').trim();
      if (tag) params.set('tag', tag);
      const brand = (sp.get('brand') || '').trim().toLowerCase();
      if (brand) params.set('brand', brand);

      try {
        const response = await api.get(`/api/products?${params.toString()}`);
        const { products, totalCount: tc, totalPages: tp } = unwrapProductListResponse(response);
        if (cancelled) return;
        setItems(products);
        setTotalCount(typeof tc === 'number' ? tc : products.length);
        setTotalPages(tp || 1);
      } catch (error) {
        console.error(error);
        if (cancelled) return;
      const msg =
        error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')
            ? 'Cannot reach the API. Is the backend running on port 5001?'
            : apiMessage(error, 'Failed to load products');
      setFetchError(String(msg || 'Failed to load products'));
        setItems([]);
        setTotalCount(0);
        setTotalPages(1);
    } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [querySignature, refetchToken, setSearchParams]);

  useEffect(() => {
    if (loading || totalPages < 1) return;
    if (page > totalPages) {
      const next = new URLSearchParams(searchParams);
      next.set('page', String(totalPages));
      setSearchParams(next, { replace: true });
    }
  }, [loading, totalPages, page, searchParams, setSearchParams]);

  useEffect(() => {
    if (drawerOpen && isDesktopFilters) setDrawerOpen(false);
  }, [drawerOpen, isDesktopFilters]);

  useEffect(() => {
    if (!drawerOpen) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [drawerOpen]);

  useEffect(() => {
    if (drawerOpen) drawerCloseRef.current?.focus();
  }, [drawerOpen]);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setDrawerOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [drawerOpen]);

  const setView = (mode) => {
    const next = mode === 'list' ? 'list' : 'grid';
    setViewMode(next);
    try {
      localStorage.setItem(VIEW_STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  };

  const updateParams = (mutator) => {
    const next = new URLSearchParams(searchParams);
    mutator(next);
    setSearchParams(next);
  };

  const toggleCategory = (slug) => {
    const s = String(slug || '').trim().toLowerCase();
    if (!s) return;
    updateParams((next) => {
      next.delete('cat');
      next.delete('tag');
      const set = new Set(next.getAll('category').map((x) => String(x).trim()).filter(Boolean));
      if (set.has(s)) set.delete(s);
      else set.add(s);
      next.delete('category');
      Array.from(set).forEach((c) => next.append('category', c));
      next.set('page', '1');
    });
  };

  const setSubcategoryTag = (tag) => {
    updateParams((next) => {
      const t = String(tag || '').trim();
      if (t) next.set('tag', t);
      else next.delete('tag');
      next.set('page', '1');
    });
  };

  const commitPriceRange = () => {
    updateParams((next) => {
      const mn = minDraft.trim();
      const mx = maxDraft.trim();
      if (mn) next.set('minPrice', mn);
      else next.delete('minPrice');
      if (mx) next.set('maxPrice', mx);
      else next.delete('maxPrice');
      next.set('page', '1');
    });
  };

  const setRating = (value) => {
    updateParams((next) => {
      if (value) next.set('rating', value);
      else next.delete('rating');
      next.set('page', '1');
    });
  };

  const setInStock = (checked) => {
    updateParams((next) => {
      if (checked) next.set('inStock', 'true');
      else next.delete('inStock');
      next.set('page', '1');
    });
  };

  const setSort = (value) => {
    updateParams((next) => {
      if (value && value !== 'newest') next.set('sort', value);
      else next.delete('sort');
      next.set('page', '1');
    });
  };

  const clearAllFilters = () => {
    setSearchParams(new URLSearchParams(), { replace: false });
    setSearchInput('');
    setMinDraft('');
    setMaxDraft('');
  };

  const clearSearchOnly = () => {
    setSearchInput('');
    updateParams((next) => {
      next.delete('search');
      next.set('page', '1');
    });
  };

  const goPage = (p) => {
    updateParams((next) => {
      if (p <= 1) next.delete('page');
      else next.set('page', String(p));
    });
  };

  const handleAddToCart = async (product) => {
    await addToCart(product, 1);
  };

  const filterPanel = (
    <div className="shop-filters-panel">
      <div className="filter-sidebar__title-wrap">
        <h2 className="filter-sidebar__title" id="shop-filters-heading">
          Filters
        </h2>
        {!isDesktopFilters && (
          <button
            type="button"
            className="shop-drawer-close"
            ref={drawerCloseRef}
            onClick={() => setDrawerOpen(false)}
            aria-label="Close filters"
          >
            <X size={22} strokeWidth={1.75} />
          </button>
        )}
      </div>

      <div className="filter-section">
        <h3 className="filter-section__title">Category</h3>
        {categoriesLoading ? (
          <p className="filter-panel__hint" aria-busy="true">
            Loading categories…
          </p>
        ) : categoriesError ? (
          <p className="filter-panel__error" role="alert">
            {categoriesError}
          </p>
        ) : categories.length === 0 ? (
          <p className="filter-panel__hint">No categories yet.</p>
        ) : (
          <ul className="filter-checklist">
            {categories.map((cat) => {
              const slug = (cat.slug || '').toLowerCase();
              const name = cat.name || slug;
              const checked = selectedCategories.some((c) => c.toLowerCase() === slug);
              return (
                <li key={cat._id || slug}>
                  <label className="filter-checklist__label">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleCategory(slug)}
                      disabled={!slug}
                    />
                    <span>{name}</span>
                  </label>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="filter-section">
        <h3 className="filter-section__title">Price range</h3>
        <div className="filter-price-row">
          <label className="filter-price-field">
            <span className="filter-price-field__label">Min (PKR)</span>
            <input
              type="number"
              className="form-control form-control--compact"
              min={0}
              step={0.01}
              placeholder="0"
              value={minDraft}
              onChange={(e) => setMinDraft(e.target.value)}
              onBlur={commitPriceRange}
            />
          </label>
          <label className="filter-price-field">
            <span className="filter-price-field__label">Max (PKR)</span>
            <input
              type="number"
              className="form-control form-control--compact"
              min={0}
              step={0.01}
              placeholder="Any"
              value={maxDraft}
              onChange={(e) => setMaxDraft(e.target.value)}
              onBlur={commitPriceRange}
            />
          </label>
        </div>
        <button type="button" className="btn btn-outline btn-sm filter-price-apply" onClick={commitPriceRange}>
          Apply prices
        </button>
      </div>

      <div className="filter-section">
        <h3 className="filter-section__title">Rating</h3>
        <fieldset className="filter-rating-fieldset">
          <legend className="visually-hidden">Minimum rating</legend>
          {[
            ['', 'Any rating'],
            ['4', '4★ & up'],
            ['3', '3★ & up'],
            ['2', '2★ & up'],
            ['1', '1★ & up']
          ].map(([val, label]) => (
            <label key={val || 'any'} className="filter-radio-row">
              <input
                type="radio"
                name="shop-rating"
                value={val}
                checked={ratingUrl === val}
                onChange={() => setRating(val)}
              />
              <span>{label}</span>
            </label>
          ))}
        </fieldset>
      </div>

      <div className="filter-section">
        <label className="filter-switch-row">
          <span className="filter-switch-row__text">In stock only</span>
          <input
            type="checkbox"
            className="filter-switch-input"
            checked={inStock}
            onChange={(e) => setInStock(e.target.checked)}
            role="switch"
            aria-checked={inStock}
          />
        </label>
      </div>

      <button type="button" className="btn btn-outline filter-clear-all" onClick={clearAllFilters}>
        Clear all filters
      </button>
    </div>
  );

  const gridClass =
    viewMode === 'list'
      ? 'products-grid products-grid--shop products-grid--list'
      : 'products-grid products-grid--shop';

  const skeletonCount = viewMode === 'list' ? 4 : 9;

  const activeBrand = useMemo(() => {
    if (!selectedBrandSlug) return null;
    return brands.find((b) => String(b.slug || '').toLowerCase() === selectedBrandSlug) || null;
  }, [brands, selectedBrandSlug]);

  const shopBreadcrumbLabel = useMemo(() => {
    if (activeBrand?.name) return String(activeBrand.name);
    if (searchUrl) return `“${searchUrl}” – Shop`;
    if (selectedCategories.length > 0) {
      if (selectedCategories.length === 1) {
        const s = selectedCategories[0];
        const cat = categories.find((c) => (c.slug || '').toLowerCase() === String(s).toLowerCase());
        if (cat && cat.name) return String(cat.name);
        return s.replace(/[-_]+/g, ' ').replace(/\b\w/g, (ch) => ch.toUpperCase());
      }
      return 'Shop (filtered)';
    }
    if (onSale) return 'On sale – Shop';
    if (inStock) return 'In stock only – Shop';
    if (minPriceUrl || maxPriceUrl || ratingUrl) return 'Shop (filtered)';
    return 'Shop';
  }, [activeBrand, searchUrl, selectedCategories, categories, onSale, inStock, minPriceUrl, maxPriceUrl, ratingUrl]);

  const activeCategory = useMemo(() => {
    if (selectedCategories.length !== 1) return null;
    const slug = String(selectedCategories[0] || '').toLowerCase();
    return categories.find((c) => String(c.slug || '').toLowerCase() === slug) || null;
  }, [selectedCategories, categories]);

  const activeCategorySlug = activeCategory?.slug
    ? String(activeCategory.slug).toLowerCase()
    : '';

  useEffect(() => {
    if (!activeCategorySlug) {
      setCategoryTags([]);
      return;
    }
    let cancelled = false;
    const loadTags = async () => {
      setCategoryTagsLoading(true);
      try {
        const res = await api.get(
          `/api/products/category-tags?category=${encodeURIComponent(activeCategorySlug)}`
        );
        const list = res?.data?.data;
        if (cancelled) return;
        setCategoryTags(
          Array.isArray(list)
            ? list.filter((row) => row && row.tag).map((row) => ({
                tag: String(row.tag),
                count: typeof row.count === 'number' ? row.count : 0
              }))
            : []
        );
      } catch (error) {
        console.error(error);
        if (!cancelled) setCategoryTags([]);
      } finally {
        if (!cancelled) setCategoryTagsLoading(false);
      }
    };
    loadTags();
    return () => {
      cancelled = true;
    };
  }, [activeCategorySlug]);

  useEffect(() => {
    if (!selectedTag) return;
    if (!activeCategorySlug) {
      updateParams((next) => {
        next.delete('tag');
        next.set('page', '1');
      });
      return;
    }
    if (categoryTagsLoading) return;
    if (categoryTags.length === 0) return;
    const valid = categoryTags.some((row) => row.tag === selectedTag);
    if (!valid) {
      updateParams((next) => {
        next.delete('tag');
        next.set('page', '1');
      });
    }
  }, [selectedTag, activeCategorySlug, categoryTags, categoryTagsLoading, setSearchParams]);

  const headerTitle = activeBrand?.name
    ? String(activeBrand.name)
    : activeCategory?.name
      ? String(activeCategory.name)
      : 'Shop';
  const headerSubtitle = activeBrand?.name
    ? `Browse all ${activeBrand.name} products — add to cart with secure checkout.`
    : activeCategory?.description
      ? String(activeCategory.description)
      : 'Browse the full catalog — refine with filters or search by name.';

  const listingSeo = useMemo(() => {
    const canonicalPath = getShopListingCanonicalPath(searchParams);
    const shopListUrl = getCanonicalUrl(canonicalPath);
    const catLabel = activeBrand?.name || activeCategory?.name || headerTitle;
    const title = activeBrand?.name
      ? buildPageTitle(`Buy ${catLabel} Online`, 'Best Prices PKR')
      : activeCategory?.name
        ? buildPageTitle(`Buy ${catLabel} Online`, 'Best Prices PKR')
        : buildPageTitle('Shop Online Pakistan', 'Groceries & Lifestyle');
    const description = activeBrand?.name
      ? buildMetaDescription(
          `Buy ${catLabel} online`,
          'Compare prices and get fast delivery. Secure checkout.',
          `Shop ${catLabel} products at Souvenir Handicraft Shop.`
        )
      : activeCategory?.name
        ? buildMetaDescription(
            `Buy ${catLabel} online`,
            'Compare prices, filter by brand, and get fast delivery. Secure checkout.',
            activeCategory?.description || `Shop ${catLabel} at Souvenir Handicraft Shop.`
          )
        : buildMetaDescription(
            'Online shopping Pakistan',
            'Browse groceries, homecare, fashion, and electronics with secure payment.',
            'Souvenir Handicraft Shop — curated products delivered across Pakistan.'
          );
    return { shopListUrl, title, description };
  }, [searchParams, activeBrand, activeCategory, headerTitle]);

  const { listingCanonicalUrl, listingBreadcrumbJsonLd } = useMemo(() => {
    const shopListUrl = listingSeo.shopListUrl;
    if (selectedBrandSlug) {
      const name =
        activeBrand?.name ||
        selectedBrandSlug.replace(/[-_]+/g, ' ').replace(/\b\w/g, (ch) => ch.toUpperCase());
      return {
        listingCanonicalUrl: shopListUrl,
        listingBreadcrumbJsonLd: buildBreadcrumbListSchema([
          { name: 'Home', path: '/' },
          { name: 'Brands', path: '/brands' },
          { name, url: shopListUrl }
        ])
      };
    }
    if (selectedCategories.length === 1) {
      const slug = selectedCategories[0];
      const cat = categories.find(
        (c) => (c.slug || '').toLowerCase() === String(slug).toLowerCase()
      );
      const name =
        (cat && cat.name) ||
        String(slug)
          .replace(/[-_]+/g, ' ')
          .replace(/\b\w/g, (ch) => ch.toUpperCase());
      return {
        listingCanonicalUrl: shopListUrl,
        listingBreadcrumbJsonLd: buildBreadcrumbListSchema([
          { name: 'Home', path: '/' },
          { name: 'Shop', path: '/shop' },
          { name, url: shopListUrl }
        ])
      };
    }
    return {
      listingCanonicalUrl: shopListUrl,
      listingBreadcrumbJsonLd: buildBreadcrumbListSchema([
        { name: 'Home', path: '/' },
        { name: 'Shop', url: shopListUrl }
      ])
    };
  }, [searchParams, selectedBrandSlug, activeBrand, selectedCategories, categories, listingSeo.shopListUrl]);

  const listingJsonLd = useMemo(() => {
    const schemas = [];
    if (listingBreadcrumbJsonLd) schemas.push(listingBreadcrumbJsonLd);

    if (activeCategorySlug) {
      const seoContent = getCategorySeoContent(activeCategorySlug);
      const faqSchema = buildFAQPageSchema(filterValidFaqs(seoContent?.faqs));
      if (faqSchema) schemas.push(faqSchema);

      const speakable = buildSpeakableSpecificationSchema(listingCanonicalUrl, [
        '#category-seo-heading',
        '#category-seo-summary'
      ]);
      if (speakable) schemas.push(speakable);
    }

    return schemas.length ? schemas : null;
  }, [listingBreadcrumbJsonLd, activeCategorySlug, listingCanonicalUrl]);

  return (
    <>
      <SEO
        title={listingSeo.title}
        description={listingSeo.description}
        canonicalUrl={listingCanonicalUrl}
        schema={listingJsonLd}
      />
      <header className="page-header">
        <div className="container">
          <h1 className="page-header__title">{headerTitle}</h1>
          <p className="page-header__subtitle">{headerSubtitle}</p>
          <ol className="breadcrumb" aria-label="Breadcrumb">
            <li>
              <Link to="/">Home</Link>
            </li>
            {selectedBrandSlug ? (
              <li>
                <Link to="/brands">Brands</Link>
              </li>
            ) : selectedCategories.length === 1 ? (
              <li>
                <Link to="/shop">Shop</Link>
              </li>
            ) : null}
            <li className="active" aria-current="page">
              {shopBreadcrumbLabel}
            </li>
          </ol>

          <form
            className="shop-search-row shop-search-row--header"
            role="search"
            aria-label="Search products"
            onSubmit={(e) => {
              e.preventDefault();
              const next = new URLSearchParams(searchParams);
              const q = searchInput.trim();
              if (q) next.set('search', q);
              else next.delete('search');
              next.set('page', '1');
              setSearchParams(next);
            }}
          >
            <div className="shop-search-row__field">
              <Search className="shop-search-row__icon" size={20} strokeWidth={1.75} aria-hidden />
              <input
                type="search"
                className="form-control shop-search-row__input"
                placeholder="Search products…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                aria-label="Search products"
              />
            </div>
            <button type="submit" className="btn btn-primary shop-search-row__submit">
              Search
            </button>
          </form>
        </div>
      </header>

      <main className="section shop-page" id="main-content">
        <div className="container">
          {!isDesktopFilters && (
            <div className="shop-mobile-filter-bar">
              <button
                type="button"
                className="btn btn-outline shop-filters-open-btn"
                onClick={() => setDrawerOpen(true)}
                aria-expanded={drawerOpen}
                aria-controls="shop-filters-drawer"
              >
                <SlidersHorizontal size={18} strokeWidth={1.75} aria-hidden />
                Filters
                {selectedCategories.length > 0 ||
                selectedBrandSlug ||
                minPriceUrl ||
                maxPriceUrl ||
                ratingUrl ||
                inStock ? (
                  <span className="shop-filters-open-btn__badge" aria-hidden />
                ) : null}
              </button>
            </div>
          )}

          <div className="shop-layout shop-layout--Souvenir Handicraft">
            {isDesktopFilters ? (
              <aside className="filter-sidebar shop-filters-desktop" aria-labelledby="shop-filters-heading">
                {filterPanel}
              </aside>
            ) : null}

            {!isDesktopFilters && drawerOpen ? (
              <div
                className="shop-filters-drawer-backdrop"
                role="presentation"
                onClick={() => setDrawerOpen(false)}
              />
            ) : null}

            {!isDesktopFilters && drawerOpen ? (
              <div
                id="shop-filters-drawer"
                className="shop-filters-drawer"
                role="dialog"
                aria-modal="true"
                aria-labelledby="shop-filters-heading"
              >
                <div className="shop-filters-drawer__sheet">
                  <div className="filter-sidebar shop-filters-drawer__inner">{filterPanel}</div>
                </div>
              </div>
            ) : null}

            <div className="shop-main">
              {activeBrand ? (
                <div className="shop-brand-bar" aria-label="Active brand filter">
                  <div className="shop-brand-bar__identity">
                    {activeBrand.imageUrl ? (
                      <img
                        className="shop-brand-bar__logo"
                        src={activeBrand.imageUrl}
                        alt=""
                        width={48}
                        height={48}
                        loading="lazy"
                        decoding="async"
                      />
                    ) : null}
                    <div>
                      <p className="shop-brand-bar__label">Brand</p>
                      <p className="shop-brand-bar__name">{activeBrand.name}</p>
                    </div>
                  </div>
                  <div className="shop-brand-bar__actions">
                    <Link to="/brands" className="btn btn-outline btn-sm">
                      All brands
                    </Link>
                    <button
                      type="button"
                      className="shop-brand-bar__clear"
                      onClick={() =>
                        updateParams((next) => {
                          next.delete('brand');
                          next.set('page', '1');
                        })
                      }
                    >
                      Clear filter
                    </button>
                  </div>
                </div>
              ) : null}
          {fetchError && (
            <div className="api-error-banner" role="alert">
                  <p>
                    <strong>Products could not be loaded.</strong> {fetchError}
                  </p>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => setRefetchToken((n) => n + 1)}
                  >
                Retry
              </button>
            </div>
          )}

              {activeCategory && (categoryTagsLoading || categoryTags.length > 0) ? (
                <div
                  className="shop-subcategory-bar"
                  role="toolbar"
                  aria-label={`${headerTitle} subcategories`}
                >
                  <div className="shop-subcategory-chips">
                    <button
                      type="button"
                      className={`shop-subcategory-chip${
                        !selectedTag ? ' shop-subcategory-chip--active' : ''
                      }`}
                      aria-pressed={!selectedTag}
                      disabled={categoryTagsLoading}
                      onClick={() => setSubcategoryTag('')}
                    >
                      All
                    </button>
                    {categoryTags.map(({ tag }) => (
                      <button
                        key={tag}
                        type="button"
                        className={`shop-subcategory-chip${
                          selectedTag === tag ? ' shop-subcategory-chip--active' : ''
                        }`}
                        aria-pressed={selectedTag === tag}
                        onClick={() => setSubcategoryTag(tag)}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="shop-toolbar shop-toolbar--Souvenir Handicraft">
                <p className="results-count" aria-live="polite">
                  {loading || searchPending ? (
                    <span className="results-count__label">
                      {searchPending && !loading ? 'Searching…' : 'Loading results…'}
                    </span>
                  ) : (
                    <>
                      <span className="results-count__num">{totalCount}</span>
                      <span className="results-count__label">
                        {' '}
                        result{totalCount !== 1 ? 's' : ''}
                      </span>
                    </>
                  )}
                </p>
                <div className="shop-toolbar__right shop-toolbar__controls">
                  <label className="shop-sort-label">
                    <span className="visually-hidden">Sort by</span>
              <select 
                className="sort-select" 
                      value={sort}
                      onChange={(e) => setSort(e.target.value)}
              >
                      <option value="newest">Newest</option>
                      <option value="popular">Popular</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                      <option value="rating">Rating</option>
                <option value="name">Name A–Z</option>
              </select>
                  </label>
                  <div className="view-toggle" role="group" aria-label="Product layout">
                    <button
                      type="button"
                      className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                      onClick={() => setView('grid')}
                      aria-pressed={viewMode === 'grid'}
                      aria-label="Grid view"
                    >
                      <LayoutGrid size={18} strokeWidth={1.75} />
                    </button>
                    <button
                      type="button"
                      className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                      onClick={() => setView('list')}
                      aria-pressed={viewMode === 'list'}
                      aria-label="List view"
                    >
                      <List size={18} strokeWidth={1.75} />
                    </button>
                  </div>
            </div>
          </div>

              {loading && items.length === 0 ? (
                <div className={gridClass} aria-busy="true">
                  {Array.from({ length: skeletonCount }).map((_, i) => (
                    <ProductCard key={i} loading layout={viewMode} />
                  ))}
            </div>
              ) : fetchError && items.length === 0 ? (
                <p className="empty-products-hint empty-products-hint--muted">Fix the connection and retry.</p>
              ) : items.length === 0 ? (
                <div className="shop-empty-state" role="status">
                  {activeBrand ? (
                    <>
                      <p className="shop-empty-state__title">No products found for {activeBrand.name}</p>
                      <p className="shop-empty-state__sub">
                        This brand may not have matching items in our catalog yet. Browse all products or pick another
                        brand.
                      </p>
                      <div className="shop-empty-suggestions">
                        <Link to="/brands" className="btn btn-outline btn-sm">
                          All brands
                        </Link>
                        <Link to="/shop" className="btn btn-primary btn-sm">
                          Browse all products
                        </Link>
                      </div>
                    </>
                  ) : searchUrl ? (
                    <>
                      <p className="shop-empty-state__title">No products found for &ldquo;{searchUrl}&rdquo;</p>
                      <p className="shop-empty-state__sub">
                        Try a shorter search, check spelling, or browse by category. Clearing the search shows the
                        full catalog again.
                      </p>
                      <div className="shop-empty-suggestions">
                        <button type="button" className="btn btn-outline btn-sm" onClick={clearSearchOnly}>
                          Clear search
                        </button>
                        <Link to="/shop" className="btn btn-primary btn-sm">
                          Browse all products
                        </Link>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="shop-empty-state__title">No products match your filters</p>
                      <p className="shop-empty-state__sub">
                        Try clearing filters, widening the price range, or using different search words.
                      </p>
                    </>
                  )}
                  <button type="button" className="btn btn-outline" onClick={clearAllFilters}>
                    Clear all filters
                  </button>
            </div>
          ) : (
                <>
                  <div className={gridClass} role="list">
                    {items.map((product) => (
                <ProductCard 
                  key={product._id} 
                  product={product} 
                  onAddToCart={handleAddToCart}
                        layout={viewMode}
                />
              ))}
            </div>
                  <div className="shop-pagination-wrap">
                    <Pagination
                      currentPage={page}
                      totalPages={totalPages}
                      onPageChange={(p) => {
                        goPage(p);
                        const el = document.getElementById('main-content');
                        el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }}
                      ariaLabel="Product list pagination"
                    />
                  </div>
                </>
              )}

              {activeCategorySlug && activeCategory && !loading ? (
                <CategoryShopSeo
                  categorySlug={activeCategorySlug}
                  categoryName={headerTitle}
                  products={items}
                />
              ) : null}
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default Products;
