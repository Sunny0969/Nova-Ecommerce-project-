import React, { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  getCanonicalUrl,
  formatPageTitle,
  getDefaultOgImageUrl,
  defaultDescription,
  siteName,
  defaultOgLocale,
  defaultTitle
} from '../utils/seo';
import { truncateMetaDescription, truncateTitle } from '../utils/pageSeo';

/**
 * Per-route meta + Open Graph + Twitter via react-helmet-async.
 * Use on every public page; pass unique title, description, and canonicalUrl.
 *
 * @param {object} props
 * @param {string} [props.title] — ≤60 chars with keyword first; or full title if it contains | or —
 * @param {string} [props.description] — 140–160 chars, unique per page
 * @param {string} [props.canonicalUrl] — absolute URL or path starting with /
 * @param {string} [props.ogImage] — absolute image URL
 * @param {string} [props.ogImageAlt] — alt text for social preview image
 * @param {string} [props.ogType] — website | product | article
 * @param {string} [props.keywords] — optional comma-separated meta keywords
 * @param {boolean} [props.noIndex] — noindex for cart, checkout, account, admin
 * @param {object|Array<object>} [props.schema] — JSON-LD
 * @param {Array<object>} [props.preload] — link rel=preload hints
 */
export default function SEO({
  title,
  description,
  canonicalUrl,
  ogImage,
  ogImageAlt,
  ogType,
  keywords,
  noIndex,
  schema,
  preload
}) {
  const { pathname } = useLocation();

  const absoluteCanonical = useMemo(() => {
    if (canonicalUrl != null && String(canonicalUrl).trim() !== '') {
      const c = String(canonicalUrl).trim();
      if (c.startsWith('http://') || c.startsWith('https://')) return c;
      const path = c.startsWith('/') ? c : `/${c}`;
      return getCanonicalUrl(path);
    }
    return getCanonicalUrl(pathname);
  }, [canonicalUrl, pathname]);

  const fullTitle = useMemo(() => {
    if (title == null || String(title).trim() === '') return truncateTitle(defaultTitle);
    const raw = String(title).trim();
    if (raw.includes('|') || raw.includes('—')) return truncateTitle(raw);
    return truncateTitle(formatPageTitle(raw));
  }, [title]);

  const desc = useMemo(() => {
    const raw =
      description != null && String(description).trim() !== ''
        ? String(description).trim()
        : defaultDescription;
    return truncateMetaDescription(raw);
  }, [description]);

  const keywordContent = useMemo(() => {
    const raw = keywords != null ? String(keywords).trim() : '';
    return raw || null;
  }, [keywords]);

  const img = ogImage != null && String(ogImage).trim() !== '' ? String(ogImage).trim() : getDefaultOgImageUrl();
  const imageAlt =
    ogImageAlt != null && String(ogImageAlt).trim() !== ''
      ? String(ogImageAlt).trim()
      : fullTitle;
  const type = ogType != null && String(ogType).trim() !== '' ? String(ogType).trim() : 'website';
  const robots = noIndex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large, max-snippet:-1';

  const jsonLd = useMemo(() => {
    if (schema == null) return null;
    if (Array.isArray(schema)) {
      return schema.map((s, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(s)}
        </script>
      ));
    }
    return <script type="application/ld+json">{JSON.stringify(schema)}</script>;
  }, [schema]);

  const preloadLinks = useMemo(() => {
    if (!Array.isArray(preload) || !preload.length) return null;
    return preload.map((p, i) => {
      if (!p || !p.href) return null;
      const as = p.as || 'image';
      return (
        <link
          key={`preload-${i}`}
          rel="preload"
          href={p.href}
          as={as}
          {...(p.type ? { type: p.type } : {})}
          {...(p.crossOrigin ? { crossOrigin: p.crossOrigin } : {})}
          {...(p.imageSrcSet ? { imageSrcSet: p.imageSrcSet } : {})}
          {...(p.imageSizes ? { imageSizes: p.imageSizes } : {})}
        />
      );
    });
  }, [preload]);

  return (
    <Helmet htmlAttributes={{ lang: 'en' }}>
      {preloadLinks}
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      {keywordContent ? <meta name="keywords" content={keywordContent} /> : null}
      <link rel="canonical" href={absoluteCanonical} />
      <meta name="robots" content={robots} />
      <meta name="theme-color" content="#1A1A2E" />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content={defaultOgLocale} />
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:url" content={absoluteCanonical} />
      <meta property="og:image" content={img} />
      <meta property="og:image:alt" content={imageAlt} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image" content={img} />
      <meta name="twitter:image:alt" content={imageAlt} />
      {jsonLd}
    </Helmet>
  );
}
