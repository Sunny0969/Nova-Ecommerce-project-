import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import { buildMetaDescription, buildPageTitle } from '../utils/pageSeo';
import BlogHero from '../components/BlogHero';
import BlogCard from '../components/BlogCard';
import FilterDropdown from '../components/FilterDropdown';
// import NewsletterCTA from '../components/NewsletterCTA';
import QuickLinksGrid from '../components/QuickLinksGrid';
import { blogAPI } from '../api';
import api from '../api/client';
import { unwrapCategoriesResponse } from '../lib/api';
import { BLOG_QUICK_LINK_SPECS, resolveBlogQuickLinks } from '../data/blogQuickLinks';
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
  const [sort, setSort] = useState('newest');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [posts, setPosts] = useState([]);
  const [shopCategories, setShopCategories] = useState([]);

  useEffect(() => {
    let mounted = true;
    api
      .get('/api/categories')
      .then((res) => {
        if (!mounted) return;
        setShopCategories(unwrapCategoriesResponse(res));
      })
      .catch(() => {
        if (!mounted) return;
        setShopCategories([]);
      });
    return () => {
      mounted = false;
    };
  }, []);

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


    if (category !== 'All') {
      const normalizedCategory = String(category).trim().toLowerCase();
      list = list.filter((b) => String(b?.category || '').trim().toLowerCase() === normalizedCategory);
    }

    if (q) {
      list = list.filter((b) => {
        const hay = [b?.title, b?.description, b?.category, b?.tag, b?.destinationLabel].filter(Boolean).join(' ').toLowerCase();
        return hay.includes(q);
      });
    }

    return sortBlogs(list, sort);
  }, [posts, searchValue, category, sort]);

  const visibleBlogs = filtered.slice(0, 9);

  const quickLinks = useMemo(
    () => resolveBlogQuickLinks(BLOG_QUICK_LINK_SPECS, shopCategories),
    [shopCategories]
  );

  const handleRetry = () => {
    toast.success('Retrying…');
    setError(null);
    setLoading(true);
    window.setTimeout(() => setLoading(false), 600);
  };

  return (
    <>
      <SEO
        title={buildPageTitle('Shopping Guides & Tips', 'Blog')}
        description={buildMetaDescription(
          'shopping guides Pakistan',
          'Read care, home, fashion, and tech articles with product picks from our shop.',
          'Expert tips from Bazaar editorial.'
        )}
        canonicalUrl="/blog"
      />

      {/* Breadcrumb only — single H1 lives in BlogHero for SEO hierarchy */}
      <header className="page-header page-header--compact page-header--blog">
        <div className="container">
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

      <div className="section section--blog">

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
      </div>

      {/* <NewsletterCTA /> */}

      {quickLinks.length > 0 ? <QuickLinksGrid links={quickLinks} /> : null}

      {/* Preload removed to avoid browser warning when the hero image isn't consumed immediately. */}
    </>
  );
}

