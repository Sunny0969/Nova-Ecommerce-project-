import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import BlogHero from '../components/BlogHero';
import BlogCard from '../components/BlogCard';
import FilterDropdown from '../components/FilterDropdown';
import SecondaryCarouselRow from '../components/SecondaryCarouselRow';
import NewsletterCTA from '../components/NewsletterCTA';
import QuickLinksGrid from '../components/QuickLinksGrid';
import { blogAPI } from '../api';
import './Blog.css';


import toast from 'react-hot-toast';

function useBlogCategories() {
  // We don't have a categories endpoint wired in yet; derive from current posts list.
  // This keeps UI same and avoids extra backend calls.
  return React.useMemo(() => {
    return ['All'];
  }, []);
}



const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'popular', label: 'Most relevant' }
];

function sortBlogs(list, sort) {
  const arr = [...list];
  if (sort === 'oldest') return arr.sort((a, b) => (a?.sortDate || '').localeCompare(b?.sortDate || ''));
  if (sort === 'popular') {
    // Deterministic “popular”: prefer tag + longer description + reading minutes.
    return arr.sort((a, b) => {
      const score = (x) => (x?.tag ? 30 : 0) + (x?.readingMinutes ? x.readingMinutes : 0) + String(x?.description || '').length / 50;
      return score(b) - score(a);
    });
  }
  // newest
  return arr.sort((a, b) => (b?.sortDate || '').localeCompare(a?.sortDate || ''));
}

export default function Blog() {
  const [searchValue, setSearchValue] = useState('');
  const [category, setCategory] = useState('All');

  // Quick robustness: ensure we can always show posts even if category filter is mismatched
  // (some backends store category casing differently).
  const normalizedCategory = category === 'All' ? 'All' : String(category).trim().toLowerCase();
  const [sort, setSort] = useState('newest');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [posts, setPosts] = useState([]);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await blogAPI.list({
          category: category === 'All' ? undefined : category,
          q: searchValue || undefined,
          sort
        });
        if (!mounted) return;
        console.log('[Blog] /api/blog/posts response:', res?.data);
        // Backend might return different shapes; support common variants.
        const maybePosts = res?.data?.posts ?? res?.data?.data?.posts ?? res?.data?.items ?? [];
        setPosts(Array.isArray(maybePosts) ? maybePosts : []);

      } catch (e) {
        if (!mounted) return;
        setError(e?.response?.data?.message || 'Failed to load posts. Please try again.');
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, [category, searchValue, sort]);

  const filtered = useMemo(() => {
    const q = searchValue.trim().toLowerCase();

    let list = Array.isArray(posts) ? posts : [];


    if (category !== 'All') list = list.filter((b) => String(b?.category) === category);

    if (q) {
      list = list.filter((b) => {
        const hay = [b?.title, b?.description, b?.category, b?.tag, b?.destinationLabel].filter(Boolean).join(' ').toLowerCase();
        return hay.includes(q);
      });
    }

    return sortBlogs(list, sort);
  }, [searchValue, category, sort]);

  const visibleBlogs = filtered.slice(0, 9);
  const secondaryBlogs = filtered.slice(0, 8).slice(0, 4);


  const quickLinks = useMemo(() => {
    // 24 buttons; original destinations for theme.
    const base = [
      { id: 'ql1', label: 'Shoe Care', url: '/shop?category=home' },
      { id: 'ql2', label: 'Laundry Essentials', url: '/shop?category=home' },
      { id: 'ql3', label: 'Device Care', url: '/shop?category=electronics' },
      { id: 'ql4', label: 'Chargers & Cables', url: '/shop?category=electronics' },
      { id: 'ql5', label: 'Ambient Lighting', url: '/shop?category=home' },
      { id: 'ql6', label: 'Home Storage', url: '/shop?category=home' },
      { id: 'ql7', label: 'Skincare Picks', url: '/shop?category=beauty' },
      { id: 'ql8', label: 'Hair Essentials', url: '/shop?category=beauty' },
      { id: 'ql9', label: 'Run Essentials', url: '/shop?category=sport' },
      { id: 'ql10', label: 'Fitness Comfort', url: '/shop?category=sport' },
      { id: 'ql11', label: 'Everyday Style', url: '/shop?category=fashion' },
      { id: 'ql12', label: 'Seasonal Layers', url: '/shop?category=fashion' },

      { id: 'ql13', label: 'Fresh Home Cleaning', url: '/shop?category=home' },
      { id: 'ql14', label: 'Air Care Devices', url: '/shop?category=electronics' },
      { id: 'ql15', label: 'Focus Desk Setup', url: '/shop?category=electronics' },
      { id: 'ql16', label: 'Coffee Corner Refresh', url: '/shop?category=home' },
      { id: 'ql17', label: 'Morning Rituals', url: '/shop?category=home' },
      { id: 'ql18', label: 'Wardrobe Reset', url: '/shop?category=fashion' },
      { id: 'ql19', label: 'Styling Basics', url: '/shop?category=fashion' },
      { id: 'ql20', label: 'Glow Routines', url: '/shop?category=beauty' },
      { id: 'ql21', label: 'Recovery Essentials', url: '/shop?category=sport' },
      { id: 'ql22', label: 'Checklist Gear', url: '/shop?category=sport' },
      { id: 'ql23', label: 'Care That Lasts', url: '/shop?category=home' },
      { id: 'ql24', label: 'Tech Simplified', url: '/shop?category=electronics' }
    ];
    return base;
  }, []);

  const handleRetry = () => {
    toast.success('Retrying…');
    setError(null);
    setLoading(true);
    window.setTimeout(() => setLoading(false), 600);
  };

  const heroIllustrationImage = 'https://images.unsplash.com/photo-1520975693415-35a9e6b0be0a?w=1200&auto=format&fit=crop&q=80';

  return (
    <>
      <SEO title="Blog" description="Browse articles and guides from Nova Shop." canonicalUrl="/blog" />

      {/* Keep existing top header / breadcrumb markup intact style-wise */}
      <header className="page-header">
        <div className="container">
          <h1 className="page-header__title">Blog</h1>
          <p className="page-header__subtitle">Stories and style notes from Nova — more posts coming soon.</p>
          <ol className="breadcrumb" aria-label="Breadcrumb">
            <li>
              <Link to="/">Home</Link>
            </li>
            <li className="active" aria-current="page">
              Blog
            </li>
          </ol>
        </div>
      </header>

      <BlogHero searchValue={searchValue} onSearchChange={setSearchValue} onSubmit={(e) => e.preventDefault()} />

      <main className="section section--blog" id="main-content">

        <div className="container blog-listing">
          <div className="blog-listing__head">
            <div>
              <span className="section-tag">Journal picks</span>
              <h2 className="blog-listing__title">Latest guides &amp; ideas</h2>
            </div>

            <div className="blog-filters" role="region" aria-label="Blog filters">
              <FilterDropdown
                id="blog-category"
                label="Category"
                value={category}
                onChange={setCategory}
                options={useBlogCategories().map((c) => ({ value: c, label: c }))}
              />

              <FilterDropdown
                id="blog-sort"
                label="Sort"
                value={sort}
                onChange={setSort}
                options={SORT_OPTIONS}
              />
            </div>
          </div>

          {loading ? (
            <div className="blog-grid" aria-busy="true">
              {Array.from({ length: 9 }).map((_, i) => (
                <BlogCard key={i} loading />
              ))}
            </div>
          ) : error ? (
            <div className="api-error-banner" role="alert">
              <p>
                <strong>Posts could not be loaded.</strong> {error}
              </p>
              <button type="button" className="btn btn-outline btn-sm" onClick={handleRetry}>
                Retry
              </button>
            </div>
          ) : visibleBlogs.length === 0 ? (
            <div className="blog-empty" role="status">
              <p className="blog-empty__title">No matches found</p>
              <p className="blog-empty__sub">Try clearing filters or searching for a different topic.</p>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => {
                  setCategory('All');
                  setSort('newest');
                  setSearchValue('');
                }}
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="blog-grid" aria-label="Blog grid">
              {visibleBlogs.map((b, idx) => (
                <BlogCard key={b.id} blog={b} priority={idx < 6} />
              ))}

            </div>
          )}
        </div>
      </main>

      <SecondaryCarouselRow title="Trending this week">
        {secondaryBlogs.map((b) => (
          <div key={b.id} className="blog-carousel__item">
            <BlogCard blog={b} variant="carousel" />
          </div>
        ))}
      </SecondaryCarouselRow>

      <NewsletterCTA />

      <QuickLinksGrid links={quickLinks} />

      {/* Preload removed to avoid browser warning when the hero image isn't consumed immediately. */}
    </>
  );
}

